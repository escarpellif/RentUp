import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { userNotificationsStyles } from '../styles/screens/userNotificationsStyles';

export default function UserNotificationsScreen({ navigation, session }) {
    const { notifications, unreadCount, loading, markAsRead, refresh } = useUserNotifications(session?.user?.id);

    useEffect(() => {
        // Recarrega notificações quando a tela ganha foco
        const unsubscribe = navigation.addListener('focus', () => {
            refresh();
        });
        return unsubscribe;
    }, [navigation]);

    const handleNotificationPress = async (notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'verification_result':
                return '📋';
            case 'rental_request':
                return '🔑';
            case 'message':
                return '💬';
            default:
                return '🔔';
        }
    };

    const renderNotification = (notification) => {
        const isRejection = notification.title?.includes('Rechazada') || notification.title?.includes('Rejected');
        
        return (
            <TouchableOpacity
                key={notification.id}
                style={[
                    userNotificationsStyles.notificationCard,
                    !notification.read && userNotificationsStyles.notificationUnread
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
            >
                <View style={userNotificationsStyles.notificationIcon}>
                    <Text style={userNotificationsStyles.notificationIconText}>
                        {getNotificationIcon(notification.type)}
                    </Text>
                </View>
                
                <View style={userNotificationsStyles.notificationContent}>
                    <Text style={userNotificationsStyles.notificationTitle}>{notification.title}</Text>
                    <Text style={[
                        userNotificationsStyles.notificationMessage,
                        isRejection && userNotificationsStyles.notificationMessageRejection
                    ]}>
                        {notification.message}
                    </Text>
                    <Text style={userNotificationsStyles.notificationTime}>
                        {new Date(notification.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {!notification.read && (
                    <View style={userNotificationsStyles.unreadBadge}>
                        <View style={userNotificationsStyles.unreadDot} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={userNotificationsStyles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={userNotificationsStyles.headerContainer}>
                <TouchableOpacity
                    style={userNotificationsStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={userNotificationsStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={userNotificationsStyles.headerTitleContainer}>
                    <Text style={userNotificationsStyles.headerTitle}>Notificaciones</Text>
                    {unreadCount > 0 && (
                        <View style={userNotificationsStyles.headerBadge}>
                            <Text style={userNotificationsStyles.headerBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <View style={userNotificationsStyles.headerSpacer} />
            </View>

            <ScrollView style={userNotificationsStyles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={userNotificationsStyles.emptyContainer}>
                        <Text style={userNotificationsStyles.emptyText}>Cargando notificaciones...</Text>
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={userNotificationsStyles.emptyContainer}>
                        <Text style={userNotificationsStyles.emptyIcon}>🔔</Text>
                        <Text style={userNotificationsStyles.emptyTitle}>Sin notificaciones</Text>
                        <Text style={userNotificationsStyles.emptyText}>Aquí aparecerán tus notificaciones importantes</Text>
                    </View>
                ) : (
                    <View style={userNotificationsStyles.notificationsList}>
                        {notifications.map(renderNotification)}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}



