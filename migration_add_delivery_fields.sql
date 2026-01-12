-- Adicionar campos de entrega à tabela items

-- Distância máxima de entrega em km
ALTER TABLE items ADD COLUMN IF NOT EXISTS delivery_distance DECIMAL(10,2);

-- Se a entrega é gratuita
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_free_delivery BOOLEAN DEFAULT true;

-- Valor cobrado pela entrega (se não for gratuita)
ALTER TABLE items ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- Comentários
COMMENT ON COLUMN items.delivery_distance IS 'Distancia máxima de entrega en kilómetros';
COMMENT ON COLUMN items.is_free_delivery IS 'Si la entrega es gratuita o no';
COMMENT ON COLUMN items.delivery_fee IS 'Valor cobrado por la entrega si no es gratuita';

