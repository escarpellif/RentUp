import { StyleSheet } from 'react-native';

export const welcomeCardStyles = StyleSheet.create({
    welcomeCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
});

