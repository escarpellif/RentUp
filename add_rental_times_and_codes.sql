-- Adicionar campos de horário de retirada e devolução
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS return_time TIME;

-- Adicionar códigos de confirmação
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS owner_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS renter_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS owner_code_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS renter_code_used BOOLEAN DEFAULT false;

-- Adicionar valor sem taxa (valor que o locador recebe)
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS owner_amount DECIMAL(10, 2);

-- Comentários
COMMENT ON COLUMN rentals.pickup_time IS 'Horário de retirada do item';
COMMENT ON COLUMN rentals.return_time IS 'Horário de devolução do item';
COMMENT ON COLUMN rentals.owner_code IS 'Código do locador para confirmar retirada';
COMMENT ON COLUMN rentals.renter_code IS 'Código do locatário para confirmar devolução';
COMMENT ON COLUMN rentals.owner_code_used IS 'Se o código do locador foi usado';
COMMENT ON COLUMN rentals.renter_code_used IS 'Se o código do locatário foi usado';
COMMENT ON COLUMN rentals.owner_amount IS 'Valor que o locador recebe (sem taxa RentUp)';

