import React, { useState, useEffect } from 'react';
import {View, Text, ScrollView, TouchableOpacity, Platform, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import { useUserNotifications } from '../hooks/useUserNotifications';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { profileStyles } from '../styles/screens/profileStyles';

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
        // Marcar como lida
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navegar para a tela apropriada baseado no tipo de notificação
        if (notification.type === 'new_message' && notification.related_id) {
            // related_id contém o item_id
            try {
                // Buscar informações do item e do dono para abrir o chat
                const { data: item, error } = await supabase
                    .from('items')
                    .select('*, profiles!items_owner_id_fkey(*)')
                    .eq('id', notification.related_id)
                    .single();

                if (!error && item) {
                    const ownerProfile = item.profiles;

                    // Verificar quem é o dono e quem está abrindo
                    // Se eu sou o dono, vou conversar com o interessado
                    // Se eu não sou o dono, vou conversar com o dono
                    const isOwner = session.user.id === item.owner_id;

                    if (isOwner) {
                        // Sou o dono, preciso buscar quem me enviou a mensagem
                        // Para isso, vou buscar a última mensagem deste item que não é minha
                        const { data: lastMessage } = await supabase
                            .from('messages')
                            .select('sender_id, profiles!messages_sender_id_fkey(*)')
                            .eq('item_id', notification.related_id)
                            .neq('sender_id', session.user.id)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();

                        if (lastMessage && lastMessage.profiles) {
                            // Navegar para o chat com o interessado
                            navigation.navigate('ItemDetails', {
                                item: item,
                                openChatWith: lastMessage.profiles,
                                autoOpenChat: true
                            });
                        }
                    } else {
                        // Não sou o dono, vou abrir chat com o dono normalmente
                        navigation.navigate('ItemDetails', {
                            item: item,
                            autoOpenChat: true
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar item para abrir chat:', error);
            }
        } else if (notification.type === 'rental_request' && notification.related_id) {
            // Futuro: navegar para tela de solicitações de aluguel
            Alert.alert('Solicitud de Alquiler', 'Funcionalidad de gestión de solicitudes estará disponible pronto');
        } else if (notification.type === 'verification_result') {
            // Já está na tela de perfil, apenas mostrar a aba de notificações
            setActiveTab('notifications');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'verification_result':
                return '📋';
            case 'rental_request':
                return '🔑';
            case 'new_message':
                return '💬';
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
                    profileStyles.notificationCard,
                    !notification.read && profileStyles.notificationUnread
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
            >
                <View style={profileStyles.notificationIcon}>
                    <Text style={profileStyles.notificationIconText}>
                        {getNotificationIcon(notification.type)}
                    </Text>
                </View>
                
                <View style={profileStyles.notificationContent}>
                    <Text style={profileStyles.notificationTitle}>{notification.title}</Text>
                    <Text style={[
                        profileStyles.notificationMessage,
                        isRejection && profileStyles.notificationMessageRejection
                    ]}>
                        {notification.message}
                    </Text>
                    <Text style={profileStyles.notificationTime}>
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
                    <View style={profileStyles.unreadBadge}>
                        <View style={profileStyles.unreadDot} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderEditProfileTab = () => (
        <View style={profileStyles.tabContent}>
            <View style={profileStyles.card}>
                <Text style={profileStyles.cardTitle}>👤 Información Personal</Text>

                <Text style={profileStyles.label}>Nombre Completo</Text>
                <TextInput
                    style={profileStyles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Tu nombre completo"
                />

                <Text style={profileStyles.label}>Teléfono</Text>
                <TextInput
                    style={profileStyles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+34 600 123 456"
                    keyboardType="phone-pad"
                />

                <Text style={profileStyles.label}>Dirección</Text>
                <TextInput
                    style={profileStyles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Calle, número, piso..."
                />

                <Text style={profileStyles.label}>Código Postal</Text>
                <TextInput
                    style={profileStyles.input}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="28001"
                    keyboardType="numeric"
                />

                <Text style={profileStyles.label}>Ciudad</Text>
                <TextInput
                    style={profileStyles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Madrid"
                />

                <TouchableOpacity
                    style={[profileStyles.saveButton, saving && profileStyles.saveButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                >
                    <Text style={profileStyles.saveButtonText}>
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={profileStyles.card}>
                <Text style={profileStyles.cardTitle}>📧 Información de Cuenta</Text>
                <Text style={profileStyles.infoLabel}>Usuario:</Text>
                <Text style={profileStyles.infoValue}>{profile?.username || 'N/A'}</Text>
                
                <Text style={profileStyles.infoLabel}>Email:</Text>
                <Text style={profileStyles.infoValue}>{session.user.email}</Text>
                
                <Text style={profileStyles.infoLabel}>Miembro desde:</Text>
                <Text style={profileStyles.infoValue}>
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
            <View style={profileStyles.tabContent}>
                {/* Sub-tabs */}
                <View style={profileStyles.subTabsContainer}>
                    <TouchableOpacity
                        style={[profileStyles.subTab, notificationsSubTab === 'unread' && profileStyles.subTabActive]}
                        onPress={() => setNotificationsSubTab('unread')}
                    >
                        <Text style={[profileStyles.subTabText, notificationsSubTab === 'unread' && profileStyles.subTabTextActive]}>
                            No Leídas ({notifications.filter(n => !n.read).length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[profileStyles.subTab, notificationsSubTab === 'read' && profileStyles.subTabActive]}
                        onPress={() => setNotificationsSubTab('read')}
                    >
                        <Text style={[profileStyles.subTabText, notificationsSubTab === 'read' && profileStyles.subTabTextActive]}>
                            Leídas ({notifications.filter(n => n.read).length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {notifLoading ? (
                    <View style={profileStyles.emptyContainer}>
                        <ActivityIndicator size="large" color="#2c4455" />
                    </View>
                ) : filteredNotifications.length === 0 ? (
                    <View style={profileStyles.emptyContainer}>
                        <Text style={profileStyles.emptyIcon}>🔔</Text>
                        <Text style={profileStyles.emptyTitle}>Sin notificaciones</Text>
                        <Text style={profileStyles.emptyText}>
                            {notificationsSubTab === 'unread' 
                                ? 'No tienes notificaciones sin leer'
                                : 'No tienes notificaciones leídas'}
                        </Text>
                    </View>
                ) : (
                    <View style={profileStyles.notificationsList}>
                        {filteredNotifications.map(renderNotification)}
                    </View>
                )}
            </View>
        );
    };

    const renderReviewsTab = () => (
        <View style={profileStyles.tabContent}>
            <View style={profileStyles.emptyContainer}>
                <Text style={profileStyles.emptyIcon}>⭐</Text>
                <Text style={profileStyles.emptyTitle}>Mis Reviews</Text>
                <Text style={profileStyles.emptyText}>
                    Esta funcionalidad estará disponible próximamente
                </Text>
            </View>
        </View>
    );

    const renderLanguageTab = () => (
        <View style={profileStyles.tabContent}>
            <View style={profileStyles.card}>
                <Text style={profileStyles.cardTitle}>🌐 Seleccionar Idioma</Text>
                <Text style={profileStyles.cardSubtitle}>Elige tu idioma preferido para la aplicación</Text>
                
                <LanguageSwitcher />
                
                <View style={profileStyles.languageInfo}>
                    <Text style={profileStyles.languageInfoText}>
                        Idioma actual: {i18n.language === 'es' ? 'Español 🇪🇸' : 'English 🇬🇧'}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={profileStyles.container}>
                <View style={profileStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={profileStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={profileStyles.headerContainer}>
                <TouchableOpacity
                    style={profileStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={profileStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={profileStyles.headerTitleContainer}>
                    <Text style={profileStyles.headerTitle}>Mi Perfil</Text>
                </View>
                <View style={profileStyles.headerSpacer} />
            </View>

            {/* Tabs */}
            <View style={profileStyles.tabsContainer}>
                <TouchableOpacity
                    style={[profileStyles.tab, activeTab === 'edit' && profileStyles.tabActive]}
                    onPress={() => setActiveTab('edit')}
                >
                    <Text style={[profileStyles.tabText, activeTab === 'edit' && profileStyles.tabTextActive]}>
                        ✏️ Editar
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[profileStyles.tab, activeTab === 'notifications' && profileStyles.tabActive]}
                    onPress={() => setActiveTab('notifications')}
                >
                    <Text style={[profileStyles.tabText, activeTab === 'notifications' && profileStyles.tabTextActive]}>
                        🔔 Notif.
                    </Text>
                    {unreadCount > 0 && (
                        <View style={profileStyles.tabBadge}>
                            <Text style={profileStyles.tabBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[profileStyles.tab, activeTab === 'reviews' && profileStyles.tabActive]}
                    onPress={() => setActiveTab('reviews')}
                >
                    <Text style={[profileStyles.tabText, activeTab === 'reviews' && profileStyles.tabTextActive]}>
                        ⭐ Reviews
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[profileStyles.tab, activeTab === 'language' && profileStyles.tabActive]}
                    onPress={() => setActiveTab('language')}
                >
                    <Text style={[profileStyles.tabText, activeTab === 'language' && profileStyles.tabTextActive]}>
                        🌐 Idioma
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={profileStyles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'edit' && renderEditProfileTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'reviews' && renderReviewsTab()}
                {activeTab === 'language' && renderLanguageTab()}
                
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}



