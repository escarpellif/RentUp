import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { categoryConfig } from '../constants/categoryConfig';
import { itemCardStyles } from '../styles/itemCardStyles';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

const ItemCard = ({ item, onDetailsPress, onPress, fullWidth = false, userId = null }) => {
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
                {item.is_paused && (
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
                    {item.is_available ? (
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

