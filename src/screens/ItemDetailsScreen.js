import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import PhotoCarousel from '../components/PhotoCarousel';
// import ExactLocationMap from '../components/ExactLocationMap'; // TEMPORARIAMENTE DESABILITADO
import { checkUserVerification, handleVerificationAlert } from '../utils/verificationHelper';
import { requiereAutenticacion } from '../utils/guestCheck';
import { useTranslation } from 'react-i18next';
import { itemDetailsStyles } from '../styles/screens/itemDetailsStyles';


const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function ItemDetailsScreen({ route, navigation, session, isGuest }) {
    const { t } = useTranslation();
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
            Alert.alert(
                '⚠️ Información No Disponible',
                'No pudimos cargar la información del vendedor. Por favor, intenta nuevamente.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Reintentar', onPress: () => fetchOwnerProfile() }
                ]
            );
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
            <View style={itemDetailsStyles.starsContainer}>
                <View style={itemDetailsStyles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Text key={star} style={itemDetailsStyles.starIcon}>
                            {star <= Math.round(ratingValue) ? '⭐' : '☆'}
                        </Text>
                    ))}
                </View>
                <Text style={itemDetailsStyles.ratingNumber}>
                    {ratingValue > 0 ? ratingValue.toFixed(1) : ''} ({count || 0} {count === 1 ? 'valoración' : 'valoraciones'})
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={itemDetailsStyles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde - Mesmo layout do Marketplace */}
            <View style={itemDetailsStyles.headerContainer}>
                <View style={itemDetailsStyles.headerTopRow}>
                    {/* Botão Voltar + Título */}
                    <View style={itemDetailsStyles.leftHeader}>
                        <TouchableOpacity
                            style={itemDetailsStyles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={itemDetailsStyles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={itemDetailsStyles.headerTitle}>Detalles del Artículo</Text>
                    </View>

                    {/* ALUKO à Direita */}
                    <View style={itemDetailsStyles.logoContainer}>
                        <Image
                            source={require('../../assets/images/app-icon.png')}
                            style={itemDetailsStyles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={itemDetailsStyles.logoText}>ALUKO</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={itemDetailsStyles.scrollContainer}>
                {/* Card Branco com Conteúdo */}
                <View style={itemDetailsStyles.cardContainer}>
                    {/* Carrossel de Fotos */}
                    {photos.length > 0 ? (
                        <PhotoCarousel photos={photos} supabaseUrl={SUPABASE_URL} />
                    ) : (
                        <View style={itemDetailsStyles.noPhotoContainer}>
                            <Text style={itemDetailsStyles.noPhotoText}>📷</Text>
                            <Text style={itemDetailsStyles.noPhotoLabel}>Sin foto disponible</Text>
                        </View>
                    )}

                    {/* Informações Principais */}
                    <View style={itemDetailsStyles.contentContainer}>
                        {/* Categoria no topo */}
                        <View style={itemDetailsStyles.categoryBadgeContainer}>
                            <View style={itemDetailsStyles.badge}>
                                <Text style={itemDetailsStyles.badgeText}>{item.category}</Text>
                            </View>
                        </View>

                        <Text style={itemDetailsStyles.title}>{item?.title || 'Sin título'}</Text>

                        <View style={itemDetailsStyles.priceContainer}>
                            <Text style={itemDetailsStyles.price}>
                                €{(session?.user?.id === item?.owner_id
                                    ? parseFloat(item?.price_per_day || 0)
                                    : parseFloat(item?.price_per_day || 0) * 1.18
                                ).toFixed(2)}
                            </Text>
                            <Text style={itemDetailsStyles.priceLabel}> / día</Text>
                        </View>

                        {/* Descrição */}
                        <View style={itemDetailsStyles.section}>
                            <Text style={itemDetailsStyles.sectionTitle}>Descripción</Text>
                            <Text style={itemDetailsStyles.description}>{item.description}</Text>
                        </View>

                        {/* Descontos - Mostrar apenas se houver descontos */}
                        {(item.discount_week > 0 || item.discount_month > 0) && (
                            <View style={itemDetailsStyles.discountContainer}>
                                <Text style={itemDetailsStyles.discountTitle}>🎉 {t('items.discountsAvailable')}</Text>
                                {item.discount_week > 0 && (
                                    <View style={itemDetailsStyles.discountItem}>
                                        <Text style={itemDetailsStyles.discountIcon}>📅</Text>
                                        <Text style={itemDetailsStyles.discountText}>
                                            <Text style={itemDetailsStyles.discountBold}>{item.discount_week}% OFF</Text>
                                            {' '}{t('items.weeklyDiscount')}
                                        </Text>
                                    </View>
                                )}
                                {item.discount_month > 0 && (
                                    <View style={itemDetailsStyles.discountItem}>
                                        <Text style={itemDetailsStyles.discountIcon}>📆</Text>
                                        <Text style={itemDetailsStyles.discountText}>
                                            <Text style={itemDetailsStyles.discountBold}>{item.discount_month}% OFF</Text>
                                            {' '}{t('items.monthlyDiscount')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Opções de Entrega */}
                        <View style={itemDetailsStyles.section}>
                            <Text style={itemDetailsStyles.sectionTitle}>🚚 Opciones de Entrega</Text>
                            {item.delivery_type === 'delivery' ? (
                                <View style={itemDetailsStyles.deliveryOptionsContainer}>
                                    {item.is_free_delivery ? (
                                        <>
                                            <View style={itemDetailsStyles.deliveryOption}>
                                                <Text style={itemDetailsStyles.deliveryOptionIcon}>✓</Text>
                                                <Text style={itemDetailsStyles.deliveryOptionText}>Recogida en el local</Text>
                                            </View>
                                            <Text style={itemDetailsStyles.orText}>O</Text>
                                            <View style={itemDetailsStyles.deliveryOption}>
                                                <Text style={itemDetailsStyles.deliveryOptionIcon}>✓</Text>
                                                <Text style={itemDetailsStyles.deliveryOptionText}>Entrega gratis</Text>
                                            </View>
                                            {item.delivery_distance && (
                                                <Text style={itemDetailsStyles.deliveryNote}>
                                                    📍 Entrega hasta {item.delivery_distance} km
                                                </Text>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <View style={itemDetailsStyles.deliveryOption}>
                                                <Text style={itemDetailsStyles.deliveryOptionIcon}>✓</Text>
                                                <Text style={itemDetailsStyles.deliveryOptionText}>Recogida en el local</Text>
                                            </View>
                                            <Text style={itemDetailsStyles.orText}>O</Text>
                                            <View style={itemDetailsStyles.deliveryOption}>
                                                <Text style={itemDetailsStyles.deliveryOptionIcon}>✓</Text>
                                                <Text style={itemDetailsStyles.deliveryOptionText}>
                                                    Entrega mediante taxa de €{parseFloat(item.delivery_fee || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            {item.delivery_distance && (
                                                <Text style={itemDetailsStyles.deliveryNote}>
                                                    📍 Entrega hasta {item.delivery_distance} km
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </View>
                            ) : (
                                <View style={itemDetailsStyles.deliveryOptionsContainer}>
                                    <View style={itemDetailsStyles.deliveryOption}>
                                        <Text style={itemDetailsStyles.deliveryOptionIcon}>✓</Text>
                                        <Text style={itemDetailsStyles.deliveryOptionText}>Recogida en el local</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Ubicación */}
                        <View style={itemDetailsStyles.section}>
                            <Text style={itemDetailsStyles.sectionTitle}>Ubicación</Text>
                            <Text style={itemDetailsStyles.locationText}>📍 {item.location_full || item.location}</Text>
                        </View>

                        {/* Exact Location Map - TEMPORARIAMENTE DESABILITADO */}
                        {/*
                        <ExactLocationMap
                            coordinates={item.coordinates}
                            location={item.location_full || item.location}
                        />
                        */}

                        {/* Substituto temporário do mapa */}
                        {item.coordinates && (
                            <View style={itemDetailsStyles.section}>
                                <Text style={itemDetailsStyles.sectionTitle}>📍 Coordenadas</Text>
                                <Text style={itemDetailsStyles.locationText}>
                                    Lat: {item.coordinates.latitude?.toFixed(6)}
                                </Text>
                                <Text style={itemDetailsStyles.locationText}>
                                    Lng: {item.coordinates.longitude?.toFixed(6)}
                                </Text>
                                <Text style={{...itemDetailsStyles.locationText, marginTop: 8, fontStyle: 'italic', color: '#666'}}>
                                    💡 Mapa será ativado em breve
                                </Text>
                            </View>
                        )}

                        {/* Informações do Dono */}
                        <View style={itemDetailsStyles.section}>
                            <Text style={itemDetailsStyles.sectionTitle}>Anunciante</Text>
                            {loading ? (
                                <Text>Cargando...</Text>
                            ) : (
                                <View style={itemDetailsStyles.ownerCardLeft}>
                                    <Text style={itemDetailsStyles.ownerNameLeft}>
                                        {ownerProfile?.full_name || 'Usuario'}
                                    </Text>
                                    <View style={itemDetailsStyles.starsContainerLeft}>
                                        {renderStars(ownerProfile?.rating_average || 0, ownerProfile?.rating_count || 0)}
                                    </View>
                                </View>
                            )}
                        </View>

                {/* Informações Adicionais */}
                <View style={itemDetailsStyles.section}>
                    <Text style={itemDetailsStyles.sectionTitle}>Información</Text>
                    <View style={itemDetailsStyles.infoItem}>
                        <Text style={itemDetailsStyles.infoLabel}>Disponible:</Text>
                        <Text style={itemDetailsStyles.infoValue}>
                            {item.is_available ? '✅ Sí' : '❌ No disponible'}
                        </Text>
                    </View>
                    <View style={itemDetailsStyles.infoItem}>
                        <Text style={itemDetailsStyles.infoLabel}>Anunciado el:</Text>
                        <Text style={itemDetailsStyles.infoValue}>
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                </View>

                {/* Botões de Ação - Ocultar se for o próprio dono */}
                {session?.user?.id !== item?.owner_id && (
                    <View style={itemDetailsStyles.actionButtons}>
                        <TouchableOpacity
                            style={itemDetailsStyles.primaryButton}
                            onPress={handleRequestRental}
                        >
                            <Text style={itemDetailsStyles.primaryButtonText}>
                                🔑 Solicitar Alquiler
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={itemDetailsStyles.contactButton}
                            onPress={handleContact}
                        >
                            <Text style={itemDetailsStyles.contactButtonText}>
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


