import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export function useAdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusCounts, setStatusCounts] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        all: 0
    });

    const fetchPendingVerificationsCount = async () => {
        try {
            // Conta diretamente as verificações pendentes
            const { count, error } = await supabase
                .from('user_verifications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (error) throw error;

            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error fetching pending count:', error);
        }
    };

    const fetchAllStatusCounts = async () => {
        try {
            // Busca todos os registros e conta localmente por status
            const { data, error } = await supabase
                .from('user_verifications')
                .select('status');

            if (error) throw error;

            // Conta cada status
            const counts = {
                pending: data?.filter(v => v.status === 'pending').length || 0,
                approved: data?.filter(v => v.status === 'approved').length || 0,
                rejected: data?.filter(v => v.status === 'rejected').length || 0,
                all: data?.length || 0
            };

            return counts;
        } catch (error) {
            console.error('Error fetching all status counts:', error);
            return { pending: 0, approved: 0, rejected: 0, all: 0 };
        }
    };

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);

            // Buscar contagem de pendentes para badge
            await fetchPendingVerificationsCount();

            // Buscar contadores de todos os status para o filtro
            const counts = await fetchAllStatusCounts();
            setStatusCounts(counts);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('admin_notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );

            // Atualizar contagem de pendentes
            await fetchPendingVerificationsCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('admin_notifications')
                .update({ read: true })
                .eq('read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));

            // Atualizar contagem de pendentes
            await fetchPendingVerificationsCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscription para notificações em tempo real
        const notificationsSubscription = supabase
            .channel('admin_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_notifications'
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    fetchPendingVerificationsCount(); // Atualiza contador
                }
            )
            .subscribe();

        // Subscription para mudanças nas verificações
        const verificationsSubscription = supabase
            .channel('user_verifications_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_verifications'
                },
                async () => {
                    await fetchPendingVerificationsCount(); // Atualiza contador de badge
                    const counts = await fetchAllStatusCounts(); // Atualiza todos os contadores
                    setStatusCounts(counts);
                }
            )
            .subscribe();

        return () => {
            notificationsSubscription.unsubscribe();
            verificationsSubscription.unsubscribe();
        };
    }, []);

    return {
        notifications,
        unreadCount,
        statusCounts,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
}

