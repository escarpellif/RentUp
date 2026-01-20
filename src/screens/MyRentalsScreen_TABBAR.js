import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MyRentalsScreen({ navigation, session }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('renting'); // renting, hosting, tickets
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRentals();
        checkExpiredRentals(); // Verificar expirados ao carregar
    }, [activeTab]);

    // Verificar e expirar solicitações não aprovadas 1 hora antes do pickup
    const checkExpiredRentals = async () => {
        try {
            const { data: pendingRentals, error } = await supabase
                .from('rentals')
                .select('*')
                .eq('status', 'pending');

            if (error) throw error;

            const now = new Date();

            for (const rental of pendingRentals) {
                // Calcular 1 hora antes do pickup
                const startDateOnly = rental.start_date.split('T')[0];
                const [pickupHour, pickupMinute] = (rental.pickup_time || '10:00').split(':');
                const [year, month, day] = startDateOnly.split('-');

                const pickupDateTime = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    parseInt(pickupHour),
                    parseInt(pickupMinute),
                    0
                );

                // 1 hora antes em milliseconds = 60 * 60 * 1000
                const oneHourBefore = new Date(pickupDateTime.getTime() - (60 * 60 * 1000));

                if (now >= oneHourBefore) {
                    // Expirar a solicitação
                    await supabase
                        .from('rentals')
                        .update({
                            status: 'expired',
                            rejection_reason: 'La solicitud expiró porque el propietario no respondió a tiempo'
                        })
                        .eq('id', rental.id);

                    // Notificar o solicitante
                    await supabase
                        .from('user_notifications')
                        .insert({
                            user_id: rental.renter_id,
                            type: 'rental_expired',
                            title: '⏰ Solicitud Expirada',
                            message: `Tu solicitud para alquilar este artículo expiró porque el propietario no respondió a tiempo.`,
                            related_id: rental.id,
                            read: false,
                        });
                }
            }
        } catch (error) {
            console.error('Error checking expired rentals:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await checkExpiredRentals();
        await fetchRentals();
        setRefreshing(false);
    };

    const fetchRentals = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    renter:profiles!rentals_renter_id_fkey(id, username, full_name),
                    owner:profiles!rentals_owner_id_fkey(id, username, full_name)
                `)
                .order('created_at', { ascending: false });

            const userId = session.user.id;

            if (activeTab === 'tickets') {
                // Tickets = todas as locações ativas
                query = query.in('status', ['approved', 'active'])
                    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`);
            } else if (activeTab === 'renting') {
                // Alquilo = coisas que EU alugo
                query = query.eq('renter_id', userId);
            } else if (activeTab === 'hosting') {
                // Mis Productos = meus produtos alugados
                query = query.eq('owner_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRentals(data || []);
        } catch (error) {
            console.error('Error fetching rentals:', error);
        }
        setLoading(false);
    };

    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    const calculateOwnerAmount = (rental) => {
        if (rental.owner_amount) return parseFloat(rental.owner_amount);

        const basePrice = parseFloat(rental.item?.price_per_day || 0);
        const days = rental.total_days || 1;
        let ownerAmount = basePrice * days;

        if (days >= 7 && days < 30 && rental.item?.discount_week) {
            const discount = parseFloat(rental.item.discount_week) || 0;
            ownerAmount = ownerAmount * (1 - discount / 100);
        }

        if (days >= 30 && rental.item?.discount_month) {
            const discount = parseFloat(rental.item.discount_month) || 0;
            ownerAmount = ownerAmount * (1 - discount / 100);
        }

        return ownerAmount;
    };

    const handleApprove = async (rentalId) => {
        const rental = rentals.find(r => r.id === rentalId);
        const ownerCode = generateCode();
        const renterCode = generateCode();
        const ownerAmount = calculateOwnerAmount(rental);

        try {
            const { error } = await supabase
                .from('rentals')
                .update({
                    status: 'approved',
                    owner_code: ownerCode,
                    renter_code: renterCode,
                    owner_amount: ownerAmount,
                })
                .eq('id', rentalId);

            if (error) throw error;

            await supabase
                .from('user_notifications')
                .insert({
                    user_id: rental.renter_id,
                    type: 'rental_approved',
                    title: '✅ Solicitud Aprobada',
                    message: `Tu solicitud fue aprobada.\n\n🔑 Código de devolución: ${renterCode}`,
                    related_id: rentalId,
                    read: false,
                });

            Alert.alert('✅ Aprobado', `Código de recogida: ${ownerCode}\n\nRecibirás: €${ownerAmount.toFixed(2)}`);
            fetchRentals();
        } catch (error) {
            Alert.alert('Error', 'No se pudo aprobar');
        }
    };

    const handleReject = async (rentalId) => {
        Alert.prompt(
            'Motivo del Rechazo',
            'Por favor, indica el motivo',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    onPress: async (reason) => {
                        if (!reason?.trim()) {
                            Alert.alert('Error', 'Debes ingresar un motivo');
                            return;
                        }

                        try {
                            const rental = rentals.find(r => r.id === rentalId);

                            await supabase
                                .from('rentals')
                                .update({ status: 'rejected', rejection_reason: reason })
                                .eq('id', rentalId);

                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: rental.renter_id,
                                    type: 'rental_rejected',
                                    title: 'Solicitud Rechazada',
                                    message: `Motivo: ${reason}`,
                                    related_id: rentalId,
                                    read: false,
                                });

                            Alert.alert('✅ Rechazado', 'La solicitud ha sido rechazada y el usuario fue notificado.');
                            fetchRentals();
                        } catch (error) {
                            console.error('Error al rechazar:', error);
                            handleApiError(error, () => handleReject(rentalId));
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const handleCancel = async (rentalId) => {
        Alert.alert(
            'Cancelar Solicitud',
            '¿Estás seguro?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('rentals')
                                .update({ status: 'cancelled' })
                                .eq('id', rentalId);

                            Alert.alert('✅ Cancelado', 'Tu solicitud ha sido cancelada exitosamente.');
                            fetchRentals();
                        } catch (error) {
                            console.error('Error al cancelar:', error);
                            handleApiError(error, () => handleCancel(rentalId));
                        }
                    }
                }
            ]
        );
    };

    const RentalCard = ({ rental }) => {
        const isOwner = rental.owner_id === session.user.id;
        const statusColors = {
            pending: '#F59E0B',
            approved: '#10B981',
            active: '#3B82F6',
            completed: '#6B7280',
            cancelled: '#EF4444',
            rejected: '#EF4444',
            expired: '#9CA3AF',
        };

        const statusLabels = {
            pending: 'Pendiente',
            approved: 'Aprobada',
            active: 'Activa',
            completed: 'Completada',
            cancelled: 'Cancelada',
            rejected: 'Rechazada',
            expired: 'Expirada',
        };

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.itemTitle}>{rental.item?.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[rental.status] }]}>
                        <Text style={styles.statusText}>{statusLabels[rental.status]}</Text>
                    </View>
                </View>

                <Text style={styles.cardSubtitle}>
                    {isOwner ? `Alquilado por: ${rental.renter?.full_name}` : `Propietario: ${rental.owner?.full_name}`}
                </Text>

                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                        {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                        {isOwner
                            ? `Recibirás: €${calculateOwnerAmount(rental).toFixed(2)}`
                            : `Total: €${parseFloat(rental.total_amount).toFixed(2)}`
                        }
                    </Text>
                </View>

                {activeTab === 'hosting' && rental.status === 'pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveBtn]}
                            onPress={() => handleApprove(rental.id)}
                        >
                            <Text style={styles.actionButtonText}>✓ Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectBtn]}
                            onPress={() => handleReject(rental.id)}
                        >
                            <Text style={styles.actionButtonText}>✗ Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'renting' && rental.status === 'pending' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelBtn]}
                        onPress={() => handleCancel(rental.id)}
                    >
                        <Text style={styles.actionButtonText}>Cancelar Solicitud</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const TabButton = ({ tab, icon, label }) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Ionicons
                name={icon}
                size={24}
                color={activeTab === tab ? '#3B82F6' : '#9CA3AF'}
            />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Transacciones</Text>
                <TouchableOpacity onPress={fetchRentals}>
                    <Ionicons name="refresh" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
                ) : rentals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="file-tray-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No hay transacciones</Text>
                    </View>
                ) : (
                    rentals.map((rental) => <RentalCard key={rental.id} rental={rental} />)
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Tab Bar Bottom */}
            <View style={styles.tabBar}>
                <TabButton tab="renting" icon="search-outline" label="Alquilo" />
                <TabButton tab="hosting" icon="cube-outline" label="Mis Productos" />
                <TabButton tab="tickets" icon="ticket-outline" label="Tickets" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#4B5563',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveBtn: {
        backgroundColor: '#10B981',
    },
    rejectBtn: {
        backgroundColor: '#EF4444',
    },
    cancelBtn: {
        backgroundColor: '#EF4444',
        marginTop: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingBottom: 20,
        paddingTop: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabButtonActive: {
        // Active state handled by icon/text color
    },
    tabLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        fontWeight: '500',
    },
    tabLabelActive: {
        color: '#3B82F6',
        fontWeight: '600',
    },
});

