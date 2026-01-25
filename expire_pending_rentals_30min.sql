-- ============================================
-- FUNÇÃO PARA EXPIRAR RENTALS PENDENTES
-- ============================================
-- Esta função expira automaticamente solicitações de aluguel que não foram
-- aprovadas até 30 minutos antes do horário de retirada

-- Criar função que expira rentals pendentes
CREATE OR REPLACE FUNCTION expire_pending_rentals()
RETURNS void AS $$
DECLARE
    expired_rental RECORD;
    owner_name TEXT;
    renter_name TEXT;
    item_title TEXT;
BEGIN
    -- Buscar rentals pendentes que devem ser expirados
    -- (30 minutos antes do pickup_time)
    FOR expired_rental IN
        SELECT
            r.id,
            r.renter_id,
            r.owner_id,
            r.start_date,
            r.pickup_time,
            i.title as item_title,
            owner.full_name as owner_name,
            renter.full_name as renter_name
        FROM rentals r
        JOIN items i ON r.item_id = i.id
        JOIN profiles owner ON r.owner_id = owner.id
        JOIN profiles renter ON r.renter_id = renter.id
        WHERE r.status = 'pending'
        AND (
            -- Se a data de início é antes de hoje, expirar
            r.start_date::date < CURRENT_DATE
            OR
            -- Se é hoje, verificar se faltam menos de 30 minutos para o pickup_time
            (
                r.start_date::date = CURRENT_DATE
                AND (
                    -- Converter pickup_time para timestamp de hoje
                    (CURRENT_DATE || ' ' || r.pickup_time)::timestamp - INTERVAL '30 minutes' < NOW()
                )
            )
        )
    LOOP
        -- Atualizar status para 'expired'
        UPDATE rentals
        SET status = 'expired',
            updated_at = NOW()
        WHERE id = expired_rental.id;

        -- Notificar o LOCATÁRIO (renter)
        INSERT INTO user_notifications (
            user_id,
            type,
            title,
            message,
            related_id,
            read
        ) VALUES (
            expired_rental.renter_id,
            'rental_expired',
            'Solicitud Expirada',
            'Tu solicitud de alquiler para "' || expired_rental.item_title || '" expiró porque no fue aprobada a tiempo.',
            expired_rental.id,
            false
        );

        -- Notificar o LOCADOR (owner)
        INSERT INTO user_notifications (
            user_id,
            type,
            title,
            message,
            related_id,
            read
        ) VALUES (
            expired_rental.owner_id,
            'rental_expired',
            'Solicitud Expirada',
            'La solicitud de alquiler de ' || expired_rental.renter_name || ' para "' || expired_rental.item_title || '" expiró por no ser aprobada a tiempo.',
            expired_rental.id,
            false
        );

        RAISE NOTICE 'Rental % expirado e notificações enviadas', expired_rental.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CRIAR EXTENSÃO pg_cron SE NÃO EXISTIR
-- ============================================
-- Nota: Esta extensão precisa ser habilitada no Supabase Dashboard
-- em Database -> Extensions -> pg_cron

-- ============================================
-- AGENDAR EXECUÇÃO AUTOMÁTICA A CADA 5 MINUTOS
-- ============================================
-- Executar a função a cada 5 minutos para verificar rentals expirados
-- Se você tiver acesso ao pg_cron, descomente as linhas abaixo:

/*
SELECT cron.schedule(
    'expire-pending-rentals',
    '* /5 * * * *',
    $$SELECT expire_pending_rentals();$$
);
*/

-- Nota: O cron pattern é: '*/5 * * * *' (remova o espaço entre * e /5)

-- ============================================
-- ALTERNATIVA: TRIGGER
-- ============================================
-- Se não puder usar pg_cron, pode verificar ao atualizar/criar rentals
-- Este trigger verifica quando há qualquer operação em rentals

CREATE OR REPLACE FUNCTION trigger_expire_pending_rentals()
RETURNS TRIGGER AS $$
BEGIN
    -- Executar a função de expiração
    PERFORM expire_pending_rentals();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa após INSERT ou UPDATE em rentals
DROP TRIGGER IF EXISTS check_expired_rentals ON rentals;
CREATE TRIGGER check_expired_rentals
    AFTER INSERT OR UPDATE ON rentals
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_expire_pending_rentals();

-- ============================================
-- ADICIONAR STATUS 'expired' SE NÃO EXISTIR
-- ============================================
-- Verificar e adicionar 'expired' aos status permitidos
DO $$
BEGIN
    -- Tentar adicionar 'expired' ao constraint de status
    BEGIN
        ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check;
        ALTER TABLE rentals ADD CONSTRAINT rentals_status_check
            CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'rejected', 'expired', 'dispute_open'));
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Constraint já existe ou erro: %', SQLERRM;
    END;
END $$;

-- ============================================
-- TESTAR A FUNÇÃO (OPCIONAL)
-- ============================================
-- Para testar manualmente, execute:
-- SELECT expire_pending_rentals();

-- Para ver os jobs agendados no cron (se disponível):
-- SELECT * FROM cron.job;

-- Para remover o job agendado (se necessário):
-- SELECT cron.unschedule('expire-pending-rentals');

COMMENT ON FUNCTION expire_pending_rentals() IS 'Expira automaticamente solicitações de aluguel pendentes que não foram aprovadas até 30 minutos antes do pickup_time';

