import React, {useState, useEffect} from 'react';
import {
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
import { handleApiError } from '../utils/errorHandler';
import { fetchWithRetry, withTimeout } from '../utils/apiHelpers';
import RecentItemsCarousel from '../components/RecentItemsCarousel';
import BenefitsSection from '../components/BenefitsSection';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';
import UnifiedRentalModal from '../components/UnifiedRentalModal';
import ReviewModal from '../components/ReviewModal';
import { homeStyles } from '../styles/screens/homeStyles';

export default function HomeScreen({navigation, session, isGuest}) {
    const {t} = useTranslation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const [showRentalModal, setShowRentalModal] = useState(false); // Iniciar como false
    const [modalTriggerKey, setModalTriggerKey] = useState(0); // Para forçar re-render do modal

    // Hook de notificações (admin badge)
    const {unreadCount} = useAdminNotifications();
    // Hook de notificações para o usuário atual
    const {unreadCount: userUnread, refresh: refreshUserNotifications} = useUserNotifications(session?.user?.id);
    // Hook de mensagens não lidas
    // Hook de solicitações de locação pendentes
    const {pendingCount: pendingRentals, refresh: refreshPendingRentals} = usePendingRentalsCount(session?.user?.id);
    const {unreadCount: unreadMessages} = useUnreadMessagesCount(session?.user?.id);

    // Buscar se o usuário é admin
    useEffect(() => {
        // Não buscar se for visitante
        if (isGuest) {
            setIsAdmin(false);
            return;
        }

        async function checkAdmin() {
            try {
                const result = await fetchWithRetry(async () => {
                    const query = supabase
                        .from('profiles')
                        .select('is_admin')
                        .eq('id', session.user.id)
                        .single();

                    return await withTimeout(query, 10000);
                });

                if (result.data) {
                    setIsAdmin(result.data.is_admin || false);
                }
            } catch (error) {
                console.error('Erro ao verificar admin:', error);
                // Não mostrar alert para não interromper a experiência
                setIsAdmin(false);
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
            // Recarregar pending rentals
            if (refreshPendingRentals) {
                refreshPendingRentals();
            }
        });
    }, [navigation, refreshUserNotifications, refreshPendingRentals]);

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
        <View style={homeStyles.container}>
            
            {/* Modal Unificado de Locações (mostra todas: como locatário E como locador) */}
            {!isGuest && session && (
                <UnifiedRentalModal
                    key={`rental-${modalTriggerKey}`}
                    session={session}
                    navigation={navigation}
                    showOnMount={showRentalModal}
                />
            )}
            {/* Modal de Review (aparece após conclusão de locação) */}
            {!isGuest && session && <ReviewModal session={session} />}


            <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
            {/* Header com Menu Hamburger */}
            <View style={homeStyles.header}>
                <TouchableOpacity
                    style={homeStyles.menuButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <View style={homeStyles.hamburger}>
                        <View style={homeStyles.hamburgerLine}/>
                        <View style={homeStyles.hamburgerLine}/>
                        <View style={homeStyles.hamburgerLine}/>
                    </View>
                    {(unreadCount + unreadMessages + pendingRentals) > 0 && (
                        <View style={homeStyles.notificationDot}>
                            <Text style={homeStyles.notificationDotText}>
                                {unreadCount + unreadMessages + pendingRentals}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={homeStyles.headerTitleContainer}>
                    <Image
                        source={require('../../assets/images/app-icon.png')}
                        style={homeStyles.headerIcon}
                        resizeMode="contain"
                    />
                    <Text style={homeStyles.headerTitle}>ALUKO</Text>
                </View>

                <TouchableOpacity
                    style={homeStyles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Ionicons name="person-circle-outline" size={28} color="#2c4455" />
                    {userUnread > 0 && (
                        <View style={homeStyles.userNotificationDot}>
                            <Text style={homeStyles.userNotificationDotText}>{userUnread}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={homeStyles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section - Carrousel */}
                <View style={homeStyles.heroCarouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event) => {
                            try {
                                const scrollPosition = event.nativeEvent.contentOffset.x;
                                const screenWidth = Dimensions.get('window').width;
                                const index = Math.round(scrollPosition / screenWidth);
                                setHeroIndex(index);
                            } catch (error) {
                                console.log('Erro ao calcular scroll:', error);
                            }
                        }}
                        scrollEventThrottle={16}
                        style={homeStyles.heroScrollView}
                    >
                        {/* Slide 1 */}
                        <ImageBackground
                            source={require('../../assets/images/img-1.png')}
                            style={homeStyles.heroSectionBackground}
                            resizeMode="cover"
                        >

                            <View style={homeStyles.heroSection}>
                                <View style={homeStyles.heroCard}>
                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle1')}</Text>
                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle2')}</Text>

                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle1')}</Text>
                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle2')}</Text>
                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle3')}</Text>

                                    {/* Spacer para manter posição dos botões */}
                                    <View style={homeStyles.heroSpacer} />

                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle3')}</Text>
                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle4')}</Text>

                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle4')}</Text>
                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle5')}</Text>

                                    <View style={homeStyles.heroButtonsContainer}>
                                        <TouchableOpacity
                                            style={[homeStyles.heroButton, homeStyles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('Home')}
                                        >
                                            <Text style={homeStyles.heroButtonText}>{t('home.explore')}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[homeStyles.heroButton, homeStyles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('AddItem')}
                                        >
                                            <Text style={homeStyles.heroButtonText}>{t('home.post')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Indicadores de slides */}
                                    <View style={homeStyles.carouselIndicators}>
                                        <View style={[homeStyles.carouselDot, heroIndex === 0 && homeStyles.carouselDotActive]} />
                                        <View style={[homeStyles.carouselDot, heroIndex === 1 && homeStyles.carouselDotActive]} />
                                    </View>
                                </View>
                                <View style={homeStyles.searchContainer}>
                                    <TextInput
                                        style={homeStyles.searchInput}
                                        placeholder={t('home.search')}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onSubmitEditing={handleSearch}
                                    />
                                    <TouchableOpacity
                                        style={homeStyles.searchButton}
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
                            style={homeStyles.heroSectionBackground}
                            resizeMode="cover"
                        >
                            <View style={homeStyles.heroSection}>
                                <View style={homeStyles.heroCard}>
                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle1')}</Text>
                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle2')}</Text>

                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle1')}</Text>
                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle2')}</Text>
                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle3')}</Text>

                                    {/* Spacer para manter posição dos botões */}
                                    <View style={homeStyles.heroSpacer} />

                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle3')}</Text>
                                    <Text style={homeStyles.heroTitle}>{t('home.heroTitle4')}</Text>

                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle4')}</Text>
                                    <Text style={homeStyles.heroSubtitle}>{t('home.heroSubtitle5')}</Text>

                                    <View style={homeStyles.heroButtonsContainer}>
                                        <TouchableOpacity
                                            style={[homeStyles.heroButton, homeStyles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('Home')}
                                        >
                                            <Text style={homeStyles.heroButtonText}>{t('home.explore')}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[homeStyles.heroButton, homeStyles.heroButtonAnunciar]}
                                            onPress={() => navigation.navigate('AddItem')}
                                        >
                                            <Text style={homeStyles.heroButtonText}>{t('home.post')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Indicadores de slides */}
                                    <View style={homeStyles.carouselIndicators}>
                                        <View style={[homeStyles.carouselDot, heroIndex === 0 && homeStyles.carouselDotActive]} />
                                        <View style={[homeStyles.carouselDot, heroIndex === 1 && homeStyles.carouselDotActive]} />
                                    </View>
                                </View>
                                <View style={homeStyles.searchContainer}>
                                    <TextInput
                                        style={homeStyles.searchInput}
                                        placeholder={t('home.search')}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onSubmitEditing={handleSearch}
                                    />
                                    <TouchableOpacity
                                        style={homeStyles.searchButton}
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
                {/*<View style={homeStyles.searchContainer}>*/}
                {/*    <TextInput*/}
                {/*        style={homeStyles.searchInput}*/}
                {/*        placeholder={t('home.search')}*/}
                {/*        value={searchQuery}*/}
                {/*        onChangeText={setSearchQuery}*/}
                {/*        onSubmitEditing={handleSearch}*/}
                {/*    />*/}
                {/*    <TouchableOpacity*/}
                {/*        style={homeStyles.searchButton}*/}
                {/*        onPress={handleSearch}*/}
                {/*    >*/}
                {/*        <Text style={homeStyles.searchIcon}>🔍</Text>*/}
                {/*    </TouchableOpacity>*/}
                {/*</View>*/}

                {/* Categories Section */}
                <View style={homeStyles.section}>
                    <View style={homeStyles.categoriesContainer}>
                        {/* Header dentro do container */}
                        <View style={homeStyles.sectionHeader}>
                            <Text style={homeStyles.sectionTitle}>{t('home.categories')}</Text>
                            <TouchableOpacity
                                style={homeStyles.viewAllButton}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={homeStyles.viewAllButtonText}>{t('home.seeAll')}</Text>
                                <Text style={homeStyles.viewAllButtonIcon}>→</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Grid de categorias */}
                        <View style={homeStyles.categoriesGrid}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[homeStyles.categoryCard, {backgroundColor: category.bgColor}]}
                                    onPress={() => handleCategoryPress(category)}
                                >
                                    <View style={[homeStyles.categoryIconContainer, {backgroundColor: category.color}]}>
                                        <Ionicons name={category.icon} size={32} color="#fff" />
                                    </View>
                                    <Text style={homeStyles.categoryName}>{category.name}</Text>
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

                {/* Footer */}
                <Footer navigation={navigation} />
            </ScrollView>

            {/* Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={homeStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={homeStyles.menuContainer}>
                        <View style={homeStyles.menuHeader}>
                            <Text style={homeStyles.menuTitle}>{t('menu.title')}</Text>
                            <TouchableOpacity
                                style={homeStyles.closeButton}
                                onPress={() => setMenuVisible(false)}
                            >
                                <Text style={homeStyles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={homeStyles.menuItems}>
                            <TouchableOpacity
                                style={homeStyles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('HomeScreen');
                                }}
                            >
                                <Text style={homeStyles.menuItemIcon}>←</Text>
                                <Text style={homeStyles.menuItemText}>{t('menu.back')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={homeStyles.menuItem}
                                onPress={() => {
                                    setMenuVisible(false);
                                    navigation.navigate('Home');
                                }}
                            >
                                <Text style={homeStyles.menuItemIcon}>🛍️</Text>
                                <Text style={homeStyles.menuItemText}>{t('menu.marketplace')}</Text>
                            </TouchableOpacity>

                            {/* Protected Menu Items - Hidden for Guests */}
                            {!isGuest && (
                                <>
                                    <TouchableOpacity
                                        style={homeStyles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('MyAds');
                                        }}
                                    >
                                        <Text style={homeStyles.menuItemIcon}>📦</Text>
                                        <Text style={homeStyles.menuItemText}>{t('menu.myAds')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={homeStyles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('ChatsList');
                                        }}
                                    >
                                        <Text style={homeStyles.menuItemIcon}>💬</Text>
                                        <Text style={homeStyles.menuItemText}>{t('menu.chats')}</Text>
                                        {unreadMessages > 0 && (
                                            <View style={homeStyles.menuBadge}>
                                                <Text style={homeStyles.menuBadgeText}>{unreadMessages}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={homeStyles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('MyRentals');
                                        }}
                                    >
                                        <Text style={homeStyles.menuItemIcon}>🔑</Text>
                                        <Text style={homeStyles.menuItemText}>{t('menu.myTransactions')}</Text>
                                        {pendingRentals > 0 && (
                                            <View style={homeStyles.menuBadge}>
                                                <Text style={homeStyles.menuBadgeText}>{pendingRentals}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}


                            {/* Admin - Apenas para usuários admin */}
                            {isAdmin && (
                                <>
                                    <View style={homeStyles.menuDivider}/>

                                    <TouchableOpacity
                                        style={homeStyles.menuItem}
                                        onPress={() => {
                                            setMenuVisible(false);
                                            navigation.navigate('AdminDashboard');
                                        }}
                                    >
                                        <Text style={homeStyles.menuItemIcon}>📊</Text>
                                        <Text style={homeStyles.menuItemText}>Panel de Admin</Text>
                                        {(unreadCount > 0) && (
                                            <View style={homeStyles.menuBadge}>
                                                <Text style={homeStyles.menuBadgeText}>{unreadCount}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            <View style={homeStyles.menuDivider}/>

                            <TouchableOpacity
                                style={homeStyles.menuItem}
                                onPress={handleLogout}
                            >
                                <Text style={homeStyles.menuItemIcon}>🚪</Text>
                                <Text style={homeStyles.menuItemText}>{t('menu.logout')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Tab Bar Bottom - Estilo Marketplace */}
            {!isGuest && (
                <View style={homeStyles.tabBar}>
                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => {
                            console.log('🔘 Botão Locaciones clicado na HomeScreen');

                            // Garantir que sempre começa em false
                            setShowRentalModal(false);

                            // Usar setTimeout para garantir que a mudança de estado aconteça
                            setTimeout(() => {
                                // Incrementar key para forçar re-render do modal
                                setModalTriggerKey(prev => prev + 1);
                                // Ativar flag
                                setShowRentalModal(true);
                            }, 50);

                            // Resetar após delay para permitir próximo clique
                            setTimeout(() => {
                                setShowRentalModal(false);
                            }, 1500);
                        }}
                    >
                        <Ionicons name="ticket-outline" size={24} color="#9CA3AF" />
                        <Text style={homeStyles.tabLabel}>Locaciones</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => navigation.navigate('MyRentals')}
                    >
                        <Ionicons name="hourglass-outline" size={24} color="#9CA3AF" />
                        <Text style={homeStyles.tabLabel}>Pendientes</Text>
                        {pendingRentals > 0 && (
                            <View style={homeStyles.tabBadge}>
                                <Text style={homeStyles.tabBadgeText}>{pendingRentals}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => navigation.navigate('ChatsList')}
                    >
                        <Ionicons name="chatbubbles-outline" size={24} color="#9CA3AF" />
                        <Text style={homeStyles.tabLabel}>Chats</Text>
                        {unreadMessages > 0 && (
                            <View style={homeStyles.tabBadge}>
                                <Text style={homeStyles.tabBadgeText}>{unreadMessages}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                        <Text style={homeStyles.tabLabel}>{t('tabBar.myProfile')}</Text>
                        {userUnread > 0 && (
                            <View style={homeStyles.tabBadge}>
                                <Text style={homeStyles.tabBadgeText}>{userUnread}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}


