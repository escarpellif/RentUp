import React, {useState, useEffect} from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    Platform,
    Image,
    StatusBar,
    ImageBackground,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import {supabase} from '../../supabase';
import {useAdminNotifications} from '../hooks/useAdminNotifications';
import {useUserNotifications} from '../hooks/useUserNotifications';
import {useUnreadMessagesCount} from '../hooks/useUnreadMessagesCount';
import {usePendingRentalsCount} from '../hooks/usePendingRentalsCount';
import {useTranslation} from 'react-i18next';
import RecentItemsCarousel from '../components/RecentItemsCarousel';
import BenefitsSection from '../components/BenefitsSection';
import TestimonialsSection from '../components/TestimonialsSection';
import UnifiedRentalModal from '../components/UnifiedRentalModal';
import ReviewModal from '../components/ReviewModal';

export default function HomeScreen({navigation, session, isGuest}) {
    const {t} = useTranslation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);

    // Hook de notificações (admin badge)
    const {unreadCount} = useAdminNotifications();
    // Hook de notificações para o usuário atual
    const {unreadCount: userUnread, refresh: refreshUserNotifications} = useUserNotifications(session?.user?.id);
    // Hook de mensagens não lidas
    // Hook de solicitações de locação pendentes
    const {pendingCount: pendingRentals} = usePendingRentalsCount(session?.user?.id);
    const {unreadCount: unreadMessages} = useUnreadMessagesCount(session?.user?.id);

    // Buscar se o usuário é admin
    useEffect(() => {
        // Não buscar se for visitante
        if (isGuest) {
            setIsAdmin(false);
            return;
        }

        async function checkAdmin() {
            const {data, error} = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();

            if (!error && data) {
                setIsAdmin(data.is_admin || false);
            }
        }

        checkAdmin();
    }, [session, isGuest]);

    // Pré-carregar imagens do carrossel para carregamento instantâneo
    useEffect(() => {
        async function preloadImages() {
            try {
                await Asset.loadAsync([
                    require('../../assets/images/img-1.png'),
                    require('../../assets/images/background-homepage2.png')
                ]);
            } catch (error) {
                console.log('Erro ao pré-carregar imagens:', error);
            }
        }
        preloadImages();
    }, []);

    // Adicionar listener para atualizar quando a tela voltar ao foco
    useEffect(() => {
        return navigation.addListener('focus', () => {
            setRefreshKey(prev => prev + 1);
            // Recarregar notificações quando voltar à tela
            if (refreshUserNotifications) {
                refreshUserNotifications();
            }
        });
    }, [navigation, refreshUserNotifications]);

    const categories = [
        {id: '1', name: t('items.electronics'), icon: 'camera-outline', color: '#16a085', bgColor: '#e8f8f5'},
        {id: '2', name: t('items.sports'), icon: 'basketball-outline', color: '#e74c3c', bgColor: '#fadbd8'},
        {id: '3', name: t('items.vehicles'), icon: 'car-outline', color: '#3498db', bgColor: '#d6eaf8'},
        {id: '4', name: t('items.furniture'), icon: 'bed-outline', color: '#9b59b6', bgColor: '#ebdef0'},
        {id: '5', name: t('items.tools'), icon: 'construct-outline', color: '#f39c12', bgColor: '#fdebd0'},
        {id: '6', name: t('items.parties'), icon: 'gift-outline', color: '#e91e63', bgColor: '#fce4ec'},
        {id: '7', name: t('items.garden'), icon: 'leaf-outline', color: '#27ae60', bgColor: '#d5f4e6'},
        {id: '8', name: t('items.clothing'), icon: 'shirt-outline', color: '#34495e', bgColor: '#d5d8dc'},
        {id: '9', name: t('items.others'), icon: 'cube-outline', color: '#95a5a6', bgColor: '#ecf0f1'},
    ];

    const handleCategoryPress = (category) => {
        navigation.navigate('Home', {category: category.name});
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Home', {search: searchQuery});
        }
    };

    const handleLogout = async () => {
        setMenuVisible(false);

        Alert.alert(
            t('auth.logout'),
            '¿Estás seguro de que deseas salir?',
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                },
                {
                    text: t('auth.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        const {error} = await supabase.auth.signOut();
                        if (error) {
                            Alert.alert(t('common.error'), 'No se pudo cerrar sesión: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            
            {/* Modal Unificado de Locações (mostra todas: como locatário E como locador) */}
            {!isGuest && session && <UnifiedRentalModal session={session} navigation={navigation} />}
            {/* Modal de Review (aparece após conclusão de locação) */}
            {!isGuest && session && <ReviewModal session={session} />}


            <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
            {/* Header com Menu Hamburger */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <View style={styles.hamburger}>
                        <View style={styles.hamburgerLine}/>
                        <View style={styles.hamburgerLine}/>
                        <View style={styles.hamburgerLine}/>
                    </View>
                    {(unreadCount + unreadMessages + pendingRentals) > 0 && (
                        <View style={styles.notificationDot}>
                            <Text style={styles.notificationDotText}>
                                {unreadCount + unreadMessages + pendingRentals}
                            </Text>
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
                    <Ionicons name="person-circle-outline" size={28} color="#2c4455" />
                    {userUnread > 0 && (
                        <View style={styles.userNotificationDot}>
                            <Text style={styles.userNotificationDotText}>{userUnread}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section - Carrousel */}
                <View style={styles.heroCarouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event) => {
                            const scrollPosition = event.nativeEvent.contentOffset.x;
                            const screenWidth = Dimensions.get('window').width;
                            const index = Math.round(scrollPosition / screenWidth);
                            setHeroIndex(index);
                        }}
                        scrollEventThrottle={16}
                        style={styles.heroScrollView}
                    >
                        {/* Slide 1 */}
                        <ImageBackground
                            source={require('../../assets/images/img-1.png')}
                            style={styles.heroSectionBackground}
                            resizeMode="cover"
                        >

                            <View style={styles.heroSection}>
                                <View style={styles.heroCard}>
                                    <Text style={styles.heroTitle}>{t('home.heroTitle1')}</Text>
                                    <Text style={styles.heroTitle}>{t('home.heroTitle2')}</Text>

                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle1')}</Text>
                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle2')}</Text>
                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle3')}</Text>

                                    {/* Spacer para manter posição dos botões */}
                                    <View style={styles.heroSpacer} />

                                    <Text style={styles.heroTitle}>{t('home.heroTitle3')}</Text>
                                    <Text style={styles.heroTitle}>{t('home.heroTitle4')}</Text>

                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle4')}</Text>
                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle5')}</Text>

                                    <View style={styles.heroButtonsContainer}>
                                        <TouchableOpacity
                                            style={[styles.heroButton, styles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('Home')}
                                        >
                                            <Text style={styles.heroButtonText}>{t('home.explore')}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.heroButton, styles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('AddItem')}
                                        >
                                            <Text style={styles.heroButtonText}>{t('home.post')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Indicadores de slides */}
                                    <View style={styles.carouselIndicators}>
                                        <View style={[styles.carouselDot, heroIndex === 0 && styles.carouselDotActive]} />
                                        <View style={[styles.carouselDot, heroIndex === 1 && styles.carouselDotActive]} />
                                    </View>
                                </View>
                                <View style={styles.searchContainer}>
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('home.search')}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onSubmitEditing={handleSearch}
                                    />
                                    <TouchableOpacity
                                        style={styles.searchButton}
                                        onPress={handleSearch}
                                    >
                                        <Ionicons name="search" size={20} color="#10B981" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ImageBackground>

                        {/* Slide 2 */}
                        <ImageBackground
                            source={require('../../assets/images/background-homepage2.png')}
                            style={styles.heroSectionBackground}
                            resizeMode="cover"
                        >
                            <View style={styles.heroSection}>
                                <View style={styles.heroCard}>
                                    <Text style={styles.heroTitle}>{t('home.heroTitle1')}</Text>
                                    <Text style={styles.heroTitle}>{t('home.heroTitle2')}</Text>

                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle1')}</Text>
                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle2')}</Text>
                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle3')}</Text>

                                    {/* Spacer para manter posição dos botões */}
                                    <View style={styles.heroSpacer} />

                                    <Text style={styles.heroTitle}>{t('home.heroTitle3')}</Text>
                                    <Text style={styles.heroTitle}>{t('home.heroTitle4')}</Text>

                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle4')}</Text>
                                    <Text style={styles.heroSubtitle}>{t('home.heroSubtitle5')}</Text>

                                    <View style={styles.heroButtonsContainer}>
                                        <TouchableOpacity
                                            style={[styles.heroButton, styles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('Home')}
                                        >
                                            <Text style={styles.heroButtonText}>{t('home.explore')}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.heroButton, styles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('AddItem')}
                                        >
                                            <Text style={styles.heroButtonText}>{t('home.post')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Indicadores de slides */}
                                    <View style={styles.carouselIndicators}>
                                        <View style={[styles.carouselDot, heroIndex === 0 && styles.carouselDotActive]} />
                                        <View style={[styles.carouselDot, heroIndex === 1 && styles.carouselDotActive]} />
                                    </View>
                                </View>
                                <View style={styles.searchContainer}>
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('home.search')}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onSubmitEditing={handleSearch}
                                    />
                                    <TouchableOpacity
                                        style={styles.searchButton}
                                        onPress={handleSearch}
                                    >
                                        <Ionicons name="search" size={20} color="#10B981" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ImageBackground>
                    </ScrollView>
                </View>

                {/* Search Bar */}
                {/*<View style={styles.searchContainer}>*/}
                {/*    <TextInput*/}
                {/*        style={styles.searchInput}*/}
                {/*        placeholder={t('home.search')}*/}
                {/*        value={searchQuery}*/}
                {/*        onChangeText={setSearchQuery}*/}
                {/*        onSubmitEditing={handleSearch}*/}
                {/*    />*/}
                {/*    <TouchableOpacity*/}
                {/*        style={styles.searchButton}*/}
                {/*        onPress={handleSearch}*/}
                {/*    >*/}
                {/*        <Text style={styles.searchIcon}>🔍</Text>*/}
                {/*    </TouchableOpacity>*/}
                {/*</View>*/}

                {/* Categories Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.viewAllButtonText}>{t('home.seeAll')}</Text>
                            <Text style={styles.viewAllButtonIcon}>→</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesContainer}>
                        <View style={styles.categoriesGrid}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[styles.categoryCard, {backgroundColor: category.bgColor}]}
                                    onPress={() => handleCategoryPress(category)}
                                >
                                    <View style={[styles.categoryIconContainer, {backgroundColor: category.color}]}>
                                        <Ionicons name={category.icon} size={32} color="#fff" />
                                    </View>
                                    <Text style={styles.categoryName}>{category.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Recent Items Carousel */}
                <RecentItemsCarousel key={refreshKey} navigation={navigation} session={session}/>

                {/* Benefits Section */}
                <BenefitsSection/>

                {/* Testimonials Section */}
                <TestimonialsSection/>
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
                            <Text style={styles.menuTitle}>{t('menu.title')}</Text>
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
                                <Text style={styles.menuItemText}>{t('menu.back')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('Home');
                                }}
                            >
                                <Text style={styles.menuItemIcon}>🛍️</Text>
                                <Text style={styles.menuItemText}>{t('menu.marketplace')}</Text>
                            </TouchableOpacity>

                            {/* Protected Menu Items - Hidden for Guests */}
                            {!isGuest && (
                                <>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('MyAds');
                                        }}
                                    >
                                        <Text style={styles.menuItemIcon}>📦</Text>
                                        <Text style={styles.menuItemText}>{t('menu.myAds')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('ChatsList');
                                        }}
                                    >
                                        <Text style={styles.menuItemIcon}>💬</Text>
                                        <Text style={styles.menuItemText}>Chats</Text>
                                        {unreadMessages > 0 && (
                                            <View style={styles.menuBadge}>
                                                <Text style={styles.menuBadgeText}>{unreadMessages}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('MyRentals');
                                        }}
                                    >
                                        <Text style={styles.menuItemIcon}>🔑</Text>
                                        <Text style={styles.menuItemText}>Mis Locaciones</Text>
                                        {pendingRentals > 0 && (
                                            <View style={styles.menuBadge}>
                                                <Text style={styles.menuBadgeText}>{pendingRentals}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}


                            {/* Admin - Apenas para usuários admin */}
                            {isAdmin && (
                                <>
                                    <View style={styles.menuDivider}/>

                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('AdminVerifications');
                                        }}
                                    >
                                        <Text style={styles.menuItemIcon}>🔐</Text>
                                        <Text style={styles.menuItemText}>{t('menu.admin')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <View style={styles.menuDivider}/>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleLogout}
                            >
                                <Text style={styles.menuItemIcon}>🚪</Text>
                                <Text style={styles.menuItemText}>{t('menu.logout')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        paddingTop: Platform.OS === 'android' ? (25 || 0) + 20 : 35,
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
        shadowOffset: {width: 0, height: 2},
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
    titleTextContainer: {
        flexDirection: 'column',
        alignItems: 'center',
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
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10B981',
        textAlign: 'center',
        lineHeight: 14,
        marginTop: 2,
    },
    profileButton: {
        padding: 5,
    },
    content: {
        flex: 1,
    },
    heroCarouselContainer: {
        width: '380',
        height: 630,
        overflow: 'hidden',
    },
    heroScrollView: {
        width: '380',
        height: 700,
    },
    heroSection: {
        padding: 20,
        flex: 1,
    },
    heroSectionBackground: {
        width: '380',
        height: 580,
    },
    heroCard: {

        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
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
    heroSpacer: {
        height: 150,
        marginVertical: -10,
    },
    heroButtonsContainer: {
        flexDirection: 'row',
        marginTop: 50,
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
    carouselIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 10,
    },
    carouselDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ccc',
    },
    carouselDotActive: {
        backgroundColor: '#10B981',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    searchContainer: {
        flexDirection: 'row',
        margin: -3,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        // borderWidth: 2,
        borderColor: '#10B981',

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
        paddingTop: 25,
        paddingHorizontal: 15,
        paddingBottom: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
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
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 5,
    },
    categoryName: {
        fontSize: 10,
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
        shadowOffset: {width: 0, height: 1},
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
        shadowOffset: {width: 2, height: 0},
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
    menuBadge: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#10B981',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    menuBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 10,
        marginHorizontal: 20,
    },
    userNotificationDot: {
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
    userNotificationDotText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
