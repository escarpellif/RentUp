import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import { useUserNotifications } from '../hooks/useUserNotifications';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ProfileScreen({ session, navigation }) {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('edit'); // edit, notifications, reviews, language
    const [notificationsSubTab, setNotificationsSubTab] = useState('unread'); // unread, read
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estados para edição
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [saving, setSaving] = useState(false);

    const { notifications, unreadCount, loading: notifLoading, markAsRead, refresh } = useUserNotifications(session?.user?.id);

    useEffect(() => {
        fetchProfile();
        
        // Refresh quando voltar ao foco
        const unsubscribe = navigation.addListener('focus', () => {
            refresh();
        });
        return unsubscribe;
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil:', error.message);
        } else {
            setProfile(data);
            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setPostalCode(data.postal_code || '');
            setCity(data.city || '');
        }
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone,
                address: address,
                postal_code: postalCode,
                city: city,
                updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);

        if (error) {
            Alert.alert('Error', 'No se pudo guardar el perfil: ' + error.message);
        } else {
            Alert.alert('¡Éxito!', 'Perfil actualizado correctamente');
            fetchProfile();
        }
        setSaving(false);
    };

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

    const renderEditProfileTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 Información Personal</Text>

                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Tu nombre completo"
                />

                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+34 600 123 456"
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Dirección</Text>
                <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Calle, número, piso..."
                />

                <Text style={styles.label}>Código Postal</Text>
                <TextInput
                    style={styles.input}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="28001"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Ciudad</Text>
                <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Madrid"
                />

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📧 Información de Cuenta</Text>
                <Text style={styles.infoLabel}>Usuario:</Text>
                <Text style={styles.infoValue}>{profile?.username || 'N/A'}</Text>
                
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{session.user.email}</Text>
                
                <Text style={styles.infoLabel}>Miembro desde:</Text>
                <Text style={styles.infoValue}>
                    {new Date(profile?.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                </Text>
            </View>
        </View>
    );

    const renderNotificationsTab = () => {
        const filteredNotifications = notificationsSubTab === 'unread' 
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.read);

        return (
            <View style={styles.tabContent}>
                {/* Sub-tabs */}
                <View style={styles.subTabsContainer}>
                    <TouchableOpacity
                        style={[styles.subTab, notificationsSubTab === 'unread' && styles.subTabActive]}
                        onPress={() => setNotificationsSubTab('unread')}
                    >
                        <Text style={[styles.subTabText, notificationsSubTab === 'unread' && styles.subTabTextActive]}>
                            No Leídas ({notifications.filter(n => !n.read).length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.subTab, notificationsSubTab === 'read' && styles.subTabActive]}
                        onPress={() => setNotificationsSubTab('read')}
                    >
                        <Text style={[styles.subTabText, notificationsSubTab === 'read' && styles.subTabTextActive]}>
                            Leídas ({notifications.filter(n => n.read).length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {notifLoading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color="#2c4455" />
                    </View>
                ) : filteredNotifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔔</Text>
                        <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                        <Text style={styles.emptyText}>
                            {notificationsSubTab === 'unread' 
                                ? 'No tienes notificaciones sin leer'
                                : 'No tienes notificaciones leídas'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.notificationsList}>
                        {filteredNotifications.map(renderNotification)}
                    </View>
                )}
            </View>
        );
    };

    const renderReviewsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyTitle}>Mis Reviews</Text>
                <Text style={styles.emptyText}>
                    Esta funcionalidad estará disponible próximamente
                </Text>
            </View>
        </View>
    );

    const renderLanguageTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🌐 Seleccionar Idioma</Text>
                <Text style={styles.cardSubtitle}>Elige tu idioma preferido para la aplicación</Text>
                
                <LanguageSwitcher />
                
                <View style={styles.languageInfo}>
                    <Text style={styles.languageInfoText}>
                        Idioma actual: {i18n.language === 'es' ? 'Español 🇪🇸' : 'English 🇬🇧'}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
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
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'edit' && styles.tabActive]}
                    onPress={() => setActiveTab('edit')}
                >
                    <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>
                        ✏️ Editar
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
                    onPress={() => setActiveTab('notifications')}
                >
                    <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
                        🔔 Notif.
                    </Text>
                    {unreadCount > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                    onPress={() => setActiveTab('reviews')}
                >
                    <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                        ⭐ Reviews
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'language' && styles.tabActive]}
                    onPress={() => setActiveTab('language')}
                >
                    <Text style={[styles.tabText, activeTab === 'language' && styles.tabTextActive]}>
                        🌐 Idioma
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'edit' && renderEditProfileTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'reviews' && renderReviewsTab()}
                {activeTab === 'language' && renderLanguageTab()}
                
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
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
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c4455',
    },
    headerSpacer: {
        width: 40,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#2c4455',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#2c4455',
        fontWeight: 'bold',
    },
    tabBadge: {
        position: 'absolute',
        top: 8,
        right: '25%',
        backgroundColor: '#dc3545',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContent: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        backgroundColor: '#F8F9FA',
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 12,
    },
    infoValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        marginTop: 4,
    },
    subTabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    subTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    subTabActive: {
        backgroundColor: '#2c4455',
    },
    subTabText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    subTabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    notificationsList: {
        gap: 12,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    languageInfo: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        alignItems: 'center',
    },
    languageInfoText: {
        fontSize: 15,
        color: '#2c4455',
        fontWeight: '600',
    },
});

