-- ============================================
-- DATABASE FUNCTIONS - VALIDAÇÃO BACKEND
-- Nunca confie apenas no frontend!
-- ============================================

-- ============================================
-- 1. VALIDAR CRIAÇÃO DE RENTAL
-- ============================================

CREATE OR REPLACE FUNCTION validate_rental_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação 1: Não pode alugar próprio item
    IF NEW.renter_id = NEW.owner_id THEN
        RAISE EXCEPTION 'Não é permitido alugar seu próprio item';
    END IF;

    -- Validação 2: Item deve existir e estar ativo
    IF NOT EXISTS (
        SELECT 1 FROM items
        WHERE id = NEW.item_id
        AND is_active = true
        AND is_paused = false
    ) THEN
        RAISE EXCEPTION 'Item não está disponível para aluguel';
    END IF;

    -- Validação 3: Renter deve estar verificado
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.renter_id
        AND verification_status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Usuário precisa estar verificado para alugar';
    END IF;

    -- Validação 4: Owner deve estar verificado
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.owner_id
        AND verification_status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Proprietário precisa estar verificado';
    END IF;

    -- Validação 5: Datas devem fazer sentido
    IF NEW.start_date >= NEW.end_date THEN
        RAISE EXCEPTION 'Data de início deve ser anterior à data de término';
    END IF;

    -- Validação 6: Não pode alugar no passado
    IF NEW.start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Não é possível alugar para datas passadas';
    END IF;

    -- Validação 7: Valores devem ser positivos
    IF NEW.total_amount <= 0 OR NEW.price_per_day <= 0 THEN
        RAISE EXCEPTION 'Valores devem ser maiores que zero';
    END IF;

    -- Validação 8: Depósito deve ser >= 0
    IF NEW.deposit_amount < 0 THEN
        RAISE EXCEPTION 'Valor do depósito inválido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS validate_rental_before_insert ON rentals;
CREATE TRIGGER validate_rental_before_insert
BEFORE INSERT ON rentals
FOR EACH ROW
EXECUTE FUNCTION validate_rental_creation();

-- ============================================
-- 2. VALIDAR CRIAÇÃO DE ITEM
-- ============================================

CREATE OR REPLACE FUNCTION validate_item_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação 1: Usuário deve estar verificado
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = NEW.owner_id
        AND verification_status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Usuário precisa estar verificado para anunciar itens';
    END IF;

    -- Validação 2: Título não pode estar vazio
    IF LENGTH(TRIM(NEW.title)) < 3 THEN
        RAISE EXCEPTION 'Título deve ter pelo menos 3 caracteres';
    END IF;

    -- Validação 3: Descrição não pode estar vazia
    IF LENGTH(TRIM(NEW.description)) < 10 THEN
        RAISE EXCEPTION 'Descrição deve ter pelo menos 10 caracteres';
    END IF;

    -- Validação 4: Preço deve ser positivo
    IF NEW.price_per_day <= 0 THEN
        RAISE EXCEPTION 'Preço por dia deve ser maior que zero';
    END IF;

    -- Validação 5: Depósito deve ser >= 0
    IF NEW.deposit_value < 0 THEN
        RAISE EXCEPTION 'Valor do depósito inválido';
    END IF;

    -- Validação 6: Categoria não pode estar vazia
    IF LENGTH(TRIM(NEW.category)) < 2 THEN
        RAISE EXCEPTION 'Categoria é obrigatória';
    END IF;

    -- Validação 7: Localização completa obrigatória
    IF NEW.postal_code IS NULL OR
       NEW.city IS NULL OR
       NEW.street IS NULL THEN
        RAISE EXCEPTION 'Endereço completo é obrigatório';
    END IF;

    -- Validação 8: Coordenadas obrigatórias
    IF NEW.coordinates IS NULL THEN
        RAISE EXCEPTION 'Coordenadas de localização são obrigatórias';
    END IF;

    -- Validação 9: Fotos obrigatórias
    IF NEW.photos IS NULL OR array_length(NEW.photos, 1) < 1 THEN
        RAISE EXCEPTION 'Pelo menos uma foto é obrigatória';
    END IF;

    -- Validação 10: Descontos devem ser entre 0 e 100
    IF NEW.discount_week IS NOT NULL AND (NEW.discount_week < 0 OR NEW.discount_week > 100) THEN
        RAISE EXCEPTION 'Desconto semanal deve estar entre 0 e 100';
    END IF;

    IF NEW.discount_month IS NOT NULL AND (NEW.discount_month < 0 OR NEW.discount_month > 100) THEN
        RAISE EXCEPTION 'Desconto mensal deve estar entre 0 e 100';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS validate_item_before_insert ON items;
