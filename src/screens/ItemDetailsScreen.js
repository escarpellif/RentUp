import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform , StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import PhotoCarousel from '../components/PhotoCarousel';
import ExactLocationMap from '../components/ExactLocationMap';
import { checkUserVerification, handleVerificationAlert } from '../utils/verificationHelper';
import { requiereAutenticacion } from '../utils/guestCheck';


const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function ItemDetailsScreen({ route, navigation, session, isGuest }) {
    const { item, autoOpenChat = false, openChatWith = null } = route.params || {};
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Preparar array de fotos (compatível com items antigos e novos) com validação
    const photos = item && item.photos && Array.isArray(item.photos) && item.photos.length > 0
        ? item.photos
        : (item && item.photo_url && typeof item.photo_url === 'string')
        ? [item.photo_url]
        : [];

    const fetchOwnerProfile = useCallback(async () => {
        // Validação: verificar se owner_id existe
        if (!item || !item.owner_id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, rating_average, rating_count')
            .eq('id', item.owner_id)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil do dono:', error);
        } else {
            setOwnerProfile(data);
        }
        setLoading(false);
    }, [item]);

    useEffect(() => {
        fetchOwnerProfile();
    }, [fetchOwnerProfile]);


    // Validação no render: Se não há item, mostrar erro
    if (!item) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: 18, marginBottom: 20 }}>Error: Item não encontrado</Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ backgroundColor: '#10B981', padding: 15, borderRadius: 8 }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleContact = () => {
        // Check if user is guest
        if (!requiereAutenticacion(isGuest, 'Por favor, inicia sesión para chatear con el anunciante')) {
            return;
        }

        // Usar openChatWith se foi passado (caso de dono conversando com interessado)
        // Senão, usar ownerProfile (caso de interessado conversando com dono)
        const profileToChat = openChatWith || ownerProfile;

        if (!profileToChat) {
            Alert.alert('Error', 'No se pudo cargar la información del vendedor');
            return;
        }

        // Se não é autoOpenChat e é o dono do item, bloquear
        if (!autoOpenChat && session.user.id === item.owner_id) {
            Alert.alert('Info', 'No puedes enviar mensajes a tu propio anuncio');
            return;
        }

        // Criar conversation_id único incluindo ITEM_ID
        // Formato: userA_userB_itemId (sempre ordenado)
        const conversationId = [session.user.id, profileToChat.id].sort().join('_') + '_' + item.id;

        // Navegar para a tela de conversa
        navigation.navigate('ChatConversation', {
            itemId: item.id,
            item: item,
            otherUser: profileToChat,
            conversationId: conversationId,
        });
    };

    const handleRequestRental = async () => {
        // Check if user is guest
        if (!requiereAutenticacion(isGuest, 'Por favor, inicia sesión para solicitar un alquiler')) {
            return;
        }

        // Verificar se já existe uma solicitação pendente ou aprovada para este item
        try {
            const { data: existingRentals, error: rentalCheckError } = await supabase
                .from('rentals')
                .select('id, status, start_date, end_date')
                .eq('item_id', item.id)
                .eq('renter_id', session.user.id)
                .in('status', ['pending', 'approved', 'active'])
                .order('created_at', { ascending: false })
                .limit(1);

            if (rentalCheckError) {
                console.error('Erro ao verificar solicitações:', rentalCheckError);
            }

            // Se já existe uma solicitação pendente ou ativa
            if (existingRentals && existingRentals.length > 0) {
                const rental = existingRentals[0];
                let statusMessage = '';

                if (rental.status === 'pending') {
                    statusMessage = 'Ya has solicitado el alquiler de este artículo.\n\nPor favor, aguarda la respuesta del anunciante.';
                } else if (rental.status === 'approved') {
                    statusMessage = 'Ya tienes una solicitud aprobada para este artículo.\n\nVerifica tus locaciones activas.';
                } else if (rental.status === 'active') {
                    statusMessage = 'Actualmente estás alquilando este artículo.\n\nDebes devolverlo antes de solicitar un nuevo alquiler.';
                }

                Alert.alert(
                    'Solicitud Existente',
                    statusMessage,
                    [{ text: 'Entendido' }]
                );
                return;
            }
        } catch (error) {
            console.error('Erro ao verificar solicitações:', error);
        }

        // Verificar se o usuário tem verificação aprovada
        const { isVerified, status } = await checkUserVerification(session.user.id);

        if (!isVerified) {
            handleVerificationAlert(status, navigation);
            return;
        }

        // Se verificado e sem solicitação pendente, continuar para solicitar aluguel
        navigation.navigate('RequestRental', {
            item: item,
            ownerProfile: ownerProfile
        });
    };

    const renderStars = (rating, count) => {
        const ratingValue = rating ? parseFloat(rating) : 0;

        return (
            <View style={styles.starsContainer}>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Text key={star} style={styles.starIcon}>
                            {star <= Math.round(ratingValue) ? '⭐' : '☆'}
                        </Text>
                    ))}
                </View>
                <Text style={styles.ratingNumber}>
                    {ratingValue > 0 ? ratingValue.toFixed(1) : ''} ({count || 0} {count === 1 ? 'valoración' : 'valoraciones'})
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde - Mesmo layout do Marketplace */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    {/* Botão Voltar + Título */}
                    <View style={styles.leftHeader}>
                        <TouchableOpacity
                            style={styles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Detalles del Artículo</Text>
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
            </View>

            <ScrollView style={styles.scrollContainer}>
                {/* Card Branco com Conteúdo */}
                <View style={styles.cardContainer}>
                    {/* Carrossel de Fotos */}
                    {photos.length > 0 ? (
                        <PhotoCarousel photos={photos} supabaseUrl={SUPABASE_URL} />
                    ) : (
                        <View style={styles.noPhotoContainer}>
                            <Text style={styles.noPhotoText}>📷</Text>
                            <Text style={styles.noPhotoLabel}>Sin foto disponible</Text>
                        </View>
                    )}

                    {/* Informações Principais */}
                    <View style={styles.contentContainer}>
                        {/* Categoria no topo */}
                        <View style={styles.categoryBadgeContainer}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.category}</Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{item?.title || 'Sin título'}</Text>

                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>
                                €{(session?.user?.id === item?.owner_id
                                    ? parseFloat(item?.price_per_day || 0)
                                    : parseFloat(item?.price_per_day || 0) * 1.18
                                ).toFixed(2)}
                            </Text>
                            <Text style={styles.priceLabel}> / día</Text>
                        </View>

                        {/* Descrição */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Descripción</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>

                        {/* Opções de Entrega */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🚚 Opciones de Entrega</Text>
                            {item.delivery_type === 'delivery' ? (
                                <View style={styles.deliveryOptionsContainer}>
                                    {item.is_free_delivery ? (
                                        <>
                                            <View style={styles.deliveryOption}>
                                                <Text style={styles.deliveryOptionIcon}>✓</Text>
                                                <Text style={styles.deliveryOptionText}>Recogida en el local</Text>
                                            </View>
                                            <Text style={styles.orText}>O</Text>
                                            <View style={styles.deliveryOption}>
                                                <Text style={styles.deliveryOptionIcon}>✓</Text>
                                                <Text style={styles.deliveryOptionText}>Entrega gratis</Text>
                                            </View>
                                            {item.delivery_distance && (
                                                <Text style={styles.deliveryNote}>
                                                    📍 Entrega hasta {item.delivery_distance} km
                                                </Text>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <View style={styles.deliveryOption}>
                                                <Text style={styles.deliveryOptionIcon}>✓</Text>
                                                <Text style={styles.deliveryOptionText}>Recogida en el local</Text>
                                            </View>
                                            <Text style={styles.orText}>O</Text>
                                            <View style={styles.deliveryOption}>
                                                <Text style={styles.deliveryOptionIcon}>✓</Text>
                                                <Text style={styles.deliveryOptionText}>
                                                    Entrega mediante tasa de €{parseFloat(item.delivery_fee || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            {item.delivery_distance && (
                                                <Text style={styles.deliveryNote}>
                                                    📍 Entrega hasta {item.delivery_distance} km
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.deliveryOptionsContainer}>
                                    <View style={styles.deliveryOption}>
                                        <Text style={styles.deliveryOptionIcon}>✓</Text>
                                        <Text style={styles.deliveryOptionText}>Recogida en el local</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Ubicación */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ubicación</Text>
                            <Text style={styles.locationText}>📍 {item.location_full || item.location}</Text>
                        </View>

                        {/* Exact Location Map */}
                        <ExactLocationMap
                            coordinates={item.coordinates}
                            location={item.location_full || item.location}
                        />

                        {/* Informações do Dono */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Anunciante</Text>
                            {loading ? (
                                <Text>Cargando...</Text>
                            ) : (
                                <View style={styles.ownerCardLeft}>
                                    <Text style={styles.ownerNameLeft}>
                                        {ownerProfile?.full_name || 'Usuario'}
                                    </Text>
                                    <View style={styles.starsContainerLeft}>
                                        {renderStars(ownerProfile?.rating_average || 0, ownerProfile?.rating_count || 0)}
                                    </View>
                                </View>
                            )}
                        </View>

                {/* Informações Adicionais */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información</Text>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Disponible:</Text>
                        <Text style={styles.infoValue}>
                            {item.is_available ? '✅ Sí' : '❌ No disponible'}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Anunciado el:</Text>
                        <Text style={styles.infoValue}>
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                </View>

                {/* Botões de Ação - Ocultar se for o próprio dono */}
                {session?.user?.id !== item?.owner_id && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleRequestRental}
                        >
                            <Text style={styles.primaryButtonText}>
                                🔑 Solicitar Alquiler
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleContact}
                        >
                            <Text style={styles.contactButtonText}>
                                💬 Chat
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                </View>
                {/* Fim do Card Branco */}
            </View>

            <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#E8EAED',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    // Header Verde - Mesmo layout do Marketplace
    headerContainer: {
        backgroundColor: '#10B981',
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoImage: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: '#E8EAED',
    },
    cardContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    noPhotoContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noPhotoText: {
        fontSize: 60,
        marginBottom: 10,
    },
    noPhotoLabel: {
        fontSize: 16,
        color: '#666',
    },
    contentContainer: {
        padding: 20,
    },
    categoryBadgeContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'left',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 15,
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#10B981',
    },
    priceLabel: {
        fontSize: 18,
        color: '#6c757d',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    badge: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    location: {
        fontSize: 14,
        color: '#6c757d',
    },
    locationText: {
        fontSize: 16,
        color: '#495057',
        lineHeight: 24,
        textAlign: 'left',
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2c4455',
        textAlign: 'left',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#495057',
        textAlign: 'left',
    },
    ownerCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
    },
    ownerCardLeft: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
        padding: 0,
    },
    ownerInfo: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    ownerNameLeft: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'left',
        marginBottom: 8,
    },
    contactButton: {
        backgroundColor: '#2c4455',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    starsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    starsContainerLeft: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginTop: 5,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    starIcon: {
        fontSize: 16,
        marginRight: 2,
    },
    ratingNumber: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'left',
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    actionButtons: {
        marginTop: 30,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#007bff',
    },
    secondaryButtonText: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: '600',
    },
    deliveryOptionsContainer: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    deliveryOptionIcon: {
        fontSize: 18,
        color: '#10B981',
        fontWeight: 'bold',
    },
    deliveryOptionText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    deliveryNote: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    orText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
        textAlign: 'center',
        marginVertical: 8,
    },
});
