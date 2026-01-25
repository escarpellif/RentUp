import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { handleApiError } from '../utils/errorHandler';
import { withTimeout } from '../utils/apiHelpers';

export default function ChatConversationScreen({ route, navigation, session }) {
    const { itemId, item, otherUser, conversationId } = route.params;

    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        markMessagesAsRead();

        // Subscribe to new messages
        const subscription = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                    flatListRef.current?.scrollToEnd({ animated: true });

                    // Marcar como lida se é mensagem recebida
                    if (payload.new.receiver_id === session.user.id) {
                        markMessageAsRead(payload.new.id);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const query = supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            const result = await withTimeout(query, 10000);

            if (result.error) throw result.error;
            setMessages(result.data || []);
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            handleApiError(error, () => fetchMessages());
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        try {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .eq('receiver_id', session.user.id)
                .eq('is_read', false);
        } catch (error) {
            console.error('Erro ao marcar mensagens como lidas:', error);
        }
    };

    const markMessageAsRead = async (messageId) => {
        try {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', messageId);
        } catch (error) {
            console.error('Erro ao marcar mensagem como lida:', error);
        }
    };

    const sendMessage = async () => {
        if (!messageText.trim()) return;

        setSending(true);
        try {
            // Inserir mensagem
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    item_id: itemId,
                    sender_id: session.user.id,
                    receiver_id: otherUser.id,
                    message_text: messageText.trim(),
                    is_read: false,
                });

            if (messageError) throw messageError;

            // Buscar informações do remetente
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', session.user.id)
                .single();

            const senderName = senderProfile?.full_name || senderProfile?.username || 'Alguien';

            // Verificar se já existe uma notificação não lida deste chat
            const { data: existingNotif } = await supabase
                .from('user_notifications')
                .select('id')
                .eq('user_id', otherUser.id)
                .eq('type', 'new_message')
                .eq('related_id', itemId)
                .eq('read', false)
                .single();

            // Criar notificação apenas se não existir uma não lida
            if (!existingNotif) {
                await supabase
                    .from('user_notifications')
                    .insert({
                        user_id: otherUser.id,
                        type: 'new_message',
                        title: `Nuevo mensaje`,
                        message: `${senderName} te ha enviado un mensaje`,
                        related_id: itemId,
                        read: false,
                    });
            }

            setMessageText('');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isCurrentUser = item.sender_id === session.user.id;

        return (
            <View style={[styles.messageRow, isCurrentUser ? styles.messageRowRight : styles.messageRowLeft]}>
                <View
                    style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.messageBubbleCurrentUser : styles.messageBubbleOtherUser,
                    ]}
                >
                    <Text style={[styles.messageText, isCurrentUser ? styles.messageTextLight : styles.messageTextDark]}>
                        {item.message_text}
                    </Text>
                    <Text style={[styles.messageTime, isCurrentUser ? styles.messageTimeLight : styles.messageTimeDark]}>
                        {new Date(item.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    const otherUserName = otherUser?.full_name || otherUser?.username || 'Usuario';
    const itemTitle = item?.title || 'Item';

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                    <Text style={styles.loadingText}>Cargando mensajes...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{otherUserName}</Text>
                    <Text style={styles.headerItem} numberOfLines={1}>📦 {itemTitle}</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.chatContainer}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!messageText.trim() || sending}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sendButtonText}>
                            {sending ? '...' : '➤'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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

