import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import ItemCard from '../components/ItemCard';
import { categories, sortOptions } from '../constants/categoryConfig';
import { mainMarketplaceStyles as styles } from '../styles/mainMarketplaceStyles';
import { calculateDistance } from '../utils/locationHelper';

export default function MainMarketplace({ session, navigation, route }) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [sortBy, setSortBy] = useState('default');
    const [showCategories, setShowCategories] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [itemsToShow, setItemsToShow] = useState(6);
    const [userLocation, setUserLocation] = useState(null);

    // Função para obter localização do usuário
    async function getUserLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            console.error('Error obteniendo localización:', error);
        }
    }

    useEffect(() => {
        getUserLocation();
    }, []);

    async function fetchItems() {
        setLoading(true);

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('is_paused', false) // Filtrar apenas itens não pausados
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar itens:", error.message);
            setLoading(false);
            return;
        }

        setItems(data || []);
        setFilteredItems(data || []);
        setLoading(false);
    }

    useEffect(() => {
        fetchItems();

        const unsubscribe = navigation.addListener('focus', () => {
            fetchItems();
        });
        return unsubscribe;
    }, [navigation]);

    // Aplicar filtros
    useEffect(() => {
        let filtered = items;

        // Filtro por categoria (incluindo subcategoria)
        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(item =>
                item.category === selectedCategory ||
                item.subcategory === selectedCategory
            );
        }

        // Filtro por busca (incluindo categoria e subcategoria)
        if (searchQuery.trim()) {
            filtered = filtered.filter(item =>
                item?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Aplicar ordenação
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price_low':
                    return parseFloat(a.price_per_day) - parseFloat(b.price_per_day);
                case 'price_high':
                    return parseFloat(b.price_per_day) - parseFloat(a.price_per_day);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'distance':
                    // Ordenar por proximidade
                    if (!userLocation) return 0;

                    const distanceA = (a.coordinates?.latitude && a.coordinates?.longitude)
                        ? calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            a.coordinates.latitude,
                            a.coordinates.longitude
                        )
                        : Infinity;

                    const distanceB = (b.coordinates?.latitude && b.coordinates?.longitude)
                        ? calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            b.coordinates.latitude,
                            b.coordinates.longitude
                        )
                        : Infinity;

                    return distanceA - distanceB;
                case 'recent':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'default':
                default:
                    return 0; // Manter ordem original
            }
        });

        setFilteredItems(sorted);
    }, [searchQuery, selectedCategory, items, sortBy, userLocation]);

    // Verificar se há parâmetros de busca/categoria da HomeScreen
    useEffect(() => {
        if (route.params?.search) {
            setSearchQuery(route.params.search);
        }
        if (route.params?.category) {
            setSelectedCategory(route.params.category);
        }
    }, [route.params]);

    const navigateToDetails = (item) => {
        if (session?.user?.id && item.owner_id === session.user.id) {
            navigation.navigate('EditItem', { item: item });
        } else {
            navigation.navigate('ItemDetails', { item: item });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#2c4455" />
                    <Text style={styles.loadingText}>Cargando artículos...</Text>
                    <Text style={styles.loadingSubtext}>Preparando el marketplace para ti</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.fullContainer}>
            {/* Header Verde - Apenas com Título e Logo */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    {/* Botão Voltar + Marketplace */}
                    <View style={styles.leftHeader}>
                        <TouchableOpacity
                            style={styles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Marketplace</Text>
                    </View>

                    {/* ALUKO à Direita */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/app-icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.logoText}>ALUKO</Text>
                    </View>
                </View>

                {/* Search Bar - Linha Inteira */}
                <View style={styles.searchBarRow}>
                    {/* Barra de Pesquisa */}
                    <View style={styles.searchInputContainer}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                style={styles.clearButton}
                            >
                                <Text style={styles.clearIcon}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>



            {/* Filtros - Linha Abaixo */}
            <View style={styles.filtersRow}>
                {/* Categorias - Expansível */}
                <View style={styles.filterButtonsContainer}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowCategories(!showCategories)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.filterButtonText}>
                            {selectedCategory === 'Todos' ? 'Categorías' : selectedCategory}
                        </Text>
                    </TouchableOpacity>

                    {showCategories && (
                        <View style={styles.filterContent}>
                            <ScrollView
                                style={styles.filterScrollView}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {categories.map((category) => {
                                    const isActive = selectedCategory === category;

                                    return (
                                        <TouchableOpacity
                                            key={category}
                                            style={[styles.filterOption, isActive && styles.filterOptionActive]}
                                            onPress={() => {
                                                setSelectedCategory(category);
                                                setShowCategories(false);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>
                                                {category}
                                            </Text>
                                            {isActive && <Text style={styles.filterOptionCheck}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Ordenação - Expansível */}
                <View style={styles.filterButtonsContainer}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowSort(!showSort)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.filterButtonText}>
                            {sortOptions.find(o => o.id === sortBy)?.label || 'Ordenar'}
                        </Text>
                    </TouchableOpacity>

                    {showSort && (
                        <View style={styles.filterContent}>
                            <ScrollView
                                style={styles.filterScrollView}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {sortOptions.map((option) => {
                                    const isActive = sortBy === option.id;

                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[styles.filterOption, isActive && styles.filterOptionActive]}
                                            onPress={() => {
                                                setSortBy(option.id);
                                                setShowSort(false);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>
                                                {option.label}
                                            </Text>
                                            {isActive && <Text style={styles.filterOptionCheck}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            {/* Lista de Itens em Grid melhorado */}
            <FlatList
                data={filteredItems.slice(0, itemsToShow)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ItemCard
                        item={item}
                        onDetailsPress={navigateToDetails}
                        userId={session?.user?.id}
                        userLocation={userLocation}
                    />
                )
                }
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                ListFooterComponent={() => (
                    itemsToShow < filteredItems.length ? (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={() => setItemsToShow(itemsToShow + 6)}
                        >
                            <Text style={styles.loadMoreText}>Ver Mais ({filteredItems.length - itemsToShow} restantes)</Text>
                        </TouchableOpacity>
                    ) : null
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyContent}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyTitle}>Ningún artículo encontrado</Text>
                            <Text style={styles.emptyText}>
                                {searchQuery || selectedCategory !== 'Todos'
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : '¡Sé el primero en anunciar un artículo!'}
                            </Text>
                            {(searchQuery || selectedCategory !== 'Todos') && (
                                <TouchableOpacity
                                    style={styles.clearFiltersButton}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('Todos');
                                    }}
                                >
                                    <Text style={styles.clearFiltersButtonText}>Limpiar Filtros</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchItems}
            />

            {/* Botão Flutuante */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddItem')}
                activeOpacity={0.9}
            >
                <View style={styles.addButtonInner}>
                    <Text style={styles.addButtonText}>+</Text>
                </View>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

