import { StyleSheet } from 'react-native';

export const tipsHeaderStyles = StyleSheet.create({
    headerGradient: {
        paddingTop: 10,
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        borderBottomWidth: 2,
        borderBottomColor: '#e0e0e0',
        marginBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    backArrow: {
        fontSize: 20,
        color: '#2c4455',
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 36,
        marginTop: -40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 3,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#2c4455',
    },
});

