import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function AdminVerificationsScreen({ navigation, session }) {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

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
                            // Atualizar verificação
                            const { error: verError } = await supabase
                                .from('user_verifications')
                                .update({
                                    status: 'approved',
                                    reviewed_at: new Date().toISOString(),
                                    reviewed_by: session.user.id
                                })
                                .eq('id', verification.id);

                            if (verError) throw verError;

                            // Atualizar perfil
                            const { error: profError } = await supabase
                                .from('profiles')
                                .update({ verification_status: 'approved' })
                                .eq('id', verification.user_id);

                            if (profError) throw profError;

                            Alert.alert('¡Éxito!', 'Verificación aprobada correctamente');
                            fetchVerifications();
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

                            // Atualizar perfil
                            const { error: profError } = await supabase
                                .from('profiles')
                                .update({ verification_status: 'rejected' })
                                .eq('id', verification.user_id);

                            if (profError) throw profError;

                            Alert.alert('Verificación Rechazada', 'El usuario será notificado');
                            fetchVerifications();
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
            <View key={item.id} style={styles.card}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
                    <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.profiles?.full_name || 'Sin nombre'}</Text>
                    <Text style={styles.userEmail}>{item.profiles?.email || 'Sin email'}</Text>
                </View>

                {/* Document Info */}
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Tipo:</Text>
                    <Text style={styles.value}>{docTypeLabels[item.document_type]}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Número:</Text>
                    <Text style={styles.value}>{item.document_number}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Enviado:</Text>
                    <Text style={styles.value}>
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
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Revisado:</Text>
                        <Text style={styles.value}>
                            {new Date(item.reviewed_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                )}

                {item.rejection_reason && (
                    <View style={styles.rejectionReasonBox}>
                        <Text style={styles.rejectionReasonLabel}>Motivo de rechazo:</Text>
                        <Text style={styles.rejectionReasonText}>{item.rejection_reason}</Text>
                    </View>
                )}

                {/* View Documents */}
                <View style={styles.documentsRow}>
                    <TouchableOpacity
                        style={styles.documentButton}
                        onPress={() => viewDocument(item.document_photo)}
                    >
                        <Text style={styles.documentButtonIcon}>📄</Text>
                        <Text style={styles.documentButtonText}>Ver Documento</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.documentButton}
                        onPress={() => viewDocument(item.selfie_photo)}
                    >
                        <Text style={styles.documentButtonIcon}>🤳</Text>
                        <Text style={styles.documentButtonText}>Ver Selfie</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Buttons (only for pending) */}
                {item.status === 'pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApprove(item)}
                        >
                            <Text style={styles.actionButtonText}>✅ Aprobar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(item)}
                        >
                            <Text style={styles.actionButtonText}>❌ Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
                    <Text style={styles.headerTitle}>Verificaciones</Text>
                    <Text style={styles.headerSubtitle}>Panel de Administración</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
                    onPress={() => setFilter('approved')}
                >
                    <Text style={[styles.filterButtonText, filter === 'approved' && styles.filterButtonTextActive]}>
                        Aprobados
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
                    onPress={() => setFilter('rejected')}
                >
                    <Text style={[styles.filterButtonText, filter === 'rejected' && styles.filterButtonTextActive]}>
                        Rechazados
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Cargando...</Text>
                    </View>
                ) : verifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No hay verificaciones {filter !== 'all' ? statusLabels[filter].toLowerCase() : ''}</Text>
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

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
    },
    headerSpacer: {
        width: 40,
    },
    filtersContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userInfo: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    value: {
        fontSize: 14,
        color: '#333',
    },
    rejectionReasonBox: {
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    rejectionReasonLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 4,
    },
    rejectionReasonText: {
        fontSize: 14,
        color: '#856404',
    },
    documentsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    documentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    documentButtonIcon: {
        fontSize: 18,
    },
    documentButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1976D2',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#28a745',
    },
    rejectButton: {
        backgroundColor: '#dc3545',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

