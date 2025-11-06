import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, Alert, Platform, StatusBar } from 'react-native';

export default function HomeScreen({ navigation, session }) {
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { id: '1', name: 'Eletrnicos', icon: '🎮', color: '#FF6B6B' },
        { id: '2', name: 'Esportes', icon: '🏀', color: '#FF9F43' },
        { id: '3', name: 'Veculos', icon: '🚗', color: '#48DBFB' },
        { id: '4', name: 'Mveis', icon: '🛋️', color: '#FFC312' },
        { id: '5', name: 'Ferramentas', icon: '🔧', color: '#A29BFE' },
        { id: '6', name: 'Festas', icon: '🎉', color: '#FF6348' },
        { id: '7', name: 'Jardim', icon: '🌱', color: '#26DE81' },
        { id: '8', name: 'Outros', icon: '📦', color: '#95A5A6' },
    ];

    const handleCategoryPress = (category) => {
        navigation.navigate('Home', { category: category.name });
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Home', { search: searchQuery });
        }
    };

    const handleLogout = async () => {
        setMenuVisible(false);
        // Implementar logout do Supabase
        Alert.alert('Logout', 'Função de logout será implementada');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* Header com Menu Hamburger */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <View style={styles.hamburger}>
                        <View style={styles.hamburgerLine} />
                        <View style={styles.hamburgerLine} />
                        <View style={styles.hamburgerLine} />
                    </View>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Rentalfy</Text>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileIcon}>👤</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Por que comprar</Text>
                        <Text style={styles.heroTitle}>Se voce pode alugar</Text>
                        <Text style={styles.heroSubtitle}>Possua menos, Acesse Mais.</Text>
                        <Text style={styles.heroSubtitle}>Obtenha o que voce Precisa</Text>
                        <Text style={styles.heroSubtitle}>Sem Quebrar o Banco</Text>

                        <View style={styles.heroBottomRow}>
                            <TouchableOpacity
                                style={styles.discoverButton}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.discoverButtonText}>Descobrir Agora</Text>
                            </TouchableOpacity>

                            <View style={styles.heroImageContainer}>
                                <Text style={styles.heroImage}>🚚</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                    >
                        <Text style={styles.searchIcon}>🔍</Text>
                    </TouchableOpacity>
                </View>

                {/* Categories Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Explore Nossas Categorias</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                            <Text style={styles.viewAllLink}>Ver Todas</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesGrid}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[styles.categoryCard, { backgroundColor: category.color }]}
                                onPress={() => handleCategoryPress(category)}
                            >
                                <Text style={styles.categoryIcon}>{category.icon}</Text>
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Listings Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Anncios de Indivduos</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                            <Text style={styles.viewAllLink}>Ver Mais</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.browseButtonText}>📋 Navegar pelos Anncios</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => navigation.navigate('AddItem')}
                    >
                        <Text style={styles.quickActionIcon}>➕</Text>
                        <Text style={styles.quickActionText}>Anunciar Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.quickActionIcon}>📦</Text>
                        <Text style={styles.quickActionText}>Meus Itens</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Menu Lateral */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuDrawer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setMenuVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Rentalfy</Text>
                            <Text style={styles.menuSubtitle}>Bem-vindo!</Text>
                        </View>

                        <View style={styles.menuItems}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('HomeScreen');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>🏠</Text>
                                <Text style={styles.menuItemText}>Incio</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('Home');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>🛍️</Text>
                                <Text style={styles.menuItemText}>Marketplace</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('AddItem');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>➕</Text>
                                <Text style={styles.menuItemText}>Anunciar Item</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('Profile');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>👤</Text>
                                <Text style={styles.menuItemText}>Meu Perfil</Text>
                            </TouchableOpacity>
e
                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleLogout}
                            >
                                <Text style={styles.menuItemIcon}>🚪</Text>
                                <Text style={styles.menuItemText}>Sair</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 35,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    menuButton: {
        padding: 5,
    },
    hamburger: {
        width: 30,
        height: 24,
        justifyContent: 'space-between',
    },
    hamburgerLine: {
        width: '100%',
        height: 3,
        backgroundColor: '#333',
        borderRadius: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007bff',
    },
    profileButton: {
        padding: 5,
    },
    profileIcon: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    heroSection: {
        backgroundColor: '#FFF8E1',
        padding: 30,
        paddingBottom: 5,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    heroContent: {
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a3a52',
        lineHeight: 34,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
    },
    heroBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
    },
    discoverButton: {
        marginTop: 10,
        backgroundColor: '#FF6B35',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        alignSelf: 'flex-start',
    },
    discoverButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    heroImageContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: -40,
    },
    heroImage: {
        fontSize: 90,
    },
    searchContainer: {
        flexDirection: 'row',
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    searchButton: {
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    searchIcon: {
        fontSize: 20,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a3a52',
    },
    viewAllLink: {
        fontSize: 14,
        color: '#FF6B35',
        fontWeight: '600',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '23%',
        aspectRatio: 1,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 5,
    },
    categoryName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    browseButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 30,
        gap: 15,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    quickActionIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menuDrawer: {
        width: '75%',
        height: '100%',
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666',
    },
    menuHeader: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 5,
    },
    menuSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    menuItems: {
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    menuItemIcon: {
        fontSize: 24,
        marginRight: 15,
        width: 30,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 10,
        marginHorizontal: 20,
    },
});
