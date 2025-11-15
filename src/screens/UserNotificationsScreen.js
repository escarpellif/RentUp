import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserNotifications } from '../hooks/useUserNotifications';

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
                    styles.notificationCard,
                    !notification.read && styles.notificationUnread
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
            >
                <View style={styles.notificationIcon}>
                    <Text style={styles.notificationIconText}>
                        {getNotificationIcon(notification.type)}
                    </Text>
                </View>
                
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={[
                        styles.notificationMessage,
                        isRejection && styles.notificationMessageRejection
                    ]}>
                        {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
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
                    <View style={styles.unreadBadge}>
                        <View style={styles.unreadDot} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Notificaciones</Text>
                    {unreadCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Cargando notificaciones...</Text>
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔔</Text>
                        <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                        <Text style={styles.emptyText}>Aquí aparecerán tus notificaciones importantes</Text>
                    </View>
                ) : (
                    <View style={styles.notificationsList}>
                        {notifications.map(renderNotification)}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    backArrow: {
        fontSize: 22,
        color: '#333',
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c4455',
    },
    headerBadge: {
        backgroundColor: '#dc3545',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        flex: 1,
    },
    notificationsList: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationUnread: {
        backgroundColor: '#F0F8FF',
        borderLeftWidth: 4,
        borderLeftColor: '#2c4455',
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationIconText: {
        fontSize: 24,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationMessageRejection: {
        color: '#dc3545',
        fontWeight: '500',
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    unreadBadge: {
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 4,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#dc3545',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

