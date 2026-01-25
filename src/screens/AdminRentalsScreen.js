import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
                style={styles.rentalCard}
                onPress={() => navigation.navigate('RentalDetails', { rental: item })}
            >
                {/* Header */}
                <View style={styles.rentalHeader}>
                    <View style={styles.rentalHeaderLeft}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.item?.title}
                        </Text>
                        <Text style={styles.category}>{item.item?.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                {/* Parties */}
                <View style={styles.partiesContainer}>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyLabel}>Propietario:</Text>
                        <Text style={styles.partyName}>{item.owner?.full_name}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyLabel}>Locatario:</Text>
                        <Text style={styles.partyName}>{item.renter?.full_name}</Text>
                    </View>
                </View>

                {/* Dates */}
                <View style={styles.datesContainer}>
                    <View style={styles.dateItem}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.dateText}>
                            {new Date(item.start_date).toLocaleDateString('es-ES')} - {new Date(item.end_date).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                    <Text style={styles.daysText}>{totalDays} días</Text>
                </View>

                {/* Financial */}
                <View style={styles.financialContainer}>
                    <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>Subtotal:</Text>
                        <Text style={styles.financialValue}>€{(item.subtotal || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>Taxa de Servicio:</Text>
                        <Text style={styles.financialValue}>€{(item.service_fee || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.financialRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>€{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerDate}>
                        Creado: {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </Text>
                    <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => navigation.navigate('RentalDetails', { rental: item })}
                    >
                        <Text style={styles.viewButtonText}>Ver Detalles</Text>
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
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Locaciones</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por artículo, propietario o locatario..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Todas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
                    onPress={() => setFilter('approved')}
                >
                    <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
                        Aprobados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
                    onPress={() => setFilter('active')}
                >
                    <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
                        Activos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
                    onPress={() => setFilter('completed')}
                >
                    <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
                        Completados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
                    onPress={() => setFilter('cancelled')}
                >
                    <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
                        Cancelados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'dispute_open' && styles.filterButtonActive]}
                    onPress={() => setFilter('dispute_open')}
                >
                    <Text style={[styles.filterText, filter === 'dispute_open' && styles.filterTextActive]}>
                        Disputas
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* List */}
            <FlatList
                data={filteredRentals}
                keyExtractor={(item) => item.id}
                renderItem={renderRental}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadRentals} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No hay locaciones</Text>
                    </View>
                }
            />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1F2937',
    },
    filtersContainer: {
        maxHeight: 50,
        marginBottom: 16,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    rentalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    rentalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    rentalHeaderLeft: {
        flex: 1,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    category: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    partiesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    partyColumn: {
        flex: 1,
    },
    partyLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    partyName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    datesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        color: '#6B7280',
    },
    daysText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    financialContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    financialLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    financialValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 6,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
});

