import { StyleSheet } from 'react-native';

export const adminBroadcastStyles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    recipientsContainer: {
        gap: 12,
    },
    recipientButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    recipientButtonActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    recipientButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    recipientIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recipientIconActive: {
        backgroundColor: '#DBEAFE',
    },
    recipientText: {
        flex: 1,
    },
    recipientLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    recipientLabelActive: {
        color: '#3B82F6',
    },
    recipientDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    messageContainer: {
        gap: 16,
    },
    inputGroup: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    subjectInput: {
        fontSize: 16,
        color: '#1F2937',
        padding: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
    },
    messageInput: {
        fontSize: 15,
        color: '#1F2937',
        padding: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        minHeight: 150,
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'right',
    },
    previewContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
    },
    preview: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 8,
    },
    previewSubject: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    previewMessage: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    sendButtonContainer: {
        padding: 16,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    sendButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
});
