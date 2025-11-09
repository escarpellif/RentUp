import { StyleSheet } from 'react-native';

export const documentTypeStyles = StyleSheet.create({
    documentTypeContainer: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    documentTypeOption: {
        flex: 1,
        minWidth: 100,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        alignItems: 'center',
    },
    documentTypeActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    documentTypeText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    documentTypeTextActive: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
});

