import React, { useState, useEffect } from 'react';
import {View,
    Text,
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
import { adminItemsStyles } from '../styles/screens/adminItemsStyles';

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
                style={adminItemsStyles.itemCard}
                onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
            >
                {/* Image */}
                <View style={adminItemsStyles.imageContainer}>
                    {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={adminItemsStyles.itemImage} />
                    ) : (
                        <View style={[adminItemsStyles.itemImage, adminItemsStyles.noImage]}>
                            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                        </View>
                    )}

                    {/* Status Badges */}
                    <View style={adminItemsStyles.badgesContainer}>
                        {!item.is_active && (
                            <View style={[adminItemsStyles.statusBadge, { backgroundColor: '#EF4444' }]}>
                                <Text style={adminItemsStyles.statusBadgeText}>Inactivo</Text>
                            </View>
                        )}
                        {item.is_paused && (
                            <View style={[adminItemsStyles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={adminItemsStyles.statusBadgeText}>Pausado</Text>
                            </View>
                        )}
                        {item.is_active && !item.is_paused && (
                            <View style={[adminItemsStyles.statusBadge, { backgroundColor: '#10B981' }]}>
                                <Text style={adminItemsStyles.statusBadgeText}>Activo</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info */}
                <View style={adminItemsStyles.itemInfo}>
                    <View style={adminItemsStyles.itemHeader}>
                        <Text style={adminItemsStyles.itemTitle} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={adminItemsStyles.itemPrice}>€{item.price_per_day}/día</Text>
                    </View>

                    <Text style={adminItemsStyles.itemCategory}>{item.category}</Text>

                    <View style={adminItemsStyles.ownerInfo}>
                        <Ionicons name="person" size={14} color="#6B7280" />
                        <Text style={adminItemsStyles.ownerText}>{item.owner?.full_name}</Text>
                    </View>

                    <View style={adminItemsStyles.locationInfo}>
                        <Ionicons name="location" size={14} color="#6B7280" />
                        <Text style={adminItemsStyles.locationText} numberOfLines={1}>
                            {item.location}
                        </Text>
                    </View>

                    <View style={adminItemsStyles.dateInfo}>
                        <Ionicons name="calendar" size={14} color="#6B7280" />
                        <Text style={adminItemsStyles.dateText}>
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={adminItemsStyles.actions}>
                        <TouchableOpacity
                            style={[adminItemsStyles.actionButton, item.is_active ? adminItemsStyles.deactivateButton : adminItemsStyles.activateButton]}
                            onPress={() => toggleItemStatus(item.id, item.is_active)}
                        >
                            <Ionicons
                                name={item.is_active ? "close-circle" : "checkmark-circle"}
                                size={16}
                                color="#fff"
                            />
                            <Text style={adminItemsStyles.actionButtonText}>
                                {item.is_active ? 'Desactivar' : 'Activar'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[adminItemsStyles.actionButton, adminItemsStyles.deleteButton]}
                            onPress={() => deleteItem(item.id)}
                        >
                            <Ionicons name="trash" size={16} color="#fff" />
                            <Text style={adminItemsStyles.actionButtonText}>Eliminar</Text>
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
        <SafeAreaView style={adminItemsStyles.container}>
            {/* Header */}
            <View style={adminItemsStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={adminItemsStyles.headerTitle}>Gestión de Artículos</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={adminItemsStyles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={adminItemsStyles.searchInput}
                    placeholder="Buscar por título, categoría, propietario..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={adminItemsStyles.filtersContainer}
                contentContainerStyle={adminItemsStyles.filtersContent}
            >
                <TouchableOpacity
                    style={[adminItemsStyles.filterButton, filter === 'all' && adminItemsStyles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[adminItemsStyles.filterText, filter === 'all' && adminItemsStyles.filterTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminItemsStyles.filterButton, filter === 'active' && adminItemsStyles.filterButtonActive]}
                    onPress={() => setFilter('active')}
                >
                    <Text style={[adminItemsStyles.filterText, filter === 'active' && adminItemsStyles.filterTextActive]}>
                        Activos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminItemsStyles.filterButton, filter === 'paused' && adminItemsStyles.filterButtonActive]}
                    onPress={() => setFilter('paused')}
                >
                    <Text style={[adminItemsStyles.filterText, filter === 'paused' && adminItemsStyles.filterTextActive]}>
                        Pausados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminItemsStyles.filterButton, filter === 'inactive' && adminItemsStyles.filterButtonActive]}
                    onPress={() => setFilter('inactive')}
                >
                    <Text style={[adminItemsStyles.filterText, filter === 'inactive' && adminItemsStyles.filterTextActive]}>
                        Inactivos
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Stats Summary */}
            <View style={adminItemsStyles.statsContainer}>
                <View style={adminItemsStyles.statItem}>
                    <Text style={adminItemsStyles.statValue}>{filteredItems.length}</Text>
                    <Text style={adminItemsStyles.statLabel}>Total</Text>
                </View>
                <View style={adminItemsStyles.statItem}>
                    <Text style={adminItemsStyles.statValue}>
                        {filteredItems.filter(i => i.is_active && !i.is_paused).length}
                    </Text>
                    <Text style={adminItemsStyles.statLabel}>Activos</Text>
                </View>
                <View style={adminItemsStyles.statItem}>
                    <Text style={adminItemsStyles.statValue}>
                        {filteredItems.filter(i => i.is_paused).length}
                    </Text>
                    <Text style={adminItemsStyles.statLabel}>Pausados</Text>
                </View>
                <View style={adminItemsStyles.statItem}>
                    <Text style={adminItemsStyles.statValue}>
                        {filteredItems.filter(i => !i.is_active).length}
                    </Text>
                    <Text style={adminItemsStyles.statLabel}>Inactivos</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={adminItemsStyles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadItems} />
                }
                ListEmptyComponent={
                    <View style={adminItemsStyles.emptyContainer}>
                        <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                        <Text style={adminItemsStyles.emptyText}>No hay artículos</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}



