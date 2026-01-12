import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { categoryConfig } from '../constants/categoryConfig';
import { itemCardStyles } from '../styles/itemCardStyles';
import { calculateDistance } from '../utils/locationHelper';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

const ItemCard = ({ item, onDetailsPress, onPress, fullWidth = false, userId = null, userLocation = null }) => {
    // Validação para evitar erros
    if (!item) {
        return null;
    }

    // Calcular distância se userLocation e coordenadas do item existirem
    const distance = (userLocation && item.coordinates?.latitude && item.coordinates?.longitude)
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.coordinates.latitude,
            item.coordinates.longitude
        )
        : null;

    // Formatar distância para exibição
    const formatDistance = (dist) => {
        if (!dist) return null;
        if (dist < 1) {
            return `${Math.round(dist * 1000)}m`; // Menos de 1km, mostrar em metros
        }
        return `${dist.toFixed(1)} km`; // Mostrar em km com 1 decimal
    };

    // Validação segura para photo_url
    const imageUrl = (item.photo_url && typeof item.photo_url === 'string')
        ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`
        : null;

    // Fallback robusto para categoria
    const defaultCategory = { icon: '📦', color: '#95A5A6', gradient: ['#95A5A6', '#7F8C8D'] };
    const categoryInfo = categoryConfig[item.category] || categoryConfig['Otros'] || categoryConfig['Others'] || defaultCategory;

    // Suporta tanto onPress quanto onDetailsPress
    const handlePress = onPress || onDetailsPress;

    // Define o estilo de largura baseado em fullWidth
    const cardWidthStyle = fullWidth
        ? { width: '100%' }
        : { flex: 1, maxWidth: '48%' };

    return (
        <TouchableOpacity
            style={[itemCardStyles.card, cardWidthStyle]}
            onPress={() => handlePress && handlePress(item)}
            activeOpacity={0.9}
        >
            {/* Categoria no Topo */}
            <View style={itemCardStyles.categoryHeader}>
                <Text style={itemCardStyles.categoryLabel}>{item.category || 'Otros'}</Text>
            </View>

            {/* Imagem do Item */}
            <View style={[itemCardStyles.cardImageContainer, fullWidth && { height: 220 }]}>
                {item.photo_url ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={itemCardStyles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[itemCardStyles.cardImagePlaceholder, { backgroundColor: (categoryInfo?.color || '#95A5A6') + '20' }]}>
                        <Text style={itemCardStyles.placeholderIcon}>{categoryInfo?.icon || '📦'}</Text>
                    </View>
                )}

                {/* Gradiente Overlay na parte inferior da imagem */}
                <View style={itemCardStyles.imageOverlay} />

                {/* Badge de Pausado */}
                {!(item.is_active ?? true) && (
                    <View style={itemCardStyles.pausedBadge}>
                        <Text style={itemCardStyles.pausedBadgeText}>⏸️ Pausado</Text>
                    </View>
                )}
            </View>

            {/* Conteúdo do Card */}
            <View style={itemCardStyles.cardContent}>
                {/* Título */}
                <Text style={itemCardStyles.cardTitle} numberOfLines={2}>
                    {item.title || 'Sin título'}
                </Text>

                {/* Descrição */}
                <Text style={itemCardStyles.cardDescription} numberOfLines={1}>
                    {item.description || 'Sin descripción'}
                </Text>

                {/* Distância */}
                {distance !== null && (
                    <Text style={itemCardStyles.distanceText}>
                        📍 {formatDistance(distance)}
                    </Text>
                )}

                {/* Preço e Status na mesma linha */}
                <View style={itemCardStyles.footerContainer}>
                    <View style={itemCardStyles.priceContainer}>
                        <Text style={itemCardStyles.priceSymbol}>€</Text>
                        <Text style={itemCardStyles.cardPrice}>
                            {(userId === item?.owner_id
                                ? parseFloat(item.price_per_day || 0)
                                : parseFloat(item.price_per_day || 0) * 1.18
                            ).toFixed(2)}
                        </Text>
                        <Text style={itemCardStyles.priceLabel}>/dia</Text>
                    </View>

                    {/* Status Badge no Canto Inferior Direito */}
                    {!(item.is_active ?? true) ? (
                        <View style={[itemCardStyles.statusBadgeSmall, itemCardStyles.statusBadgeUnavailable]}>
                            <Text style={itemCardStyles.statusBadgeText}>No Disponible</Text>
                        </View>
                    ) : item.is_available ? (
                        <View style={itemCardStyles.statusBadgeSmall}>
                            <Text style={itemCardStyles.statusBadgeText}>Disponible</Text>
                        </View>
                    ) : (
                        <View style={[itemCardStyles.statusBadgeSmall, itemCardStyles.statusBadgeUnavailable]}>
                            <Text style={itemCardStyles.statusBadgeText}>Alquilado</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Indicador visual de card interativo */}
            <View style={itemCardStyles.cardShine} />
        </TouchableOpacity>
    );
};

export default ItemCard;

