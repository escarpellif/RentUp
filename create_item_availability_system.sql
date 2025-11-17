-- Criar tabela para rastrear disponibilidade dos itens
CREATE TABLE IF NOT EXISTS item_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'blocked', -- blocked, available
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_item_availability_item_id ON item_availability(item_id);
CREATE INDEX IF NOT EXISTS idx_item_availability_dates ON item_availability(item_id, start_date, end_date);

-- Habilitar RLS
ALTER TABLE item_availability ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver disponibilidade
CREATE POLICY "Todos podem ver disponibilidade"
ON item_availability FOR SELECT
TO authenticated
USING (true);

-- Política: Apenas donos podem inserir bloqueios
CREATE POLICY "Donos podem inserir bloqueios"
ON item_availability FOR INSERT
TO authenticated
WITH CHECK (
    item_id IN (
        SELECT id FROM items WHERE owner_id = auth.uid()
    )
);

-- Política: Apenas donos podem atualizar
CREATE POLICY "Donos podem atualizar bloqueios"
ON item_availability FOR UPDATE
TO authenticated
USING (
    item_id IN (
        SELECT id FROM items WHERE owner_id = auth.uid()
    )
);

-- Política: Apenas donos podem deletar
CREATE POLICY "Donos podem deletar bloqueios"
ON item_availability FOR DELETE
TO authenticated
USING (
    item_id IN (
        SELECT id FROM items WHERE owner_id = auth.uid()
    )
);

-- Função para bloquear datas automaticamente ao aprovar rental
CREATE OR REPLACE FUNCTION block_dates_on_rental_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Se status mudou para 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Inserir bloqueio de datas
        INSERT INTO item_availability (item_id, rental_id, start_date, end_date, status)
        VALUES (NEW.item_id, NEW.id, NEW.start_date::DATE, NEW.end_date::DATE, 'blocked')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Se status mudou para 'completed' ou 'cancelled', liberar datas
    IF (NEW.status = 'completed' OR NEW.status = 'cancelled' OR NEW.status = 'rejected')
       AND OLD.status = 'approved' THEN
        DELETE FROM item_availability
        WHERE rental_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_block_dates_on_rental_approval ON rentals;
CREATE TRIGGER trigger_block_dates_on_rental_approval
AFTER INSERT OR UPDATE ON rentals
FOR EACH ROW
EXECUTE FUNCTION block_dates_on_rental_approval();

-- Comentários
COMMENT ON TABLE item_availability IS 'Rastreia disponibilidade de itens baseado em aluguéis aprovados';
COMMENT ON COLUMN item_availability.status IS 'Status do bloqueio: blocked ou available';

