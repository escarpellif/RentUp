import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import PhotoCarousel from '../components/PhotoCarousel';
import ApproximateLocationMap from '../components/ApproximateLocationMap';
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

        // Verificar se o usuário tem verificação aprovada
        const { isVerified, status } = await checkUserVerification(session.user.id);

        if (!isVerified) {
            handleVerificationAlert(status, navigation);
            return;
        }

        // Se verificado, continuar para solicitar aluguel
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
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header com Botão Voltar */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Detalles del Artículo</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.container}>
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
                <Text style={styles.title}>{item?.title || 'Sin título'}</Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                        €{(session?.user?.id === item?.owner_id
                            ? parseFloat(item?.price_per_day || 0)
                            : parseFloat(item?.price_per_day || 0) * 1.18
                        ).toFixed(2)}
                    </Text>
                    <Text style={styles.priceLabel}> / dia</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                </View>

                {/* Descrição */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>

                {/* Approximate Location Map */}
                <ApproximateLocationMap
                    coordinates={item.coordinates_approx}
                    locationApprox={item.location_approx || item.location}
                />

                {/* Informações do Dono */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Anunciante</Text>
                    {loading ? (
                        <Text>Cargando...</Text>
                    ) : (
                        <View style={styles.ownerCard}>
                            <View style={styles.ownerInfo}>
                                <Text style={styles.ownerName}>
                                    {ownerProfile?.full_name || 'Usuario'}
                                </Text>
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

            <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    backButton: {
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 15,
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#28a745',
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
        color: '#333',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#495057',
    },
    ownerCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
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
        textAlign: 'center',
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
});
