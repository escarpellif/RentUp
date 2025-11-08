import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

// Mapeamento de ícones e cores por categoria
const categoryConfig = {
    'Electrónicos': { icon: '🎮', color: '#FF6B6B', gradient: ['#FF6B6B', '#EE5A6F'] },
    'Deportes': { icon: '🏀', color: '#FF9F43', gradient: ['#FF9F43', '#FF8C00'] },
    'Vehículos': { icon: '🚗', color: '#48DBFB', gradient: ['#48DBFB', '#0FB9E0'] },
    'Muebles': { icon: '🛋️', color: '#FFC312', gradient: ['#FFC312', '#EEA500'] },
    'Herramientas': { icon: '🔧', color: '#A29BFE', gradient: ['#A29BFE', '#8B7FEE'] },
    'Fiestas': { icon: '🎉', color: '#FF6348', gradient: ['#FF6348', '#E84118'] },
    'Jardín': { icon: '🌱', color: '#26DE81', gradient: ['#26DE81', '#20BF6B'] },
    'Otros': { icon: '📦', color: '#95A5A6', gradient: ['#95A5A6', '#7F8C8D'] },
};

// Componente para renderizar cada item em formato de card moderno
const ItemCard = ({ item, onDetailsPress }) => {
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`;
    const categoryInfo = categoryConfig[item.category] || categoryConfig['Otros'];

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onDetailsPress(item)}
            activeOpacity={0.9}
        >
            {/* Imagem do Item com Overlay */}
            <View style={styles.cardImageContainer}>
                {item.photo_url ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: categoryInfo.color + '20' }]}>
                        <Text style={styles.placeholderIcon}>{categoryInfo.icon}</Text>
                    </View>
                )}

                {/* Gradiente Overlay na parte inferior da imagem */}
                <View style={styles.imageOverlay} />

                {/* Badge de Disponibilidade */}
                {item.is_available ? (
                    <View style={styles.availableBadge}>
                        <View style={styles.availableDot} />
                        <Text style={styles.availableBadgeText}>Disponible</Text>
                    </View>
                ) : (
                    <View style={styles.unavailableBadge}>
                        <View style={styles.unavailableDot} />
                        <Text style={styles.unavailableBadgeText}>Alquilado</Text>
                    </View>
                )}

                {/* Ícone de Categoria */}
                <View style={[styles.categoryIconBadge, { backgroundColor: categoryInfo.color }]}>
                    <Text style={styles.categoryIconText}>{categoryInfo.icon}</Text>
                </View>
            </View>

            {/* Conteúdo do Card */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                {/* Localização */}
                <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                </View>

                {/* Preço em destaque */}
                <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceSymbol}>€</Text>
                        <Text style={styles.cardPrice}>{parseFloat(item.price_per_day).toFixed(2)}</Text>
                        <Text style={styles.priceLabel}>/dia</Text>
                    </View>

                    {/* Botão de ação */}
                    <View style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Ver +</Text>
                    </View>
                </View>
            </View>

            {/* Indicador visual de card interativo */}
            <View style={styles.cardShine} />
        </TouchableOpacity>
    );
};

export default function MainMarketplace({ session, navigation, route }) {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [sortBy, setSortBy] = useState('recent');
    const [showCategories, setShowCategories] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [itemsToShow, setItemsToShow] = useState(6); // Mostrar apenas 6 itens inicialmente

    const categories = [
        'Todos',
        'Electrónicos',
        'Deportes',
        'Vehículos',
        'Muebles',
        'Herramientas',
        'Fiestas',
        'Jardín',
        'Otros'
    ];

    const sortOptions = [
        { id: 'recent', label: 'Más Recientes', icon: '🕐' },
        { id: 'price_low', label: 'Menor Precio', icon: '💰' },
        { id: 'price_high', label: 'Mayor Precio', icon: '💎' },
        { id: 'title', label: 'A-Z', icon: '🔤' },
    ];

    async function fetchItems() {
        setLoading(true);

        const { data, error } = await supabase
            .from('items')
            .select('*')
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

        // Filtro por categoria
        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filtro por busca
        if (searchQuery.trim()) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase())
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
                case 'recent':
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        setFilteredItems(sorted);
    }, [searchQuery, selectedCategory, items, sortBy]);

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
        if (item.owner_id === session.user.id) {
            navigation.navigate('EditItem', { item: item });
        } else {
            navigation.navigate('ItemDetails', { item: item });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Cargando artículos...</Text>
                    <Text style={styles.loadingSubtext}>Preparando el marketplace para ti</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.fullContainer}>
            {/* Header com Título e Botão Voltar */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    {/* Botão Voltar em Círculo */}
                    <TouchableOpacity
                        style={styles.backButtonCircle}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>

                    {/* Título Marketplace */}
                    <Text style={styles.headerTitle}>Marketplace</Text>
                </View>

                {/* Barra de Pesquisa */}
                <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por título, descripción o ubicación..."
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

            {/* Filtros Compactos */}
            <View style={styles.compactFiltersRow}>
                {/* Categorias - Expansível */}
                <View style={styles.filterSection}>
                    <TouchableOpacity
                        style={styles.filterHeader}
                        onPress={() => setShowCategories(!showCategories)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.filterHeaderText}>
                            📂 {selectedCategory === 'Todos' ? 'Categorías' : selectedCategory}
                        </Text>
                        <Text style={styles.filterHeaderArrow}>{showCategories ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {showCategories && (
                        <View style={styles.filterContent}>
                            {categories.map((category) => {
                                const isActive = selectedCategory === category;
                                const config = category !== 'Todos' ? (categoryConfig[category] || categoryConfig['Otros']) : null;

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
                                        {category !== 'Todos' && config && (
                                            <Text style={styles.filterOptionIcon}>{config.icon}</Text>
                                        )}
                                        <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>
                                            {category}
                                        </Text>
                                        {isActive && <Text style={styles.filterOptionCheck}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Ordenação - Expansível */}
                <View style={styles.filterSection}>
                    <TouchableOpacity
                        style={styles.filterHeader}
                        onPress={() => setShowSort(!showSort)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.filterHeaderText}>
                            🔄 {sortOptions.find(o => o.id === sortBy)?.label || 'Ordenar'}
                        </Text>
                        <Text style={styles.filterHeaderArrow}>{showSort ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {showSort && (
                        <View style={styles.filterContent}>
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
                                        <Text style={styles.filterOptionIcon}>{option.icon}</Text>
                                        <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>
                                            {option.label}
                                        </Text>
                                        {isActive && <Text style={styles.filterOptionCheck}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>

            {/* Lista de Itens em Grid melhorado */}
            <FlatList
                data={filteredItems.slice(0, itemsToShow)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ItemCard item={item} onDetailsPress={navigateToDetails} />
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

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    loadingSubtext: {
        marginTop: 5,
        fontSize: 14,
        color: '#999',
    },
    headerContainer: {
        backgroundColor: '#fff',
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButtonCircle: {
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        marginTop: 10,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
    },
    clearButton: {
        padding: 5,
    },
    clearIcon: {
        fontSize: 18,
        color: '#999',
    },
    compactFiltersRow: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        marginBottom: 10,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    filterSection: {
        flex: 1,
        position: 'relative',
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    filterHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    filterHeaderArrow: {
        fontSize: 14,
        color: '#007bff',
        marginLeft: 5,
    },
    filterContent: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        paddingVertical: 10,
        paddingHorizontal: 10,
        maxHeight: 250,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#F8F9FA',
        marginBottom: 8,
    },
    filterOptionActive: {
        backgroundColor: '#007bff',
    },
    filterOptionIcon: {
        fontSize: 16,
        marginRight: 8,
        color: '#007bff',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    filterOptionTextActive: {
        color: '#fff',
    },
    filterOptionCheck: {
        fontSize: 16,
        color: '#fff',
    },
    list: {
        padding: 10,
        paddingBottom: 80,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 5,
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    cardImageContainer: {
        position: 'relative',
        width: '100%',
        height: 160,
        backgroundColor: '#f0f0f0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 50,
        opacity: 0.6,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'transparent',
    },
    availableBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(40, 167, 69, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    availableDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
        marginRight: 5,
    },
    availableBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    unavailableBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    unavailableDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
        marginRight: 5,
    },
    unavailableBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    categoryIconBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    categoryIconText: {
        fontSize: 20,
    },
    cardContent: {
        padding: 14,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1a3a52',
        marginBottom: 8,
        height: 40,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    cardLocation: {
        fontSize: 12,
        color: '#666',
        flex: 1,
        fontWeight: '500',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
        marginTop: 5,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flex: 1,
    },
    priceSymbol: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28a745',
        marginRight: 2,
    },
    cardPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#28a745',
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
        marginLeft: 3,
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    emptyContainer: {
        flex: 1,
        width: '100%',
        minHeight: 400,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    emptyContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        width: '100%',
        maxWidth: 400,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    clearFiltersButton: {
        marginTop: 20,
        backgroundColor: '#007bff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    clearFiltersButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        elevation: 8,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    addButtonInner: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
    },
    loadMoreButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        elevation: 2,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    loadMoreText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
