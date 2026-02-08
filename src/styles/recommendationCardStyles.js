import { StyleSheet } from 'react-native';

export const recommendationCardStyles = StyleSheet.create({
    recommendationCard: {
        backgroundColor: '#E8F5E9',
        margin: 20,
        marginTop: 10,
        padding: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#10B981',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    recommendationIcon: {
        fontSize: 44,
        marginBottom: 12,
    },
    recommendationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 12,
        textAlign: 'center',
    },
    recommendationText: {
        fontSize: 15,
        color: '#1B5E20',
        lineHeight: 24,
        textAlign: 'left',
        alignSelf: 'stretch',
    },
});

