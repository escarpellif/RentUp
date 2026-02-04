import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Linking, Modal, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import { adminVerificationsStyles } from '../styles/screens/adminVerificationsStyles';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function AdminVerificationsScreen({ navigation, session }) {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
    const [filterMenuVisible, setFilterMenuVisible] = useState(false);

    // Hook de notificações
    const { unreadCount, statusCounts, markAllAsRead, refresh: refreshNotifications } = useAdminNotifications();

    useEffect(() => {
        fetchVerifications();
    }, [filter]);

    const fetchVerifications = async () => {
        setLoading(true);
        try {
            // Buscar verificações
            let query = supabase
                .from('user_verifications')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data: verificationsData, error: verError } = await query;
            if (verError) throw verError;

            // Buscar dados dos usuários
            if (verificationsData && verificationsData.length > 0) {
                const userIds = verificationsData.map(v => v.user_id);

                // Buscar perfis (agora com email)
                const { data: profilesData, error: profError } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, username')
                    .in('id', userIds);

                if (profError) {
                    console.error('Error fetching profiles:', profError);
                }

                // Combinar dados manualmente
                const combinedData = verificationsData.map(verification => {
                    const profile = profilesData?.find(p => p.id === verification.user_id);
                    return {
                        ...verification,
                        profiles: profile || {
                            email: 'Sin email',
                            full_name: 'Sin nombre',
                            username: ''
                        }
                    };
                });

                setVerifications(combinedData);
            } else {
                setVerifications([]);
            }
        } catch (error) {
            console.error('Error fetching verifications:', error);
            Alert.alert('Error', 'No se pudieron cargar las verificaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (verification) => {
        Alert.alert(
            'Aprobar Verificación',
            `¿Confirmas que quieres APROBAR la verificación de ${verification.profiles?.full_name || 'este usuario'}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprobar',
                    style: 'default',
                    onPress: async () => {
                        try {
                            console.log('Aprovando verificação:', verification.id, 'para usuário:', verification.user_id);

                            // Atualizar verificação
                            const { error: verError } = await supabase
                                .from('user_verifications')
                                .update({
                                    status: 'approved',
                                    reviewed_at: new Date().toISOString(),
                                    reviewed_by: session.user.id
                                })
                                .eq('id', verification.id);

                            if (verError) {
                                console.error('Erro ao atualizar user_verifications:', verError);
                                throw verError;
                            }

                            console.log('user_verifications atualizado com sucesso para approved');

                            // Atualizar perfil
                            const { error: profError } = await supabase
                                .from('profiles')
                                .update({ verification_status: 'approved' })
                                .eq('id', verification.user_id);

                            if (profError) {
                                console.error('Erro ao atualizar profiles:', profError);
                                throw profError;
                            }

                            console.log('profiles atualizado com sucesso para approved');

                            // Inserir notificação para o usuário avisando da aprovação
                            try {
                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: verification.user_id,
                                        type: 'verification_result',
                                        title: 'Verificación Aprobada',
                                        message: 'Tu verificación ha sido aprobada. Ya puedes usar todas las funciones.',
                                        read: false,
                                        related_id: verification.id,
                                        created_at: new Date().toISOString()
                                    });
                            } catch (notifErr) {
                                // Se a tabela não existir ou houver erro, apenas logue (não interrompe o fluxo)
                                console.warn('Could not insert user notification (approve):', notifErr.message || notifErr);
                            }

                            Alert.alert('¡Éxito!', 'Verificación aprobada correctamente');
                            fetchVerifications();
                            refreshNotifications(); // Atualiza contador de notificações
                        } catch (error) {
                            console.error('Error approving:', error);
                            Alert.alert('Error', 'No se pudo aprobar la verificación');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (verification) => {
        Alert.prompt(
            'Rechazar Verificación',
            'Motivo del rechazo (opcional):',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async (reason) => {
                        try {
                            // Atualizar verificação
                            const { error: verError } = await supabase
                                .from('user_verifications')
                                .update({
                                    status: 'rejected',
                                    reviewed_at: new Date().toISOString(),
                                    reviewed_by: session.user.id,
                                    rejection_reason: reason || 'No especificado'
                                })
                                .eq('id', verification.id);

                            if (verError) throw verError;

                            // Atualizar perfil - libera para nova tentativa (null = pode enviar novamente)
                            const { error: profError } = await supabase
                                .from('profiles')
                                .update({ verification_status: null })
                                .eq('id', verification.user_id);

                            if (profError) throw profError;

                            // Inserir notificação para o usuário avisando do rejeição
                            try {
                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: verification.user_id,
                                        type: 'verification_result',
                                        title: 'Verificación Rechazada',
                                        message: `Tu verificación ha sido rechazada. Motivo: ${reason || 'No especificado'}`,
                                        read: false,
                                        related_id: verification.id,
                                        created_at: new Date().toISOString()
                                    });
                            } catch (notifErr) {
                                // Se a tabela não existir ou houver erro, apenas logue (não interrompe o fluxo)
                                console.warn('Could not insert user notification (reject):', notifErr.message || notifErr);
                            }

                            Alert.alert('Verificación Rechazada', 'El usuario será notificado');
                            fetchVerifications();
                            refreshNotifications(); // Atualiza contador de notificações
                        } catch (error) {
                            console.error('Error rejecting:', error);
                            Alert.alert('Error', 'No se pudo rechazar la verificación');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const viewDocument = async (photoPath) => {
        try {
            // Gerar URL assinada (funciona com bucket privado)
            const { data, error } = await supabase.storage
                .from('verification_docs')
                .createSignedUrl(photoPath, 3600); // válida por 1 hora

            if (error) {
                console.error('Error generating signed URL:', error);
                Alert.alert('Error', 'No se pudo generar el enlace del documento');
                return;
            }

            if (data && data.signedUrl) {
                Linking.openURL(data.signedUrl).catch((err) => {
                    console.error('Error opening URL:', err);
                    Alert.alert('Error', 'No se pudo abrir el documento');
                });
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            Alert.alert('Error', 'No se pudo cargar el documento');
        }
    };

    const renderVerification = (item) => {
        const statusColors = {
            pending: '#FFA500',
            approved: '#28a745',
            rejected: '#dc3545'
        };

        const statusLabels = {
            pending: 'Pendiente',
            approved: 'Aprobado',
            rejected: 'Rechazado'
        };

        const docTypeLabels = {
            dni: 'DNI / Cédula',
            passport: 'Pasaporte',
            driver_license: 'Licencia'
        };

        return (
            <View key={item.id} style={adminVerificationsStyles.card}>
                {/* Status Badge */}
                <View style={[adminVerificationsStyles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
                    <Text style={adminVerificationsStyles.statusText}>{statusLabels[item.status]}</Text>
                </View>

                {/* User Info */}
                <View style={adminVerificationsStyles.userInfo}>
                    <Text style={adminVerificationsStyles.userName}>{item.profiles?.full_name || 'Sin nombre'}</Text>
                    <Text style={adminVerificationsStyles.userEmail}>{item.profiles?.email || 'Sin email'}</Text>
                </View>

                {/* Document Info */}
                <View style={adminVerificationsStyles.infoRow}>
                    <Text style={adminVerificationsStyles.label}>Tipo:</Text>
                    <Text style={adminVerificationsStyles.value}>{docTypeLabels[item.document_type]}</Text>
                </View>

                <View style={adminVerificationsStyles.infoRow}>
                    <Text style={adminVerificationsStyles.label}>Número:</Text>
                    <Text style={adminVerificationsStyles.value}>{item.document_number}</Text>
                </View>

                <View style={adminVerificationsStyles.infoRow}>
                    <Text style={adminVerificationsStyles.label}>Enviado:</Text>
                    <Text style={adminVerificationsStyles.value}>
                        {new Date(item.submitted_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {item.reviewed_at && (
                    <View style={adminVerificationsStyles.infoRow}>
                        <Text style={adminVerificationsStyles.label}>Revisado:</Text>
                        <Text style={adminVerificationsStyles.value}>
                            {new Date(item.reviewed_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                )}

                {item.rejection_reason && (
                    <View style={adminVerificationsStyles.rejectionReasonBox}>
                        <Text style={adminVerificationsStyles.rejectionReasonLabel}>Motivo de rechazo:</Text>
                        <Text style={adminVerificationsStyles.rejectionReasonText}>{item.rejection_reason}</Text>
                    </View>
                )}

                {/* View Documents */}
                <View style={adminVerificationsStyles.documentsRow}>
                    <TouchableOpacity
                        style={adminVerificationsStyles.documentButton}
                        onPress={() => viewDocument(item.document_photo)}
                    >
                        <Text style={adminVerificationsStyles.documentButtonIcon}>📄</Text>
                        <Text style={adminVerificationsStyles.documentButtonText}>Ver Documento</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={adminVerificationsStyles.documentButton}
                        onPress={() => viewDocument(item.selfie_photo)}
                    >
                        <Text style={adminVerificationsStyles.documentButtonIcon}>🤳</Text>
                        <Text style={adminVerificationsStyles.documentButtonText}>Ver Selfie</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Buttons (only for pending) */}
                {item.status === 'pending' && (
                    <View style={adminVerificationsStyles.actionButtons}>
                        <TouchableOpacity
                            style={[adminVerificationsStyles.actionButton, adminVerificationsStyles.approveButton]}
                            onPress={() => handleApprove(item)}
                        >
                            <Text style={adminVerificationsStyles.actionButtonText}>✅ Aprobar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[adminVerificationsStyles.actionButton, adminVerificationsStyles.rejectButton]}
                            onPress={() => handleReject(item)}
                        >
                            <Text style={adminVerificationsStyles.actionButtonText}>❌ Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={adminVerificationsStyles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={adminVerificationsStyles.headerContainer}>
                <TouchableOpacity
                    style={adminVerificationsStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={adminVerificationsStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={adminVerificationsStyles.headerTitleContainer}>
                    <Text style={adminVerificationsStyles.headerTitle}>Verificaciones</Text>
                    {unreadCount > 0 && (
                        <View style={adminVerificationsStyles.notificationBadge}>
                            <Text style={adminVerificationsStyles.notificationBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={adminVerificationsStyles.filterButton}
                    onPress={() => setFilterMenuVisible(true)}
                >
                    <Text style={adminVerificationsStyles.filterIcon}>🔽</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de Filtros */}
            <Modal
                visible={filterMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFilterMenuVisible(false)}
            >
                <TouchableOpacity
                    style={adminVerificationsStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setFilterMenuVisible(false)}
                >
                    <View style={adminVerificationsStyles.filterDropdown}>
                        <Text style={adminVerificationsStyles.filterDropdownTitle}>Filtrar por:</Text>

                        {[
                            { key: 'pending', label: '⏳ Pendientes', count: statusCounts.pending },
                            { key: 'approved', label: '✅ Aprobados', count: statusCounts.approved },
                            { key: 'rejected', label: '❌ Rechazados', count: statusCounts.rejected },
                            { key: 'all', label: '📋 Todos', count: statusCounts.all }
                        ].map(option => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    adminVerificationsStyles.filterOption,
                                    filter === option.key && adminVerificationsStyles.filterOptionActive
                                ]}
                                onPress={() => {
                                    setFilter(option.key);
                                    setFilterMenuVisible(false);
                                    if (option.key === 'pending') {
                                        markAllAsRead();
                                    }
                                }}
                            >
                                <Text style={[
                                    adminVerificationsStyles.filterOptionText,
                                    filter === option.key && adminVerificationsStyles.filterOptionTextActive
                                ]}>
                                    {option.label}
                                </Text>
                                <View style={adminVerificationsStyles.filterCount}>
                                    <Text style={adminVerificationsStyles.filterCountText}>{option.count}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* List */}
            <ScrollView style={adminVerificationsStyles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={adminVerificationsStyles.emptyContainer}>
                        <Text style={adminVerificationsStyles.emptyText}>Cargando...</Text>
                    </View>
                ) : verifications.length === 0 ? (
                    <View style={adminVerificationsStyles.emptyContainer}>
                        <Text style={adminVerificationsStyles.emptyIcon}>📭</Text>
                        <Text style={adminVerificationsStyles.emptyText}>No hay verificaciones {filter !== 'all' ? statusLabels[filter].toLowerCase() : ''}</Text>
                    </View>
                ) : (
                    verifications.map(renderVerification)
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const statusLabels = {
    pending: 'pendientes',
    approved: 'aprobadas',
    rejected: 'rechazadas'
};


