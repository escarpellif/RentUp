import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export function useUnreadMessagesCount(userId) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        fetchUnreadCount();

        // Subscribe to changes in messages
        const subscription = supabase
            .channel('unread_messages_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const fetchUnreadCount = async () => {
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Erro ao buscar contagem de não lidas:', error);
            setUnreadCount(0);
        }
    };

    return { unreadCount, refresh: fetchUnreadCount };
}

