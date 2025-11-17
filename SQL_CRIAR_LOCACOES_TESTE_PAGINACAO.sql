-- ============================================
-- CRIAR LOCAÇÕES DE TESTE PARA TESTAR PAGINAÇÃO
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- IMPORTANTE: Substitua os IDs pelos seus IDs reais do banco!
-- Para encontrar seus IDs:
-- SELECT id, email FROM auth.users;
-- SELECT id, full_name FROM profiles;

-- ============================================
-- EXEMPLO 1: Criar 3 Locações para TESTAR LOCATÁRIO
-- (Usuário está alugando 3 itens diferentes)
-- ============================================

-- SUBSTITUA ESTES IDs:
-- 'RENTER_ID' → ID do usuário locatário (quem aluga)
-- 'OWNER_ID' → ID do usuário locador (dono do item)
-- 'ITEM_ID_1', 'ITEM_ID_2', 'ITEM_ID_3' → IDs de 3 itens diferentes

INSERT INTO rentals (
    renter_id,
    owner_id,
    item_id,
    start_date,
    end_date,
    pickup_time,
    return_time,
    status,
    total_amount,
    subtotal,
    service_fee,
    owner_amount,
    renter_code,
    owner_code
) VALUES
-- Locação 1
(
    'RENTER_ID',  -- ← Substitua pelo ID do locatário
    'OWNER_ID',   -- ← Substitua pelo ID do locador
    'ITEM_ID_1',  -- ← Substitua pelo ID do item 1
    '2025-11-18', -- Data de início (amanhã)
    '2025-11-25', -- Data de fim (7 dias)
    '10:00',
    '18:00',
    'approved',   -- ← Status aprovado
    50.00,
    42.37,
    7.63,
    42.37,
    '123456',     -- ← Código do locatário
    '654321'      -- ← Código do locador
),
-- Locação 2
(
    'RENTER_ID',  -- ← MESMO locatário
    'OWNER_ID',
    'ITEM_ID_2',  -- ← Item diferente
    '2025-11-19', -- Dia seguinte
    '2025-11-22',
    '14:00',
    '14:00',
    'approved',
    30.00,
    25.42,
    4.58,
    25.42,
    '789012',
    '210987'
),
-- Locação 3
(
    'RENTER_ID',  -- ← MESMO locatário
    'OWNER_ID',
    'ITEM_ID_3',  -- ← Outro item diferente
    '2025-11-20',
    '2025-11-27',
    '09:00',
    '17:00',
    'approved',
    70.00,
    59.32,
    10.68,
    59.32,
    '345678',
    '876543'
);

-- ============================================
-- EXEMPLO 2: Criar 3 Locações para TESTAR LOCADOR
-- (Usuário está alugando 3 itens seus para outras pessoas)
-- ============================================

-- SUBSTITUA ESTES IDs:
-- 'OWNER_ID' → ID do usuário locador (dono dos itens) ← SEU USUÁRIO
-- 'RENTER_ID_1', 'RENTER_ID_2', 'RENTER_ID_3' → IDs de 3 locatários diferentes
-- 'ITEM_ID_1', 'ITEM_ID_2', 'ITEM_ID_3' → IDs de 3 itens SEUS

INSERT INTO rentals (
    renter_id,
    owner_id,
    item_id,
    start_date,
    end_date,
    pickup_time,
    return_time,
    status,
    total_amount,
    subtotal,
    service_fee,
    owner_amount,
    renter_code,
    owner_code
) VALUES
-- Locação 1 - Seu item 1 alugado para pessoa A
(
    'RENTER_ID_1', -- ← Pessoa que aluga seu item
    'OWNER_ID',    -- ← SEU ID (dono)
    'ITEM_ID_1',   -- ← SEU item 1
    '2025-11-18',
    '2025-11-21',
    '11:00',
    '11:00',
    'approved',
    40.00,
    33.90,
    6.10,
    33.90,
    '111111',
    '999999'
),
-- Locação 2 - Seu item 2 alugado para pessoa B
(
    'RENTER_ID_2', -- ← Outra pessoa
    'OWNER_ID',    -- ← SEU ID (dono)
    'ITEM_ID_2',   -- ← SEU item 2
    '2025-11-19',
    '2025-11-26',
    '15:00',
    '15:00',
    'approved',
    60.00,
    50.85,
    9.15,
    50.85,
    '222222',
    '888888'
),
-- Locação 3 - Seu item 3 alugado para pessoa C
(
    'RENTER_ID_3', -- ← Mais uma pessoa
    'OWNER_ID',    -- ← SEU ID (dono)
    'ITEM_ID_3',   -- ← SEU item 3
    '2025-11-20',
    '2025-11-23',
    '10:30',
    '10:30',
    'approved',
    35.00,
    29.66,
    5.34,
    29.66,
    '333333',
    '777777'
);

