import { StyleSheet } from 'react-native';

export const itemCardStyles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    categoryHeader: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textTransform: 'capitalize',
    },
    cardImageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 50,
        opacity: 0.6,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'transparent',
    },
    cardContent: {
        padding: 14,
        paddingBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a3a52',
        marginBottom: 6,
        lineHeight: 22,
    },
    cardDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
        lineHeight: 18,
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceSymbol: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
        marginRight: 3,
    },
    cardPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    priceLabel: {
        fontSize: 12,
        color: '#10B981',
        marginLeft: 3,
        fontWeight: '500',
    },
    statusBadgeSmall: {
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusBadgeUnavailable: {
        backgroundColor: '#dc3545',
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 0,
    },
    cardShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
});
