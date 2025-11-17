-- ============================================
-- ADICIONAR COLUNA REJECTION_REASON NA TABELA RENTALS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Adicionar coluna para armazenar o motivo da rejeição
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN rentals.rejection_reason IS 'Motivo da rejeição quando status = rejected';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rentals'
AND column_name = 'rejection_reason';

-- Resultado esperado: 1 linha mostrando a coluna rejection_reason

