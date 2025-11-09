import { StyleSheet } from 'react-native';

export const welcomeCardStyles = StyleSheet.create({
    welcomeCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginTop: 10,
        marginBottom: 10,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        borderLeftWidth: 5,
        borderLeftColor: '#2c4455',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 23,
    },
});