CREATE TRIGGER validate_item_before_insert
BEFORE INSERT ON items
FOR EACH ROW
EXECUTE FUNCTION validate_item_creation();

-- ============================================
-- 3. VALIDAR VERIFICAÇÃO DE USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION validate_user_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação 1: Tipo de documento deve ser válido
    IF NEW.document_type NOT IN ('dni', 'passport', 'driver_license') THEN
        RAISE EXCEPTION 'Tipo de documento inválido';
    END IF;

    -- Validação 2: Número do documento não pode estar vazio
    IF LENGTH(TRIM(NEW.document_number)) < 5 THEN
        RAISE EXCEPTION 'Número do documento é obrigatório';
    END IF;

    -- Validação 3: Fotos obrigatórias
    IF NEW.document_photo_url IS NULL OR LENGTH(TRIM(NEW.document_photo_url)) < 5 THEN
        RAISE EXCEPTION 'Foto do documento é obrigatória';
    END IF;

    IF NEW.selfie_url IS NULL OR LENGTH(TRIM(NEW.selfie_url)) < 5 THEN
        RAISE EXCEPTION 'Selfie é obrigatória';
    END IF;

    -- Validação 4: Usuário pode ter apenas uma verificação pendente ou aprovada
    IF EXISTS (
        SELECT 1 FROM user_verifications
        WHERE user_id = NEW.user_id
        AND verification_status IN ('pending', 'approved')
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Já existe uma verificação pendente ou aprovada';
    END IF;

    -- Definir status padrão como pending
    IF NEW.verification_status IS NULL THEN
        NEW.verification_status := 'pending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS validate_verification_before_insert ON user_verifications;
CREATE TRIGGER validate_verification_before_insert
BEFORE INSERT ON user_verifications
FOR EACH ROW
EXECUTE FUNCTION validate_user_verification();

-- ============================================
-- 4. ATUALIZAR STATUS DE PERFIL APÓS VERIFICAÇÃO
-- ============================================

CREATE OR REPLACE FUNCTION update_profile_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando verificação for aprovada, atualizar perfil
    IF NEW.verification_status = 'approved' AND
       (OLD.verification_status IS NULL OR OLD.verification_status != 'approved') THEN

        UPDATE profiles
        SET verification_status = 'approved'
        WHERE id = NEW.user_id;

    END IF;

    -- Quando verificação for rejeitada, atualizar perfil
    IF NEW.verification_status = 'rejected' AND
       (OLD.verification_status IS NULL OR OLD.verification_status != 'rejected') THEN

        UPDATE profiles
        SET verification_status = 'pending'
        WHERE id = NEW.user_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS update_profile_after_verification ON user_verifications;
CREATE TRIGGER update_profile_after_verification
AFTER UPDATE ON user_verifications
FOR EACH ROW
EXECUTE FUNCTION update_profile_verification_status();

-- ============================================
-- 5. VALIDAR REVIEW
-- ============================================

CREATE OR REPLACE FUNCTION validate_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação 1: Rating entre 1 e 5
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        RAISE EXCEPTION 'Avaliação deve estar entre 1 e 5 estrelas';
    END IF;

    -- Validação 2: Deve ter participado da locação
    IF NOT EXISTS (
        SELECT 1 FROM rentals
        WHERE id = NEW.rental_id
        AND (owner_id = NEW.reviewer_id OR renter_id = NEW.reviewer_id)
        AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Apenas participantes de locações completadas podem avaliar';
    END IF;

    -- Validação 3: Não pode avaliar duas vezes a mesma locação
    IF EXISTS (
        SELECT 1 FROM reviews
        WHERE rental_id = NEW.rental_id
        AND reviewer_id = NEW.reviewer_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Você já avaliou esta locação';
    END IF;

    -- Validação 4: Comentário obrigatório se rating < 5
    IF NEW.rating < 5 AND (NEW.comment IS NULL OR LENGTH(TRIM(NEW.comment)) < 10) THEN
        RAISE EXCEPTION 'Comentário obrigatório para avaliações abaixo de 5 estrelas';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS validate_review_before_insert ON reviews;
CREATE TRIGGER validate_review_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION validate_review();

-- ============================================
-- 6. VALIDAR DISPUTA
-- ============================================

CREATE OR REPLACE FUNCTION validate_dispute()
RETURNS TRIGGER AS $$
BEGIN
    -- Validação 1: Tipos de problema não podem estar vazios
    IF array_length(NEW.issue_types, 1) IS NULL OR array_length(NEW.issue_types, 1) < 1 THEN
        RAISE EXCEPTION 'Pelo menos um tipo de problema deve ser selecionado';
    END IF;

    -- Validação 2: Observação obrigatória
    IF LENGTH(TRIM(NEW.observation)) < 10 THEN
        RAISE EXCEPTION 'Observação deve ter pelo menos 10 caracteres';
    END IF;

    -- Validação 3: Fotos obrigatórias
    IF array_length(NEW.photos, 1) IS NULL OR array_length(NEW.photos, 1) < 1 THEN
        RAISE EXCEPTION 'Pelo menos uma foto de evidência é obrigatória';
    END IF;

    -- Validação 4: Apenas owner pode criar disputa
    IF NOT EXISTS (
        SELECT 1 FROM rentals
        WHERE id = NEW.rental_id
        AND owner_id = NEW.owner_id
    ) THEN
        RAISE EXCEPTION 'Apenas o proprietário do item pode criar disputa';
    END IF;

    -- Validação 5: Locação deve existir e estar em processo de devolução
    IF NOT EXISTS (
        SELECT 1 FROM rentals
        WHERE id = NEW.rental_id
        AND status IN ('active', 'return_pending')
    ) THEN
        RAISE EXCEPTION 'Locação deve estar ativa ou aguardando devolução';
    END IF;

    -- Validação 6: Apenas uma disputa por locação
    IF EXISTS (
        SELECT 1 FROM rental_disputes
        WHERE rental_id = NEW.rental_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Já existe uma disputa para esta locação';
    END IF;

    -- Definir status padrão
    IF NEW.status IS NULL THEN
        NEW.status := 'open';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS validate_dispute_before_insert ON rental_disputes;
CREATE TRIGGER validate_dispute_before_insert
BEFORE INSERT ON rental_disputes
FOR EACH ROW
EXECUTE FUNCTION validate_dispute();

-- ============================================
-- 7. PREVENIR AUTO-FOLLOW
-- ============================================

-- Se existir tabela de follows (para funcionalidade futura)
-- CREATE OR REPLACE FUNCTION prevent_self_follow()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.follower_id = NEW.following_id THEN
--         RAISE EXCEPTION 'Não é possível seguir a si mesmo';
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================
-- 8. SANITIZAR INPUTS (Prevenir XSS)
-- ============================================

CREATE OR REPLACE FUNCTION sanitize_text_input()
RETURNS TRIGGER AS $$
BEGIN
    -- Remover HTML tags de campos de texto
    IF TG_TABLE_NAME = 'items' THEN
        NEW.title := regexp_replace(NEW.title, '<[^>]*>', '', 'g');
        NEW.description := regexp_replace(NEW.description, '<[^>]*>', '', 'g');
    END IF;

    IF TG_TABLE_NAME = 'reviews' THEN
        IF NEW.comment IS NOT NULL THEN
            NEW.comment := regexp_replace(NEW.comment, '<[^>]*>', '', 'g');
        END IF;
    END IF;

    IF TG_TABLE_NAME = 'rental_disputes' THEN
        NEW.observation := regexp_replace(NEW.observation, '<[^>]*>', '', 'g');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de sanitização
DROP TRIGGER IF EXISTS sanitize_item_input ON items;
CREATE TRIGGER sanitize_item_input
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION sanitize_text_input();

DROP TRIGGER IF EXISTS sanitize_review_input ON reviews;
CREATE TRIGGER sanitize_review_input
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION sanitize_text_input();

DROP TRIGGER IF EXISTS sanitize_dispute_input ON rental_disputes;
CREATE TRIGGER sanitize_dispute_input
BEFORE INSERT OR UPDATE ON rental_disputes
FOR EACH ROW
EXECUTE FUNCTION sanitize_text_input();

-- ============================================
-- 9. LOG DE AUDITORIA
-- ============================================

-- Criar tabela de auditoria (opcional, mas recomendado)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, user_id, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, user_id, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auditoria em tabelas críticas
DROP TRIGGER IF EXISTS audit_rentals ON rentals;
CREATE TRIGGER audit_rentals
AFTER INSERT OR UPDATE OR DELETE ON rentals
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_disputes ON rental_disputes;
CREATE TRIGGER audit_disputes
AFTER INSERT OR UPDATE OR DELETE ON rental_disputes
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON FUNCTION validate_rental_creation IS 'Valida criação de locação no backend';
COMMENT ON FUNCTION validate_item_creation IS 'Valida criação de item no backend';
COMMENT ON FUNCTION validate_user_verification IS 'Valida submissão de verificação';
COMMENT ON FUNCTION validate_review IS 'Valida criação de review';
COMMENT ON FUNCTION validate_dispute IS 'Valida criação de disputa';
COMMENT ON FUNCTION sanitize_text_input IS 'Remove HTML tags para prevenir XSS';
COMMENT ON FUNCTION audit_trigger_function IS 'Registra mudanças para auditoria';

-- ============================================
-- FIM - VALIDAÇÕES BACKEND IMPLEMENTADAS ✅
-- ============================================

