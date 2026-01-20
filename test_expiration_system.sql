-- ============================================
-- TESTE RÁPIDO - Sistema de Expiração de Rentals
-- ============================================
-- Execute este script para testar se tudo está funcionando

-- Passo 1: Verificar se a função foi criada
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'expire_pending_rentals';

-- Resultado esperado: 1 linha com a função

-- Passo 2: Verificar se o trigger foi criado
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'check_expired_rentals';

-- Resultado esperado: 1 linha com o trigger

-- Passo 3: Verificar constraint de status
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'rentals_status_check';

-- Resultado esperado: deve incluir 'expired' na lista de status

-- Passo 4: Testar execução da função
SELECT expire_pending_rentals();

-- Resultado esperado: função executada sem erros

-- Passo 5: Verificar se há rentals expirados
SELECT
    id,
    status,
    start_date,
    pickup_time,
    created_at,
    updated_at
FROM rentals
WHERE status = 'expired'
ORDER BY updated_at DESC
LIMIT 5;

-- Passo 6: Verificar notificações criadas
SELECT
    id,
    user_id,
    type,
    title,
    message,
    created_at
FROM user_notifications
WHERE type = 'rental_expired'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Função criada
-- ✅ Trigger criado
-- ✅ Constraint atualizado com 'expired'
-- ✅ Função executada sem erros
-- ✅ Se houver rentals pendentes expirados, aparecerão nas consultas

COMMENT ON TABLE rentals IS 'Teste executado com sucesso!';

