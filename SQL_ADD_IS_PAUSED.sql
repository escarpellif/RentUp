-- ============================================
-- ADICIONAR COLUNA IS_PAUSED NA TABELA ITEMS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Adicionar coluna para controlar se o item está pausado
ALTER TABLE items
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;

-- Adicionar comentário para documentação
COMMENT ON COLUMN items.is_paused IS 'Indica se o anúncio está pausado pelo proprietário';

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_items_is_paused ON items(is_paused);

-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'items'
AND column_name = 'is_paused';

-- Resultado esperado: 1 linha mostrando a coluna is_paused (boolean, default false)

