import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export function useUserNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tableAvailable, setTableAvailable] = useState(true);
    const channelRef = useRef(null);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('user_notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                // If the table doesn't exist, PostgREST returns PGRST205
                if (error.code === 'PGRST205' || (error.message && error.message.includes("Could not find the table 'public.user_notifications'"))) {
                    console.warn('user_notifications table not found in database - notifications disabled for users.');
                    setTableAvailable(false);
                    setNotifications([]);
                    setUnreadCount(0);
                    return;
                }
                throw error;
            }

            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching user notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        if (!tableAvailable) return;
        try {
            const { error } = await supabase
                .from('user_notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Atualiza localmente
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Recarrega para garantir sincronização
            setTimeout(() => fetchNotifications(), 500);
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (!userId) return;
        if (!tableAvailable) return; // don't subscribe if table not available

        // Subscribe to user_notifications changes and alert on new
        try {
            const channel = supabase
                .channel('user_notifications_channel')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'user_notifications' },
                    (payload) => {
                        const newNotif = payload.new;
                        if (newNotif.user_id === userId) {
                            setNotifications(prev => [newNotif, ...prev]);
                            setUnreadCount(prev => prev + 1);

                            // Mostrar alert imediata para avisos importantes (rejeição aprovada)
                            try {
                                Alert.alert(newNotif.title || 'Notificación', newNotif.message || 'Tienes una nueva notificación');
                            } catch (e) {
                                // ignore
                            }
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'user_notifications' },
                    (payload) => {
                        const updated = payload.new;
                        if (updated.user_id === userId) {
                            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
                            // recompute unread
                            setUnreadCount(prev => {
                                try {
                                    const unread = (notifications.concat([updated]).filter(n => !n.read).length);
                                    return unread;
                                } catch (e) {
                                    return prev;
                                }
                            });
                        }
                    }
                )
                .subscribe();

            channelRef.current = channel;
        } catch (err) {
            // If subscription fails because table isn't available or other reason, disable notifications gracefully
            console.warn('Could not subscribe to user_notifications channel:', err?.message || err);
            setTableAvailable(false);
        }

        return () => {
            try {
                if (channelRef.current) channelRef.current.unsubscribe();
            } catch (e) {
                // ignore
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, tableAvailable]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        refresh: fetchNotifications,
        tableAvailable
    };
}