-- ============================================
-- VERIFICAR LOCAÇÕES CRIADAS
-- ============================================

-- Verificar locações como LOCATÁRIO (renter)
SELECT
    r.id,
    r.status,
    r.start_date,
    r.renter_code,
    r.owner_code,
    i.title as item_name,
    p.full_name as owner_name
FROM rentals r
JOIN items i ON r.item_id = i.id
JOIN profiles p ON r.owner_id = p.id
WHERE r.renter_id = 'SEU_USER_ID'  -- ← Substitua
  AND r.status = 'approved'
  AND r.start_date >= CURRENT_DATE
ORDER BY r.start_date ASC;

-- Verificar locações como LOCADOR (owner)
SELECT
    r.id,
    r.status,
    r.start_date,
    r.renter_code,
    r.owner_code,
    i.title as item_name,
    p.full_name as renter_name
FROM rentals r
JOIN items i ON r.item_id = i.id
JOIN profiles p ON r.renter_id = p.id
WHERE r.owner_id = 'SEU_USER_ID'  -- ← Substitua
  AND r.status = 'approved'
  AND r.start_date >= CURRENT_DATE
ORDER BY r.start_date ASC;

-- ============================================
-- COMO USAR:
-- ============================================

/*
1. Encontre seus IDs:
   SELECT id, email FROM auth.users;
   SELECT id, full_name, email FROM profiles;

2. Encontre IDs de itens:
   SELECT id, title, owner_id FROM items LIMIT 10;

3. Substitua os IDs no SQL acima

4. Execute o INSERT

5. Verifique com os SELECTs

6. Abra o app → Deve mostrar paginação!
*/

-- ============================================
-- ATALHO: Criar locações com IDs automáticos
-- (Se quiser criar rapidamente sem substituir manualmente)
-- ============================================

-- Criar 3 locações onde VOCÊ é o locatário:
WITH current_user AS (
    SELECT id FROM profiles WHERE email = 'SEU_EMAIL@gmail.com' LIMIT 1
),
owner AS (
    SELECT id FROM profiles WHERE email != 'SEU_EMAIL@gmail.com' LIMIT 1
),
items AS (
    SELECT id FROM items WHERE owner_id = (SELECT id FROM owner) LIMIT 3
)
INSERT INTO rentals (
    renter_id,
    owner_id,
    item_id,
    start_date,
    end_date,
    pickup_time,
    return_time,
    status,
    total_amount,
    subtotal,
    service_fee,
    owner_amount,
    renter_code,
    owner_code
)
SELECT
    (SELECT id FROM current_user),
    (SELECT id FROM owner),
    i.id,
    CURRENT_DATE + (row_number() OVER ())::int,
    CURRENT_DATE + (row_number() OVER ())::int + 3,
    '10:00',
    '18:00',
    'approved',
    50.00,
    42.37,
    7.63,
    42.37,
    LPAD((100000 + (row_number() OVER ())::int)::text, 6, '0'),
    LPAD((900000 + (row_number() OVER ())::int)::text, 6, '0')
FROM (SELECT id, ROW_NUMBER() OVER () FROM items LIMIT 3) i;

-- ============================================
-- LIMPAR LOCAÇÕES DE TESTE (quando terminar)
-- ============================================

-- CUIDADO! Isso apaga TODAS as locações aprovadas futuras
-- DELETE FROM rentals
-- WHERE status = 'approved'
--   AND start_date >= CURRENT_DATE;

-- Ou apague apenas por IDs específicos:
-- DELETE FROM rentals WHERE id IN ('id1', 'id2', 'id3');

