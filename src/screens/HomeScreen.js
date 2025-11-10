import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, Image } from 'react-native';
import { supabase } from '../../supabase';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import RecentItemsCarousel from '../components/RecentItemsCarousel';
import BenefitsSection from '../components/BenefitsSection';
import TestimonialsSection from '../components/TestimonialsSection';

export default function HomeScreen({ navigation, session }) {
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    // Hook de notificações
    const { unreadCount } = useAdminNotifications();

    // Adicionar listener para atualizar quando a tela voltar ao foco
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshKey(prev => prev + 1);
        });

        return unsubscribe;
    }, [navigation]);

    const categories = [
        { id: '1', name: 'Electrónicos', icon: '🎮', color: '#fff' },
        { id: '2', name: 'Deportes', icon: '🏀', color: '#fff' },
        { id: '3', name: 'Accesorios de Vehículos', icon: '🔧', color: '#fff' },
        { id: '4', name: 'Muebles', icon: '🛋️', color: '#fff' },
        { id: '5', name: 'Herramientas', icon: '🔨', color: '#fff' },
        { id: '6', name: 'Fiestas', icon: '🎉', color: '#fff' },
        { id: '7', name: 'Jardín', icon: '🌱', color: '#fff' },
        { id: '8', name: 'Ropa', icon: '👕', color: '#fff' },
        { id: '9', name: 'Otros', icon: '📦', color: '#fff' },
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

        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas salir?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                            Alert.alert('Error', 'No se pudo cerrar sesión: ' + error.message);
                        }
                        // O App.js detectará a mudança de sessão e voltará para AuthScreen
                    }
                }
            ]
        );
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
                    {unreadCount > 0 && (
                        <View style={styles.notificationDot}>
                            <Text style={styles.notificationDotText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Image
                        source={require('../../assets/images/app-icon.png')}
                        style={styles.headerIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>RentUp</Text>
                </View>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileIcon}>👤</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section - Single Card */}
                <View style={styles.heroSection}>
                    <View style={styles.heroCard}>
                        <Text style={styles.heroTitle}>¿Por qué comprar</Text>
                        <Text style={styles.heroTitle}>si puedes alquilar?</Text>

                        <Text style={styles.heroSubtitle}>Posee menos, accede a más.</Text>
                        <Text style={styles.heroSubtitle}>Obtén lo que necesitas, cuando</Text>
                        <Text style={styles.heroSubtitle}>lo necesitas, sin gastar de más.</Text>

                        <Image
                            source={require('../../assets/images/img-circular-no-back.png')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />

                        <Text style={styles.heroTitle}>¿Por qué dejar parado</Text>
                        <Text style={styles.heroTitle}>si puedes ganar dinero?</Text>

                        <Text style={styles.heroSubtitle}>Tus artículos sin uso pueden generar</Text>
                        <Text style={styles.heroSubtitle}>ingresos extra.</Text>

                        <View style={styles.heroButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.heroButton, styles.heroButtonAnunciar]}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.heroButtonText}>Explorar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.heroButton, styles.heroButtonAnunciar]}
                                onPress={() => navigation.navigate('AddItem')}
                            >
                                <Text style={styles.heroButtonText}>Anunciar</Text>
                            </TouchableOpacity>
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
                        <Text style={styles.sectionTitle}>Categorías</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.viewAllButtonText}>Ver Todas</Text>
                            <Text style={styles.viewAllButtonIcon}>→</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesContainer}>
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
                </View>

                {/* Recent Items Carousel */}
                <RecentItemsCarousel key={refreshKey} navigation={navigation} />

                {/* Benefits Section */}
                <BenefitsSection />

                {/* Testimonials Section */}
                <TestimonialsSection />
            </ScrollView>

            {/* Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Menú</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setMenuVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.menuItems}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('HomeScreen');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>←</Text>
                                <Text style={styles.menuItemText}>Volver</Text>
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
                                <Text style={styles.menuItemText}>Anunciar Artículo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('Profile');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>👤</Text>
                                <Text style={styles.menuItemText}>Mi Perfil</Text>
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('AdminVerifications');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>🔐</Text>
                                <Text style={styles.menuItemText}>Admin - Verificaciones</Text>
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleLogout}
                            >
                                <Text style={styles.menuItemIcon}>🚪</Text>
                                <Text style={styles.menuItemText}>Salir</Text>
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
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    notificationDotText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
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
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIcon: {
        width: 28,
        height: 28,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c4455',
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
        padding: 20,
        backgroundColor: '#fff',
    },
    heroCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a3a52',
        textAlign: 'center',
        lineHeight: 28,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 20,
    },
    heroImage: {
        width: 150,
        height: 150,
        marginVertical: 20,
    },
    heroButtonsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    heroButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    heroButtonExplorar: {
        backgroundColor: '#FF6347',
    },
    heroButtonAnunciar: {
        backgroundColor: '#10B981',
    },
    heroButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
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
        color: '#2c4455',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 4,
    },
    viewAllButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    viewAllButtonIcon: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },
    categoriesContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingTop: 35,
        paddingHorizontal: 16,
        paddingBottom: 0,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 5,
    },
    categoryName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2c4455',
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
        justifyContent: 'flex-start',
    },
    menuContainer: {
        width: '75%',
        height: '100%',
        backgroundColor: '#fff',
        paddingTop: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    menuDrawer: {
        width: '75%',
        height: '100%',
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666',
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
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
