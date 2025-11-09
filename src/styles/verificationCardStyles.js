import { StyleSheet } from 'react-native';

export const verificationCardStyles = StyleSheet.create({
    infoCard: {
        backgroundColor: '#E3F2FD',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: '#0D47A1',
        lineHeight: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
    },
});

