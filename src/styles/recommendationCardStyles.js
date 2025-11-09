import { StyleSheet } from 'react-native';

export const recommendationCardStyles = StyleSheet.create({
    recommendationCard: {
        backgroundColor: '#E8F5E9',
        margin: 20,
        marginTop: 10,
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#4CAF50',
        alignItems: 'center',
    },
    recommendationIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    recommendationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 12,
    },
    recommendationText: {
        fontSize: 15,
        color: '#1B5E20',
        lineHeight: 24,
        textAlign: 'left',
        width: '100%',
    },
});

