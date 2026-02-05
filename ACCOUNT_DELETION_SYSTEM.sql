-- ============================================
-- SISTEMA DE SOLICITAÇÃO DE EXCLUSÃO DE CONTA
-- ============================================

-- 1. Criar tabela para armazenar solicitações de exclusão
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar índices
CREATE INDEX IF NOT EXISTS idx_account_deletion_user_id ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requested_at ON account_deletion_requests(requested_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view own deletion requests"
    ON account_deletion_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar solicitações para si mesmos
CREATE POLICY "Users can create own deletion requests"
    ON account_deletion_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias solicitações (apenas para cancelar)
CREATE POLICY "Users can update own deletion requests"
    ON account_deletion_requests
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- 5. Função para criar solicitação de exclusão
CREATE OR REPLACE FUNCTION request_account_deletion(
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_full_name TEXT;
    v_request_id UUID;
    v_existing_pending UUID;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;

    -- Verificar se já existe uma solicitação pendente
    SELECT id INTO v_existing_pending
    FROM account_deletion_requests
    WHERE user_id = v_user_id
    AND status = 'pending'
    LIMIT 1;

    IF v_existing_pending IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe uma solicitação de exclusão pendente',
            'request_id', v_existing_pending
        );
    END IF;

    -- Obter informações do usuário
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;

    SELECT full_name INTO v_full_name
    FROM profiles
    WHERE id = v_user_id;

    -- Criar solicitação
    INSERT INTO account_deletion_requests (
        user_id,
        email,
        full_name,
        reason,
        status
    ) VALUES (
        v_user_id,
        v_email,
        v_full_name,
        p_reason,
        'pending'
    )
    RETURNING id INTO v_request_id;

    RETURN json_build_object(
        'success', true,
        'request_id', v_request_id,
        'message', 'Solicitação de exclusão criada com sucesso'
    );
END;
$$;

-- 6. Função para processar exclusão de conta (apenas admin)
CREATE OR REPLACE FUNCTION process_account_deletion(
    p_request_id UUID,
    p_delete_data BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_request_status TEXT;
BEGIN
    -- Obter informações da solicitação
    SELECT user_id, status INTO v_user_id, v_request_status
    FROM account_deletion_requests
    WHERE id = p_request_id;

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solicitação não encontrada'
        );
    END IF;

    IF v_request_status != 'pending' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Solicitação já foi processada'
        );
    END IF;

    -- Atualizar status para processamento
    UPDATE account_deletion_requests
    SET status = 'processing',
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = p_request_id;

    IF p_delete_data THEN
        -- Deletar dados do usuário (em ordem para respeitar foreign keys)

        -- 1. Deletar notificações
        DELETE FROM notifications WHERE user_id = v_user_id;

        -- 2. Deletar mensagens
        DELETE FROM messages WHERE sender_id = v_user_id OR receiver_id = v_user_id;

        -- 3. Deletar favoritos
        DELETE FROM favorites WHERE user_id = v_user_id;

        -- 4. Atualizar aluguéis (manter histórico mas anonimizar)
        UPDATE rentals
        SET renter_id = NULL
        WHERE renter_id = v_user_id;

        -- 5. Deletar fotos dos itens
        DELETE FROM item_photos WHERE item_id IN (
            SELECT id FROM items WHERE owner_id = v_user_id
        );

        -- 6. Deletar itens
        DELETE FROM items WHERE owner_id = v_user_id;

        -- 7. Deletar perfil
        DELETE FROM profiles WHERE id = v_user_id;

        -- 8. Deletar usuário do auth
        DELETE FROM auth.users WHERE id = v_user_id;
    END IF;

    -- Atualizar status para completado
    UPDATE account_deletion_requests
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Conta excluída com sucesso'
    );
END;
$$;

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_account_deletion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_deletion_updated_at
    BEFORE UPDATE ON account_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_account_deletion_updated_at();

-- 8. Comentários
COMMENT ON TABLE account_deletion_requests IS 'Armazena solicitações de exclusão de conta dos usuários';
COMMENT ON FUNCTION request_account_deletion IS 'Cria uma solicitação de exclusão de conta para o usuário autenticado';
COMMENT ON FUNCTION process_account_deletion IS 'Processa uma solicitação de exclusão (apenas admin)';
