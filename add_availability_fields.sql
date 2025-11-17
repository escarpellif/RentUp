-- Adicionar campos de disponibilidade de horários na tabela items
ALTER TABLE items
ADD COLUMN IF NOT EXISTS pickup_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
ADD COLUMN IF NOT EXISTS pickup_time_start TIME DEFAULT '06:00',
ADD COLUMN IF NOT EXISTS pickup_time_end TIME DEFAULT '23:00',
ADD COLUMN IF NOT EXISTS flexible_hours BOOLEAN DEFAULT true;

-- Comentários
COMMENT ON COLUMN items.pickup_days IS 'Dias da semana disponíveis para retirada (array de strings)';
COMMENT ON COLUMN items.pickup_time_start IS 'Horário inicial de retirada';
COMMENT ON COLUMN items.pickup_time_end IS 'Horário final de retirada';
COMMENT ON COLUMN items.flexible_hours IS 'Se true, permite qualquer horário (06:00-23:00). Se false, usa horários específicos';

