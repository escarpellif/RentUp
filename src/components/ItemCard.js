import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { categoryConfig } from '../constants/categoryConfig';
import { itemCardStyles } from '../styles/itemCardStyles';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

const ItemCard = ({ item, onDetailsPress }) => {
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`;
    const categoryInfo = categoryConfig[item.category] || categoryConfig['Otros'];

    return (
        <TouchableOpacity
            style={itemCardStyles.card}
            onPress={() => onDetailsPress(item)}
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
                    <View style={[itemCardStyles.cardImagePlaceholder, { backgroundColor: categoryInfo.color + '20' }]}>
                        <Text style={itemCardStyles.placeholderIcon}>{categoryInfo.icon}</Text>
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

                {/* Ícone de Categoria */}
                <View style={[itemCardStyles.categoryIconBadge, { backgroundColor: categoryInfo.color }]}>
                    <Text style={itemCardStyles.categoryIconText}>{categoryInfo.icon}</Text>
                </View>
            </View>

            {/* Conteúdo do Card */}
            <View style={itemCardStyles.cardContent}>
                <Text style={itemCardStyles.cardTitle} numberOfLines={2}>{item.title}</Text>

                {/* Localização */}
                <View style={itemCardStyles.locationRow}>
                    <Text style={itemCardStyles.locationIcon}>📍</Text>
                    <Text style={itemCardStyles.cardLocation} numberOfLines={1}>{item.location}</Text>
                </View>

                {/* Preço em destaque */}
                <View style={itemCardStyles.priceRow}>
                    <View style={itemCardStyles.priceContainer}>
                        <Text style={itemCardStyles.priceSymbol}>€</Text>
                        <Text style={itemCardStyles.cardPrice}>{parseFloat(item.price_per_day).toFixed(2)}</Text>
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

