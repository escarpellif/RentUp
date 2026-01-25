-- ============================================
-- FEATURE FLAGS SYSTEM
-- Sistema de controle remoto de features
-- Kill switch para produção
-- ============================================

-- ============================================
-- 1. TABELA DE FEATURE FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),

    -- Metadados
    environment TEXT DEFAULT 'production', -- production, staging, development
    requires_version TEXT, -- Versão mínima do app
    expires_at TIMESTAMPTZ, -- Auto-desabilitar após data

    CONSTRAINT valid_environment CHECK (environment IN ('production', 'staging', 'development', 'all'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);

-- ============================================
-- 2. TABELA DE HISTÓRICO (Auditoria)
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'enabled', 'disabled', 'rollout_changed', 'created', 'deleted'
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_history_flag_id ON feature_flags_history(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_history_created_at ON feature_flags_history(created_at DESC);

-- ============================================
-- 3. TRIGGER PARA HISTÓRICO
-- ============================================

CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO feature_flags_history (flag_id, flag_name, action, new_value, changed_by)
        VALUES (
            NEW.id,
            NEW.name,
            'created',
            row_to_json(NEW),
            auth.uid()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log mudança de enabled
        IF OLD.enabled != NEW.enabled THEN
            INSERT INTO feature_flags_history (flag_id, flag_name, action, old_value, new_value, changed_by)
            VALUES (
                NEW.id,
                NEW.name,
                CASE WHEN NEW.enabled THEN 'enabled' ELSE 'disabled' END,
                jsonb_build_object('enabled', OLD.enabled),
                jsonb_build_object('enabled', NEW.enabled),
                auth.uid()
            );
        END IF;

        -- Log mudança de rollout
        IF OLD.rollout_percentage != NEW.rollout_percentage THEN
            INSERT INTO feature_flags_history (flag_id, flag_name, action, old_value, new_value, changed_by)
            VALUES (
                NEW.id,
                NEW.name,
                'rollout_changed',
                jsonb_build_object('percentage', OLD.rollout_percentage),
                jsonb_build_object('percentage', NEW.rollout_percentage),
                auth.uid()
            );
        END IF;

        -- Atualizar updated_at
        NEW.updated_at = NOW();
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO feature_flags_history (flag_id, flag_name, action, old_value, changed_by)
        VALUES (
            OLD.id,
            OLD.name,
            'deleted',
            row_to_json(OLD),
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS feature_flags_audit ON feature_flags;
CREATE TRIGGER feature_flags_audit
AFTER INSERT OR UPDATE OR DELETE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION log_feature_flag_change();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags_history ENABLE ROW LEVEL SECURITY;

-- Todos podem ler feature flags
CREATE POLICY "Feature flags são públicas"
ON feature_flags FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Apenas admin modifica flags"
ON feature_flags FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Todos podem ver histórico
CREATE POLICY "Histórico é público"
ON feature_flags_history FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 5. FEATURES INICIAIS
-- ============================================

INSERT INTO feature_flags (name, description, enabled, rollout_percentage, environment) VALUES
    -- Features críticas (OFF por padrão)
    ('new_payment_system', 'Novo sistema de pagamento com PIX', false, 0, 'production'),
    ('dispute_auto_resolution', 'Resolução automática de disputas', false, 0, 'production'),
    ('rental_insurance', 'Sistema de seguro para locações', false, 0, 'production'),

    -- Features estáveis (ON)
    ('chat_system', 'Sistema de chat entre usuários', true, 100, 'production'),
    ('review_system', 'Sistema de avaliações', true, 100, 'production'),
    ('document_verification', 'Verificação de documentos', true, 100, 'production'),

    -- Features em teste (Rollout gradual)
    ('advanced_search', 'Busca avançada com filtros', true, 25, 'production'),
    ('ai_recommendations', 'Recomendações por IA', true, 10, 'production'),

    -- Features de desenvolvimento
    ('debug_mode', 'Modo de debug', false, 0, 'development')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================

-- Verificar se feature está habilitada para um usuário
CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_flag_name TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_flag RECORD;
    v_user_hash INT;
BEGIN
    -- Buscar flag
    SELECT * INTO v_flag
    FROM feature_flags
    WHERE name = p_flag_name
    AND (environment = 'all' OR environment = current_setting('app.environment', true));

    IF NOT FOUND THEN
        -- Flag não existe, retornar false
        RETURN false;
    END IF;

    -- Se flag desabilitada, retornar false
    IF NOT v_flag.enabled THEN
        RETURN false;
    END IF;

    -- Se rollout 100%, retornar true
    IF v_flag.rollout_percentage >= 100 THEN
        RETURN true;
    END IF;

    -- Se rollout 0%, retornar false
    IF v_flag.rollout_percentage <= 0 THEN
        RETURN false;
    END IF;

    -- Calcular hash do usuário (consistente)
    v_user_hash := (hashtext(p_user_id::TEXT) % 100);

    -- Verificar se usuário está no rollout
    RETURN v_user_hash < v_flag.rollout_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- Listar features habilitadas para um usuário
CREATE OR REPLACE FUNCTION get_enabled_features(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(feature_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT name
    FROM feature_flags
    WHERE is_feature_enabled(name, p_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Kill switch de emergência (admin only)
CREATE OR REPLACE FUNCTION emergency_disable_feature(
    p_flag_name TEXT,
    p_reason TEXT DEFAULT 'Emergency disable'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Verificar se é admin
    SELECT role = 'admin' INTO v_is_admin
    FROM profiles
    WHERE id = auth.uid();

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Apenas administradores podem desabilitar features';
    END IF;

    -- Desabilitar feature
    UPDATE feature_flags
    SET
        enabled = false,
        rollout_percentage = 0,
        updated_at = NOW()
    WHERE name = p_flag_name;

    -- Log da ação
    INSERT INTO feature_flags_history (
        flag_id,
        flag_name,
        action,
        new_value,
        changed_by,
        reason
    )
    SELECT
        id,
        name,
        'emergency_disabled',
        jsonb_build_object('enabled', false, 'rollout_percentage', 0),
        auth.uid(),
        p_reason
    FROM feature_flags
    WHERE name = p_flag_name;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. VIEWS ÚTEIS
-- ============================================

-- View de features ativas
CREATE OR REPLACE VIEW active_features AS
SELECT
    name,
    description,
    rollout_percentage,
    environment,
    updated_at
FROM feature_flags
WHERE enabled = true
ORDER BY rollout_percentage DESC, name;

-- View de mudanças recentes
CREATE OR REPLACE VIEW recent_flag_changes AS
SELECT
    ffh.flag_name,
    ffh.action,
    ffh.old_value,
    ffh.new_value,
    ffh.reason,
    p.username as changed_by,
    ffh.created_at
FROM feature_flags_history ffh
LEFT JOIN profiles p ON ffh.changed_by = p.id
ORDER BY ffh.created_at DESC
LIMIT 50;

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE feature_flags IS 'Sistema de feature flags para controle remoto de funcionalidades';
COMMENT ON TABLE feature_flags_history IS 'Histórico de mudanças em feature flags (auditoria)';
COMMENT ON FUNCTION is_feature_enabled IS 'Verifica se uma feature está habilitada para um usuário específico';
COMMENT ON FUNCTION emergency_disable_feature IS 'Kill switch de emergência (apenas admin)';

-- ============================================
-- FIM - FEATURE FLAGS IMPLEMENTADO ✅
-- ============================================

