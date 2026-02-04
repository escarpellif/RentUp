import { StyleSheet, Platform } from 'react-native';

export const chatConversationStyles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: '#E5DDD5',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#2c4455',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 22,
        color: '#fff',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerItem: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    chatContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        gap: 8,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 4,
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 12,
        padding: 12,
    },
    messageBubbleCurrentUser: {
        backgroundColor: '#10B981',
        borderBottomRightRadius: 4,
    },
    messageBubbleOtherUser: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTextLight: {
        color: '#fff',
    },
    messageTextDark: {
        color: '#333',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    messageTimeLight: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    messageTimeDark: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: '#333',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        fontSize: 20,
        color: '#fff',
    },
});
