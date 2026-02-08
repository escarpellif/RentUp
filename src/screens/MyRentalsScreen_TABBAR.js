import React, { useState, useEffect } from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../utils/errorHandler';
import { myRentals_TABBARStyles } from '../styles/screens/myRentals_TABBARStyles';

export default function MyRentalsScreen({ navigation, session }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('renting'); // renting, hosting, tickets
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // TEMPORÁRIO: Valor fixo para debug
    const SCREEN_WIDTH = 375;

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
                    renter:renter_id(id, username, full_name),
                    owner:owner_id(id, username, full_name)
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
            <View style={myRentals_TABBARStyles.card}>
                <View style={myRentals_TABBARStyles.cardHeader}>
                    <Text style={myRentals_TABBARStyles.itemTitle}>{rental.item?.title}</Text>
                    <View style={[myRentals_TABBARStyles.statusBadge, { backgroundColor: statusColors[rental.status] }]}>
                        <Text style={myRentals_TABBARStyles.statusText}>{statusLabels[rental.status]}</Text>
                    </View>
                </View>

                <Text style={myRentals_TABBARStyles.cardSubtitle}>
                    {isOwner ? `Alquilado por: ${rental.renter?.full_name}` : `Propietario: ${rental.owner?.full_name}`}
                </Text>

                <View style={myRentals_TABBARStyles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={myRentals_TABBARStyles.infoText}>
                        {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                    </Text>
                </View>

                <View style={myRentals_TABBARStyles.infoRow}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={myRentals_TABBARStyles.infoText}>
                        {isOwner
                            ? `Recibirás: €${calculateOwnerAmount(rental).toFixed(2)}`
                            : `Total: €${parseFloat(rental.total_amount).toFixed(2)}`
                        }
                    </Text>
                </View>

                {activeTab === 'hosting' && rental.status === 'pending' && (
                    <View style={myRentals_TABBARStyles.actionRow}>
                        <TouchableOpacity
                            style={[myRentals_TABBARStyles.actionButton, myRentals_TABBARStyles.approveBtn]}
                            onPress={() => handleApprove(rental.id)}
                        >
                            <Text style={myRentals_TABBARStyles.actionButtonText}>✓ Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[myRentals_TABBARStyles.actionButton, myRentals_TABBARStyles.rejectBtn]}
                            onPress={() => handleReject(rental.id)}
                        >
                            <Text style={myRentals_TABBARStyles.actionButtonText}>✗ Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeTab === 'renting' && rental.status === 'pending' && (
                    <TouchableOpacity
                        style={[myRentals_TABBARStyles.actionButton, myRentals_TABBARStyles.cancelBtn]}
                        onPress={() => handleCancel(rental.id)}
                    >
                        <Text style={myRentals_TABBARStyles.actionButtonText}>Cancelar Solicitud</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const TabButton = ({ tab, icon, label }) => (
        <TouchableOpacity
            style={[myRentals_TABBARStyles.tabButton, activeTab === tab && myRentals_TABBARStyles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Ionicons
                name={icon}
                size={24}
                color={activeTab === tab ? '#3B82F6' : '#9CA3AF'}
            />
            <Text style={[myRentals_TABBARStyles.tabLabel, activeTab === tab && myRentals_TABBARStyles.tabLabelActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={myRentals_TABBARStyles.container} edges={['top']}>
            {/* Header */}
            <View style={myRentals_TABBARStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={myRentals_TABBARStyles.headerTitle}>Mis Transacciones</Text>
                <TouchableOpacity onPress={fetchRentals}>
                    <Ionicons name="refresh" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={myRentals_TABBARStyles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
                ) : rentals.length === 0 ? (
                    <View style={myRentals_TABBARStyles.emptyState}>
                        <Ionicons name="file-tray-outline" size={64} color="#D1D5DB" />
                        <Text style={myRentals_TABBARStyles.emptyText}>No hay transacciones</Text>
                    </View>
                ) : (
                    rentals.map((rental) => <RentalCard key={rental.id} rental={rental} />)
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Tab Bar Bottom */}
            <View style={myRentals_TABBARStyles.tabBar}>
                <TabButton tab="renting" icon="search-outline" label="Alquilo" />
                <TabButton tab="hosting" icon="cube-outline" label="Mis Productos" />
                <TabButton tab="tickets" icon="ticket-outline" label="Tickets" />
            </View>
        </SafeAreaView>
    );
}



