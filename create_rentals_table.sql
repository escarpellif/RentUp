-- Criar tabela de solicitações de aluguel (rentals)
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    renter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    pickup_time TEXT,
    return_time TEXT,
    total_days INTEGER NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE rentals IS 'Solicitações de aluguel de itens';
COMMENT ON COLUMN rentals.status IS 'Status da solicitação: pending, approved, rejected, active, completed, cancelled';
COMMENT ON COLUMN rentals.service_fee IS 'Taxa de serviço da plataforma';
COMMENT ON COLUMN rentals.deposit_amount IS 'Valor do depósito de segurança';

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_rentals_item_id ON rentals(item_id);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON rentals(renter_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_created_at ON rentals(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ver suas próprias solicitações (como locatário ou proprietário)
CREATE POLICY "Usuários podem ver suas solicitações"
    ON rentals FOR SELECT
    USING (
        auth.uid() = renter_id OR
        auth.uid() = owner_id
    );

-- Policy: Usuários autenticados podem criar solicitações
CREATE POLICY "Usuários podem criar solicitações"
    ON rentals FOR INSERT
    WITH CHECK (auth.uid() = renter_id);

-- Policy: Proprietário pode atualizar status da solicitação
CREATE POLICY "Proprietário pode atualizar status"
    ON rentals FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_rentals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rentals_updated_at
    BEFORE UPDATE ON rentals
    FOR EACH ROW
    EXECUTE FUNCTION update_rentals_updated_at();

