import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export function usePendingRentalsCount(userId) {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        fetchPendingCount();

        // Subscribe to changes in rentals - escutar todos os eventos
        const subscription = supabase
            .channel('pending_rentals_channel_' + userId)
            .on(
                'postgres_changes',
                {
                    event: '*', // Escutar INSERT, UPDATE e DELETE
                    schema: 'public',
                    table: 'rentals',
                    filter: `owner_id=eq.${userId}` // Filtrar apenas rentals do owner
                },
                (payload) => {
                    // Recarregar contagem sempre que houver mudança
                    fetchPendingCount();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const fetchPendingCount = async () => {
        try {
            // Contar solicitações pendentes onde o usuário é o dono
            const { count, error } = await supabase
                .from('rentals')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', userId)
                .eq('status', 'pending');

            if (error) throw error;
            setPendingCount(count || 0);
        } catch (error) {
            console.error('Erro ao buscar contagem de pendentes:', error);
            setPendingCount(0);
        }
    };

    return { pendingCount, refresh: fetchPendingCount };
}

