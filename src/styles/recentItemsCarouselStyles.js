import { StyleSheet } from 'react-native';

export const recentItemsCarouselStyles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#999',
    },
    headerContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 4,
    },
    subheading: {
        fontSize: 14,
        color: '#2c4455',
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 5,
    },
    imageContainer: {
        position: 'relative',
        alignSelf: 'stretch',
        padding: 10,
        height: 180,
        // backgroundColor: '#F0F0F0',
    },
    image: {
        alignSelf: 'stretch',
        height: '100%',
    },
    placeholderImage: {
        alignSelf: 'stretch',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8E8E8',
    },
    placeholderText: {
        fontSize: 60,
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    newBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Badge de Desconto
    discountBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FF6B00',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
    },
    discountBadgeIcon: {
        fontSize: 12,
    },
    discountBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        lineHeight: 22,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    star: {
        fontSize: 16,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    priceLabel: {
        fontSize: 13,
        color: '#666',
        marginRight: 8,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10B981',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    locationIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
});

