-- Adicionar coluna subcategory na tabela items se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
        AND column_name = 'subcategory'
    ) THEN
        ALTER TABLE items ADD COLUMN subcategory TEXT;

        -- Criar índice para melhorar performance de busca
        CREATE INDEX IF NOT EXISTS idx_items_subcategory ON items(subcategory);

        RAISE NOTICE 'Coluna subcategory adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna subcategory já existe.';
    END IF;
END $$;

-- Comentário na coluna
COMMENT ON COLUMN items.subcategory IS 'Subcategoria do item (opcional, complementa a categoria principal)';

