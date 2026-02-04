import React, { useState, useEffect } from 'react';
import {View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { adminRentalsStyles } from '../styles/screens/adminRentalsStyles';

export default function AdminRentalsScreen({ route, navigation }) {
    const initialFilter = route.params?.filter || 'all';
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(initialFilter);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadRentals();
    }, [filter]);

    const loadRentals = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(title, category, price_per_day),
                    owner:profiles!owner_id(full_name, email),
                    renter:profiles!renter_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            setRentals(data || []);
        } catch (error) {
            console.error('Erro ao carregar locações:', error);
            Alert.alert('Error', 'No se pudieron cargar las locaciones');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pendiente', color: '#F59E0B', icon: 'hourglass' },
            approved: { label: 'Aprobado', color: '#3B82F6', icon: 'checkmark-circle' },
            active: { label: 'Activo', color: '#10B981', icon: 'time' },
            completed: { label: 'Completado', color: '#06B6D4', icon: 'checkmark-done' },
            cancelled: { label: 'Cancelado', color: '#6B7280', icon: 'close-circle' },
            rejected: { label: 'Rechazado', color: '#EF4444', icon: 'ban' },
            expired: { label: 'Expirado', color: '#F97316', icon: 'time-outline' },
            dispute_open: { label: 'Disputa', color: '#DC2626', icon: 'alert-circle' },
        };
        return statusMap[status] || { label: status, color: '#9CA3AF', icon: 'help-circle' };
    };

    const renderRental = ({ item }) => {
        const statusInfo = getStatusInfo(item.status);
        const totalDays = item.total_days || 0;
        const totalAmount = item.total_amount || 0;

        return (
            <TouchableOpacity
                style={adminRentalsStyles.rentalCard}
                onPress={() => navigation.navigate('RentalDetails', { rental: item })}
            >
                {/* Header */}
                <View style={adminRentalsStyles.rentalHeader}>
                    <View style={adminRentalsStyles.rentalHeaderLeft}>
                        <Text style={adminRentalsStyles.itemTitle} numberOfLines={1}>
                            {item.item?.title}
                        </Text>
                        <Text style={adminRentalsStyles.category}>{item.item?.category}</Text>
                    </View>
                    <View style={[adminRentalsStyles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                        <Text style={[adminRentalsStyles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                {/* Parties */}
                <View style={adminRentalsStyles.partiesContainer}>
                    <View style={adminRentalsStyles.partyColumn}>
                        <Text style={adminRentalsStyles.partyLabel}>Propietario:</Text>
                        <Text style={adminRentalsStyles.partyName}>{item.owner?.full_name}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                    <View style={adminRentalsStyles.partyColumn}>
                        <Text style={adminRentalsStyles.partyLabel}>Locatario:</Text>
                        <Text style={adminRentalsStyles.partyName}>{item.renter?.full_name}</Text>
                    </View>
                </View>

                {/* Dates */}
                <View style={adminRentalsStyles.datesContainer}>
                    <View style={adminRentalsStyles.dateItem}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={adminRentalsStyles.dateText}>
                            {new Date(item.start_date).toLocaleDateString('es-ES')} - {new Date(item.end_date).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                    <Text style={adminRentalsStyles.daysText}>{totalDays} días</Text>
                </View>

                {/* Financial */}
                <View style={adminRentalsStyles.financialContainer}>
                    <View style={adminRentalsStyles.financialRow}>
                        <Text style={adminRentalsStyles.financialLabel}>Subtotal:</Text>
                        <Text style={adminRentalsStyles.financialValue}>€{(item.subtotal || 0).toFixed(2)}</Text>
                    </View>
                    <View style={adminRentalsStyles.financialRow}>
                        <Text style={adminRentalsStyles.financialLabel}>Taxa de Servicio:</Text>
                        <Text style={adminRentalsStyles.financialValue}>€{(item.service_fee || 0).toFixed(2)}</Text>
                    </View>
                    <View style={adminRentalsStyles.divider} />
                    <View style={adminRentalsStyles.financialRow}>
                        <Text style={adminRentalsStyles.totalLabel}>Total:</Text>
                        <Text style={adminRentalsStyles.totalValue}>€{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={adminRentalsStyles.footer}>
                    <Text style={adminRentalsStyles.footerDate}>
                        Creado: {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </Text>
                    <TouchableOpacity
                        style={adminRentalsStyles.viewButton}
                        onPress={() => navigation.navigate('RentalDetails', { rental: item })}
                    >
                        <Text style={adminRentalsStyles.viewButtonText}>Ver Detalles</Text>
                        <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const filteredRentals = rentals.filter(rental => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            rental.item?.title?.toLowerCase().includes(query) ||
            rental.owner?.full_name?.toLowerCase().includes(query) ||
            rental.renter?.full_name?.toLowerCase().includes(query)
        );
    });

    return (
        <SafeAreaView style={adminRentalsStyles.container}>
            {/* Header */}
            <View style={adminRentalsStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={adminRentalsStyles.headerTitle}>Gestión de Locaciones</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={adminRentalsStyles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={adminRentalsStyles.searchInput}
                    placeholder="Buscar por artículo, propietario o locatario..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={adminRentalsStyles.filtersContainer}
                contentContainerStyle={adminRentalsStyles.filtersContent}
            >
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'all' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'all' && adminRentalsStyles.filterTextActive]}>
                        Todas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'pending' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'pending' && adminRentalsStyles.filterTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'approved' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('approved')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'approved' && adminRentalsStyles.filterTextActive]}>
                        Aprobados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'active' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('active')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'active' && adminRentalsStyles.filterTextActive]}>
                        Activos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'completed' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('completed')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'completed' && adminRentalsStyles.filterTextActive]}>
                        Completados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'cancelled' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('cancelled')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'cancelled' && adminRentalsStyles.filterTextActive]}>
                        Cancelados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminRentalsStyles.filterButton, filter === 'dispute_open' && adminRentalsStyles.filterButtonActive]}
                    onPress={() => setFilter('dispute_open')}
                >
                    <Text style={[adminRentalsStyles.filterText, filter === 'dispute_open' && adminRentalsStyles.filterTextActive]}>
                        Disputas
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* List */}
            <FlatList
                data={filteredRentals}
                keyExtractor={(item) => item.id}
                renderItem={renderRental}
                contentContainerStyle={adminRentalsStyles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadRentals} />
                }
                ListEmptyComponent={
                    <View style={adminRentalsStyles.emptyContainer}>
                        <Ionicons name="document-outline" size={64} color="#9CA3AF" />
                        <Text style={adminRentalsStyles.emptyText}>No hay locaciones</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}



