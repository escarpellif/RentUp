import { StyleSheet } from 'react-native';

export const tipCardStyles = StyleSheet.create({
    tipCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tipIcon: {
        fontSize: 24,
    },
    tipContent: {
        flex: 1,
        justifyContent: 'center',
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    tipDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

