-- ============================================
-- ATUALIZAR SISTEMA DE STATUS DAS LOCAÇÕES
-- ============================================

-- NOVOS STATUS:
-- 'pending' → Aguardando aprovação do locador
-- 'approved' → Aprovado, aguardando retirada
-- 'active' → Retirado e em locação (pickup confirmado)
-- 'awaiting_return' → Aguardando devolução (mesmo que 'active', mas com flag)
-- 'completed' → Devolvido e finalizado
-- 'cancelled' → Cancelado
-- 'rejected' → Rejeitado pelo locador

-- ============================================
-- 1. Adicionar campo return_confirmed_at se não existir
-- ============================================

ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS return_confirmed_at TIMESTAMPTZ;

COMMENT ON COLUMN rentals.return_confirmed_at IS 'Data/hora em que a devolução foi confirmada pelo locatário';

-- ============================================
-- 2. Atualizar lógica de status
-- ============================================

-- FLUXO COMPLETO:
-- 1. Usuário solicita → status: 'pending'
-- 2. Locador aprova → status: 'approved' (códigos gerados)
-- 3. Locador confirma entrega (valida renter_code) → status: 'active', pickup_confirmed_at preenchido
-- 4. Locatário confirma devolução (valida owner_code) → status: 'completed', return_confirmed_at preenchido

-- ============================================
-- 3. Função para validar transições de status
-- ============================================

CREATE OR REPLACE FUNCTION validate_rental_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Se status mudou para 'active', garantir que pickup_confirmed_at está preenchido
    IF NEW.status = 'active' AND OLD.status = 'approved' THEN
        IF NEW.pickup_confirmed_at IS NULL THEN
            NEW.pickup_confirmed_at = NOW();
        END IF;
    END IF;

    -- Se status mudou para 'completed', garantir que return_confirmed_at está preenchido
    IF NEW.status = 'completed' AND OLD.status = 'active' THEN
        IF NEW.return_confirmed_at IS NULL THEN
            NEW.return_confirmed_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Criar trigger para validar transições
-- ============================================

DROP TRIGGER IF EXISTS trigger_validate_rental_status ON rentals;

CREATE TRIGGER trigger_validate_rental_status
BEFORE UPDATE ON rentals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION validate_rental_status_transition();

-- ============================================
-- 5. Verificar estrutura atual
-- ============================================

SELECT
    id,
    status,
    pickup_confirmed_at,
    return_confirmed_at,
    start_date,
    end_date
FROM rentals
WHERE status IN ('approved', 'active')
ORDER BY start_date DESC
LIMIT 5;

-- ============================================
-- 6. COMENTÁRIOS SOBRE O FLUXO:
-- ============================================

/*
FLUXO COMPLETO COM CÓDIGOS:

1. SOLICITAÇÃO
   - Locatário solicita alugar item
   - Status: 'pending'
   - Códigos: NULL

2. APROVAÇÃO
   - Locador aprova
   - Status: 'approved'
   - Códigos: renter_code e owner_code gerados
   - Modal aparece para AMBOS (approved)

3. ENTREGA (PICKUP)
   - Locador vê: "Aguardando entrega"
   - Locatário vai buscar
   - Locatário MOSTRA: renter_code
   - Locador DIGITA: renter_code
   - Se correto:
     * Status: 'active'
     * pickup_confirmed_at: NOW()
   - Modal do LOCADOR desaparece
   - Modal do LOCATÁRIO continua (mas mudou de tipo)

4. LOCAÇÃO ATIVA
   - Status: 'active'
   - Item está com locatário
   - Modal do locatário mostra: "Devolva até XX/XX"
   - NÃO aparece modal para locador (aguardando devolução)

5. DEVOLUÇÃO (RETURN)
   - Locatário devolve item
   - Locador verifica condições
   - Locador MOSTRA: owner_code
   - Locatário DIGITA: owner_code
   - Se correto:
     * Status: 'completed'
     * return_confirmed_at: NOW()
   - Pagamento liberado ao locador
   - Modais desaparecem para AMBOS

RESUMO DOS MODAIS:

| Status | Locador vê modal? | Locatário vê modal? |
|--------|-------------------|---------------------|
| pending | ❌ (vê em "Mis Locaciones/Pendientes") | ❌ |
| approved | ✅ "Aguardando entrega" | ✅ "Vá buscar" |
| active | ❌ (aguardando devolução) | ✅ "Em locação, devolva" |
| completed | ❌ | ❌ |

CÓDIGOS:

| Momento | Quem mostra | Quem digita | Código |
|---------|-------------|-------------|--------|
| ENTREGA | Locatário | Locador | renter_code |
| DEVOLUÇÃO | Locador | Locatário | owner_code |
*/

-- ============================================
-- 7. Query para verificar locações por status
-- ============================================

-- Ver quantas locações em cada status
SELECT
    status,
    COUNT(*) as total
FROM rentals
GROUP BY status
ORDER BY
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'active' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'rejected' THEN 5
        WHEN 'cancelled' THEN 6
        ELSE 7
    END;

-- ============================================
-- 8. Corrigir locações existentes se necessário
-- ============================================

-- Se existem locações 'active' sem pickup_confirmed_at
UPDATE rentals
SET pickup_confirmed_at = created_at
WHERE status = 'active'
  AND pickup_confirmed_at IS NULL;

-- Se existem locações 'completed' sem return_confirmed_at
UPDATE rentals
SET return_confirmed_at = updated_at
WHERE status = 'completed'
  AND return_confirmed_at IS NULL;

-- ============================================
-- PRONTO!
-- ============================================

-- Agora o sistema tem:
-- ✅ Campo return_confirmed_at
-- ✅ Trigger para validar transições
-- ✅ Fluxo completo documentado
-- ✅ Queries para verificar

