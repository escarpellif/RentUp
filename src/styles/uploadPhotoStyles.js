import { StyleSheet } from 'react-native';

export const uploadPhotoStyles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        backgroundColor: '#F8F9FA',
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        color: '#333',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderStyle: 'dashed',
    },
    uploadIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    uploadText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '600',
    },
});

