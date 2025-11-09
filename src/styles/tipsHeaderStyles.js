import { StyleSheet } from 'react-native';

export const tipsHeaderStyles = StyleSheet.create({
    headerGradient: {
        paddingTop: 10,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    backArrow: {
        fontSize: 22,
        color: '#fff',
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 50,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
});

