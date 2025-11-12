import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { categoryConfig } from '../constants/categoryConfig';
import { itemCardStyles } from '../styles/itemCardStyles';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

const ItemCard = ({ item, onDetailsPress, onPress, fullWidth = false }) => {
    // Validação para evitar erros
    if (!item) {
        return null;
    }

    // Validação segura para photo_url
    const imageUrl = (item.photo_url && typeof item.photo_url === 'string')
        ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`
        : null;

    // Fallback robusto para categoria
    const defaultCategory = { icon: '📦', color: '#95A5A6', gradient: ['#95A5A6', '#7F8C8D'] };
    const categoryInfo = categoryConfig[item.category] || categoryConfig['Otros'] || categoryConfig['Others'] || defaultCategory;

    // Suporta tanto onPress quanto onDetailsPress
    const handlePress = onPress || onDetailsPress;

    return (
        <TouchableOpacity
            style={[itemCardStyles.card, fullWidth && { width: '100%' }]}
            onPress={() => handlePress && handlePress(item)}
            activeOpacity={0.9}
        >
            {/* Imagem do Item com Overlay */}
            <View style={itemCardStyles.cardImageContainer}>
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

                {/* Badge de Disponibilidade */}
                {item.is_available ? (
                    <View style={itemCardStyles.availableBadge}>
                        <View style={itemCardStyles.availableDot} />
                        <Text style={itemCardStyles.availableBadgeText}>Disponible</Text>
                    </View>
                ) : (
                    <View style={itemCardStyles.unavailableBadge}>
                        <View style={itemCardStyles.unavailableDot} />
                        <Text style={itemCardStyles.unavailableBadgeText}>Alquilado</Text>
                    </View>
                )}
            </View>

            {/* Conteúdo do Card */}
            <View style={itemCardStyles.cardContent}>
                <Text style={itemCardStyles.cardTitle} numberOfLines={2}>
                    {item.title || 'Sin título'}
                </Text>

                {/* Localização */}
                <View style={itemCardStyles.locationRow}>
                    <Text style={itemCardStyles.locationIcon}>📍</Text>
                    <Text style={itemCardStyles.cardLocation} numberOfLines={1}>
                        {item.location || 'Sin ubicación'}
                    </Text>
                </View>

                {/* Preço em destaque */}
                <View style={itemCardStyles.priceRow}>
                    <View style={itemCardStyles.priceContainer}>
                        <Text style={itemCardStyles.priceSymbol}>€</Text>
                        <Text style={itemCardStyles.cardPrice}>
                            {parseFloat(item.price_per_day || 0).toFixed(2)}
                        </Text>
                        <Text style={itemCardStyles.priceLabel}>/dia</Text>
                    </View>

                    {/* Botão de ação */}
                    <View style={itemCardStyles.actionButton}>
                        <Text style={itemCardStyles.actionButtonText}>Ver +</Text>
                    </View>
                </View>
            </View>

            {/* Indicador visual de card interativo */}
            <View style={itemCardStyles.cardShine} />
        </TouchableOpacity>
    );
};

export default ItemCard;

