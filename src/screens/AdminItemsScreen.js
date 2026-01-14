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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

export default function AdminItemsScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadItems();
    }, [filter]);

    const loadItems = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('items')
                .select(`
                    *,
                    owner:profiles!owner_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (filter === 'active') {
                query = query.eq('is_active', true).eq('is_paused', false);
            } else if (filter === 'paused') {
                query = query.eq('is_paused', true);
            } else if (filter === 'inactive') {
                query = query.eq('is_active', false);
            } else if (filter === 'reported') {
                query = query.eq('reported', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            setItems(data || []);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            Alert.alert('Error', 'No se pudieron cargar los artículos');
        } finally {
            setLoading(false);
        }
    };

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        return `https://fvhnkwxvxnsatqmljnxu.supabase.co/storage/v1/object/public/item_photos/${photoPath}`;
    };

    const toggleItemStatus = async (itemId, currentStatus) => {
        Alert.alert(
            currentStatus ? 'Desactivar Artículo' : 'Activar Artículo',
            `¿Estás seguro?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('items')
                                .update({ is_active: !currentStatus })
                                .eq('id', itemId);

                            if (error) throw error;

                            Alert.alert('Éxito', 'Artículo actualizado');
                            loadItems();
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert('Error', 'No se pudo actualizar');
                        }
                    },
                },
            ]
        );
    };

    const deleteItem = async (itemId) => {
        Alert.alert(
            'Eliminar Artículo',
            '¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('items')
                                .delete()
                                .eq('id', itemId);

                            if (error) throw error;

                            Alert.alert('Éxito', 'Artículo eliminado');
                            loadItems();
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert('Error', 'No se pudo eliminar');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const photoUrl = getPhotoUrl(item.photo_url || item.photos?.[0]);

        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
            >
                {/* Image */}
                <View style={styles.imageContainer}>
                    {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.itemImage} />
                    ) : (
                        <View style={[styles.itemImage, styles.noImage]}>
                            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                        </View>
                    )}

                    {/* Status Badges */}
                    <View style={styles.badgesContainer}>
                        {!item.is_active && (
                            <View style={[styles.statusBadge, { backgroundColor: '#EF4444' }]}>
                                <Text style={styles.statusBadgeText}>Inactivo</Text>
                            </View>
                        )}
                        {item.is_paused && (
                            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.statusBadgeText}>Pausado</Text>
                            </View>
                        )}
                        {item.is_active && !item.is_paused && (
                            <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                                <Text style={styles.statusBadgeText}>Activo</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info */}
                <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.itemPrice}>€{item.price_per_day}/día</Text>
                    </View>

                    <Text style={styles.itemCategory}>{item.category}</Text>

                    <View style={styles.ownerInfo}>
                        <Ionicons name="person" size={14} color="#6B7280" />
                        <Text style={styles.ownerText}>{item.owner?.full_name}</Text>
                    </View>

                    <View style={styles.locationInfo}>
                        <Ionicons name="location" size={14} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.location}
                        </Text>
                    </View>

                    <View style={styles.dateInfo}>
                        <Ionicons name="calendar" size={14} color="#6B7280" />
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionButton, item.is_active ? styles.deactivateButton : styles.activateButton]}
                            onPress={() => toggleItemStatus(item.id, item.is_active)}
                        >
                            <Ionicons
                                name={item.is_active ? "close-circle" : "checkmark-circle"}
                                size={16}
                                color="#fff"
                            />
                            <Text style={styles.actionButtonText}>
                                {item.is_active ? 'Desactivar' : 'Activar'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => deleteItem(item.id)}
                        >
                            <Ionicons name="trash" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const filteredItems = items.filter(item => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.title?.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query) ||
            item.owner?.full_name?.toLowerCase().includes(query) ||
            item.location?.toLowerCase().includes(query)
        );
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Artículos</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por título, categoría, propietario..."
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
                        Todos
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
                    style={[styles.filterButton, filter === 'paused' && styles.filterButtonActive]}
                    onPress={() => setFilter('paused')}
                >
                    <Text style={[styles.filterText, filter === 'paused' && styles.filterTextActive]}>
                        Pausados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'inactive' && styles.filterButtonActive]}
                    onPress={() => setFilter('inactive')}
                >
                    <Text style={[styles.filterText, filter === 'inactive' && styles.filterTextActive]}>
                        Inactivos
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{filteredItems.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredItems.filter(i => i.is_active && !i.is_paused).length}
                    </Text>
                    <Text style={styles.statLabel}>Activos</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredItems.filter(i => i.is_paused).length}
                    </Text>
                    <Text style={styles.statLabel}>Pausados</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredItems.filter(i => !i.is_active).length}
                    </Text>
                    <Text style={styles.statLabel}>Inactivos</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadItems} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No hay artículos</Text>
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
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    list: {
        padding: 16,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    imageContainer: {
        width: 120,
        height: 150,
        position: 'relative',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    noImage: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgesContainer: {
        position: 'absolute',
        top: 8,
        left: 8,
        gap: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
    itemInfo: {
        flex: 1,
        padding: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    itemTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginRight: 8,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    },
    itemCategory: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    ownerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    ownerText: {
        fontSize: 13,
        color: '#6B7280',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
    },
    activateButton: {
        backgroundColor: '#10B981',
    },
    deactivateButton: {
        backgroundColor: '#F59E0B',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
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

