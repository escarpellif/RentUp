-- ============================================
-- MIGRAÇÃO: Adicionar campo is_active na tabela items
-- ============================================
-- Este campo controla se o anúncio está ativo ou pausado
-- Quando pausado (is_active = false), aparece como "No Disponible"

-- Adicionar coluna is_active (padrão true - ativo)
ALTER TABLE items
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Comentário
COMMENT ON COLUMN items.is_active IS 'Indica se o anúncio está ativo (true) ou pausado (false)';

-- Atualizar todos os registros existentes para ativo
UPDATE items
SET is_active = true
WHERE is_active IS NULL;

-- Verificar
SELECT id, title, is_active, is_available
FROM items
LIMIT 10;

