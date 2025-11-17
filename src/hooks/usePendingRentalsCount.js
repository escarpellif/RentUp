import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export function usePendingRentalsCount(userId) {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        fetchPendingCount();

        // Subscribe to changes in rentals
        const subscription = supabase
            .channel('pending_rentals_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rentals' },
                () => {
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

