import { StyleSheet } from 'react-native';

export const footerStyles = StyleSheet.create({
title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#2c4455',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 25,
        color: '#666',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 15,
        color: '#333',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#333',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 25,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
});
