import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import { recentItemsCarouselStyles as styles } from '../styles/recentItemsCarouselStyles';
import { calculateDistance } from '../utils/locationHelper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 10;

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function RecentItemsCarousel({ navigation, session }) {
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const userId = session?.user?.id;

    // Obter localização do usuário
    useEffect(() => {
        getUserLocation();
    }, []);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

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
    };

    useEffect(() => {
        fetchRecentItems();

        // Adicionar listener para atualizar quando a tela voltar ao foco
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRecentItems();
        });

        return unsubscribe;
    }, [navigation]);

    const fetchRecentItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select(`
                    *,
                    owner:profiles!items_owner_id_fkey(
                        id,
                        full_name,
                        rating_average,
                        rating_count
                    )
                `)
                .eq('is_available', true)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            setRecentItems(data || []);
        } catch (error) {
            console.error('Error fetching recent items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (item) => {
        if (!item) return null;

        if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
            return `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photos[0]}`;
        } else if (item.photo_url && typeof item.photo_url === 'string') {
            return `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`;
        }
        return null;
    };

    const renderStars = (rating = 0) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Text key={i} style={styles.star}>
                    {i <= rating ? '⭐' : '☆'}
                </Text>
            );
        }
        return stars;
    };

    // Calcular distância do item ao usuário
    const getItemDistance = (item) => {
        if (!userLocation || !item.coordinates?.latitude || !item.coordinates?.longitude) {
            return null;
        }

        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.coordinates.latitude,
            item.coordinates.longitude
        );

        return distance;
    };

    // Formatar distância
    const formatDistance = (dist) => {
        if (!dist) return null;
        if (dist < 1) {
            return `${Math.round(dist * 1000)}m`;
        }
        return `${dist.toFixed(1)} km`;
    };

    // Extrair bairro do endereço completo
    const getNeighborhood = (location) => {
        if (!location) return '';

        // Tentar extrair o bairro do formato "Rua X, Bairro, Cidade"
        const parts = location.split(',').map(part => part.trim());

        // Se tiver pelo menos 2 partes, a segunda geralmente é o bairro
        if (parts.length >= 2) {
            return parts[1]; // Retorna o bairro
        }

        // Se não conseguir separar, retorna a primeira parte
        return parts[0] || location;
    };

    const handleItemPress = (item) => {
        navigation.navigate('ItemDetails', { item });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando artículos...</Text>
            </View>
        );
    }

    if (recentItems.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.heading}>Activos Recientemente</Text>
                <Text style={styles.subheading}>Los últimos artículos disponibles</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                snapToAlignment="center"
                contentContainerStyle={styles.scrollContent}
            >
                {recentItems.map((item) => {
                    const imageUrl = getImageUrl(item);

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.card,
                                { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }
                            ]}
                            onPress={() => handleItemPress(item)}
                            activeOpacity={0.9}
                        >
                            {/* Image */}
                            <View style={styles.imageContainer}>
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Text style={styles.placeholderText}>📦</Text>
                                    </View>
                                )}
                            </View>

                            {/* Content */}
                            <View style={styles.content}>
                                {/* Title */}
                                <Text style={styles.title} numberOfLines={2}>
                                    {item?.title || 'Sin título'}
                                </Text>

                                {/* Description */}
                                <Text style={styles.description} numberOfLines={2}>
                                    {item?.description || 'Sin descripción'}
                                </Text>

                                {/* Rating */}
                                <View style={styles.ratingContainer}>
                                    {renderStars(Math.round(item.owner?.rating_average || 0))}
                                    <Text style={styles.ratingText}>
                                        {item.owner?.rating_average > 0
                                            ? `${parseFloat(item.owner.rating_average).toFixed(1)} (${item.owner.rating_count || 0})`
                                            : '(Sin valoraciones)'}
                                    </Text>
                                </View>

                                {/* Price */}
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceLabel}>Precio por día:</Text>
                                    <Text style={styles.price}>
                                        €{(userId === item.owner_id
                                            ? parseFloat(item.price_per_day)
                                            : parseFloat(item.price_per_day) * 1.18
                                        ).toFixed(2)}
                                    </Text>
                                </View>

                                {/* Location - Distância e Bairro */}
                                {(() => {
                                    const distance = getItemDistance(item);
                                    const neighborhood = getNeighborhood(item.location_full || item.location);

                                    if (distance && neighborhood) {
                                        return (
                                            <View style={styles.locationContainer}>
                                                <Text style={styles.locationIcon}>📍</Text>
                                                <Text style={styles.locationText} numberOfLines={1}>
                                                    {formatDistance(distance)} ({neighborhood})
                                                </Text>
                                            </View>
                                        );
                                    } else if (neighborhood) {
                                        return (
                                            <View style={styles.locationContainer}>
                                                <Text style={styles.locationIcon}>📍</Text>
                                                <Text style={styles.locationText} numberOfLines={1}>
                                                    {neighborhood}
                                                </Text>
                                            </View>
                                        );
                                    }
                                    return null;
                                })()}
                            </View>

                            {/* New Badge (if created in last 7 days) */}
                            {(() => {
                                const createdDate = new Date(item.created_at);
                                const daysDiff = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
                                return daysDiff <= 7 ? (
                                    <View style={styles.newBadge}>
                                        <Text style={styles.newBadgeText}>NUEVO</Text>
                                    </View>
                                ) : null;
                            })()}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

