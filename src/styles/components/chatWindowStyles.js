import { StyleSheet, Platform } from 'react-native';

export const chatWindowStyles = StyleSheet.create({
container: {
        flex: 1,
    },
    backgroundContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    backgroundImage: {
        opacity: 0.7,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 20,
    },
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        marginTop: 25,
        borderBottomColor: '#E8E8E8',
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingTop: Platform.OS === 'android' ? 20 : 18,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#333',
        fontWeight: '600',
    },
    headerTitle: {
        flex: 1,
        justifyContent: 'center',
    },
    headerItemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
        lineHeight: 20,
    },
    headerUserName: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingVertical: 24,
        paddingBottom: 30,
    },
    messageRow: {
        marginVertical: 8,
        flexDirection: 'row',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    messageBubble: {
        maxWidth: '78%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    messageBubbleCurrentUser: {
        backgroundColor: '#2c4455',
    },
    messageBubbleOtherUser: {
        backgroundColor: '#E8E8E8',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    messageTextLight: {
        color: '#fff',
    },
    messageTextDark: {
        color: '#333',
    },
    messageTime: {
        fontSize: 12,
        marginTop: 6,
    },
    messageTimeLight: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    messageTimeDark: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'android' ? 16 : 20,
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        flexShrink: 0,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    sendButtonText: {
        fontSize: 22,
    },
});
