import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import ItemCard from '../components/ItemCard';
import { categoryConfig, categories, sortOptions } from '../constants/categoryConfig';
import { mainMarketplaceStyles as styles } from '../styles/mainMarketplaceStyles';

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
                item?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.location?.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <ActivityIndicator size="large" color="#2c4455" />
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
                            <ScrollView
                                style={styles.filterScrollView}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
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
                            </ScrollView>
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
                                            <Text style={styles.filterOptionIcon}>{option.icon}</Text>
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

