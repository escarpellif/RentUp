-- ============================================
-- ADICIONAR COLUNA PICKUP_CONFIRMED_AT NA TABELA RENTALS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Adicionar coluna para registrar quando a entrega foi confirmada
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ;

-- Adicionar comentário para documentação
COMMENT ON COLUMN rentals.pickup_confirmed_at IS 'Data e hora em que o locador confirmou a entrega do item ao locatário';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rentals'
AND column_name = 'pickup_confirmed_at';

-- Resultado esperado: 1 linha mostrando a coluna pickup_confirmed_at (timestamp with time zone)

