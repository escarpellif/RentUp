import { StyleSheet, Platform } from 'react-native';

export const tipsScreenStyles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    scrollContent: {
        flex: 1,
    },
    tipsContainer: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 10,
    },
    spacer: {
        height: 100,
    },
});

