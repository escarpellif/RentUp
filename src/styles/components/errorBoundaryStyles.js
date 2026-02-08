import { StyleSheet } from 'react-native';

export const errorBoundaryStyles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorDetailsContainer: {
        marginTop: 30,
        alignSelf: 'stretch',
        maxHeight: 200,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    errorDetailsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 8,
    },
    errorDetailsText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
});
