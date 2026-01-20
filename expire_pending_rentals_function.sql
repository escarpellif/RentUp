-- Função SQL para expirar solicitações pendentes 1 hora antes do pickup
-- Esta função deve ser executada periodicamente (a cada 15 minutos, por exemplo)

CREATE OR REPLACE FUNCTION expire_pending_rentals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rental_record RECORD;
    pickup_datetime TIMESTAMP;
    one_hour_before TIMESTAMP;
BEGIN
    -- Buscar todas as solicitações pendentes
    FOR rental_record IN
        SELECT id, renter_id, start_date, pickup_time, item_id
        FROM rentals
        WHERE status = 'pending'
    LOOP
        -- Calcular datetime de pickup
        pickup_datetime := (rental_record.start_date::date + rental_record.pickup_time::time);

        -- Calcular 1 hora antes
        one_hour_before := pickup_datetime - INTERVAL '1 hour';

        -- Se já passou do prazo (1 hora antes do pickup)
        IF NOW() >= one_hour_before THEN
            -- Atualizar status para expired
            UPDATE rentals
            SET
                status = 'expired',
                rejection_reason = 'La solicitud expiró porque el propietario no respondió a tiempo',
                updated_at = NOW()
            WHERE id = rental_record.id;

            -- Criar notificação para o solicitante
            INSERT INTO user_notifications (
                user_id,
                type,
                title,
                message,
                related_id,
                read,
                created_at
            ) VALUES (
                rental_record.renter_id,
                'rental_expired',
                '⏰ Solicitud Expirada',
                'Tu solicitud expiró porque el propietario no respondió a tiempo. Puedes hacer una nueva solicitud si el artículo sigue disponible.',
                rental_record.id,
                false,
                NOW()
            );

            RAISE NOTICE 'Rental % expired', rental_record.id;
        END IF;
    END LOOP;
END;
$$;

-- Comentário
COMMENT ON FUNCTION expire_pending_rentals() IS 'Expira solicitações de aluguel pendentes que não foram aprovadas 1 hora antes do horário de retirada';

-- Para executar a função manualmente:
-- SELECT expire_pending_rentals();

-- Para criar um cron job no Supabase (requer extensão pg_cron):
-- SELECT cron.schedule(
--     'expire-pending-rentals',
--     '*/15 * * * *', -- A cada 15 minutos
--     $$SELECT expire_pending_rentals();$$
-- );

