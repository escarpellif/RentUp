-- ============================================
-- SCRIPT COMPLETO DE DISPONIBILIDADE DE HORÁRIOS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Adicionar campos de disponibilidade na tabela items
ALTER TABLE items
ADD COLUMN IF NOT EXISTS pickup_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
ADD COLUMN IF NOT EXISTS pickup_time_start TIME DEFAULT '06:00',
ADD COLUMN IF NOT EXISTS pickup_time_end TIME DEFAULT '23:00',
ADD COLUMN IF NOT EXISTS flexible_hours BOOLEAN DEFAULT true;

-- 2. Adicionar campos de desconto
ALTER TABLE items
ADD COLUMN IF NOT EXISTS discount_week DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_month DECIMAL(5,2) DEFAULT 0;

-- 3. Adicionar campos de endereço completo
ALTER TABLE items
ADD COLUMN IF NOT EXISTS street VARCHAR(255),
ADD COLUMN IF NOT EXISTS complement VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'España',
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- 4. Adicionar campos de horários específicos (manhã, tarde, noite)
ALTER TABLE items
ADD COLUMN IF NOT EXISTS pickup_morning BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pickup_morning_start TIME DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS pickup_morning_end TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS pickup_afternoon BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pickup_afternoon_start TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS pickup_afternoon_end TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS pickup_evening BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pickup_evening_start TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS pickup_evening_end TIME DEFAULT '23:00';

-- 5. Comentários para documentação
COMMENT ON COLUMN items.pickup_days IS 'Días de la semana disponibles para recogida (array de strings)';
COMMENT ON COLUMN items.pickup_time_start IS 'Horario inicial de recogida';
COMMENT ON COLUMN items.pickup_time_end IS 'Horario final de recogida';
COMMENT ON COLUMN items.flexible_hours IS 'Si true, permite cualquier horario (06:00-23:00). Si false, usa horários específicos';
COMMENT ON COLUMN items.discount_week IS 'Descuento en porcentaje para alquileres de 1 semana o más';
COMMENT ON COLUMN items.discount_month IS 'Descuento en porcentaje para alquileres de 1 mes o más';
COMMENT ON COLUMN items.street IS 'Calle/Avenida del producto';
COMMENT ON COLUMN items.complement IS 'Complemento del endereço (piso, puerta, etc)';
COMMENT ON COLUMN items.city IS 'Ciudad';
COMMENT ON COLUMN items.country IS 'País';
COMMENT ON COLUMN items.postal_code IS 'Código postal';
COMMENT ON COLUMN items.pickup_morning IS 'Disponible para recogida por la mañana';
COMMENT ON COLUMN items.pickup_afternoon IS 'Disponible para recogida por la tarde';
COMMENT ON COLUMN items.pickup_evening IS 'Disponible para recogida por la noche';

-- 6. Verificar se as colunas foram criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'items'
AND column_name IN ('pickup_days', 'pickup_time_start', 'pickup_time_end', 'flexible_hours', 'discount_week', 'discount_month',
                     'street', 'complement', 'city', 'country', 'postal_code',
                     'pickup_morning', 'pickup_afternoon', 'pickup_evening');

-- Resultado esperado: 14 colunas adicionadas

-- ============================================
-- 7. ADICIONAR CAMPOS DE ENDEREÇO NA TABELA PROFILES
-- ============================================

-- Verificar se a tabela profiles já tem address, postal_code, city
-- Se não tiver, adicionar. Se tiver apenas address genérico, não precisa mudar.

-- OBS: A tabela profiles provavelmente já tem:
-- - address (VARCHAR)
-- - postal_code (VARCHAR)
-- - city (VARCHAR)

-- Se precisar adicionar, descomente as linhas abaixo:
-- ALTER TABLE profiles
-- ADD COLUMN IF NOT EXISTS address VARCHAR(255),
-- ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
-- ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Verificar colunas da tabela profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('address', 'postal_code', 'city');

-- OBS: O campo 'address' do profiles será mapeado para 'street' nos items
-- quando o usuário usar "Usar mi dirección de cadastro"

