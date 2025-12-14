import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Platform, Alert, ImageBackground, KeyboardAvoidingView } from 'react-native';
import { supabase } from '../../supabase';

export default function ChatWindow({ itemId, itemTitle, ownerProfile, ownerProfileId, session, onClose }) {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    // Usar ownerProfileId se fornecido, senão usar ownerProfile.id
    const receiverId = ownerProfileId || ownerProfile?.id;
    const conversationId = receiverId && session?.user?.id ? [session.user.id, receiverId].sort().join('_') : '';

    const fetchMessages = useCallback(async () => {
        if (!conversationId || !itemId || !session?.user?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('item_id', itemId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Marcar mensagens como lidas
            if (data && data.length > 0) {
                await supabase
                    .from('messages')
                    .update({ read: true })
                    .eq('conversation_id', conversationId)
                    .eq('item_id', itemId)
                    .neq('sender_id', session.user.id);
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, itemId, session?.user?.id]);

    const subscribeToMessagesCallback = useCallback(() => {
        if (!conversationId || !itemId) return () => {};

        const subscription = supabase
            .channel(`chat:${conversationId}:${itemId}`)
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
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId, itemId]);

    useEffect(() => {
        fetchMessages();
        return subscribeToMessagesCallback();
    }, [fetchMessages, subscribeToMessagesCallback]);

    // Validação
    if (!receiverId || !session?.user?.id) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: Información del usuario incompleta</Text>
            </View>
        );
    }

    // Determinar qual é o ID da conversa (sempre ordenado para ser único)

    const sendMessage = async () => {
        if (!messageText.trim() || !session?.user?.id) {
            return;
        }

        setSending(true);
        try {
            // Inserir mensagem
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    item_id: itemId,
                    sender_id: session.user.id,
                    receiver_id: receiverId,
                    message_text: messageText.trim(),
                });

            if (messageError) throw messageError;

            // Buscar informações do remetente para a notificação
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', session.user.id)
                .single();

            const senderName = senderProfile?.full_name || senderProfile?.username || 'Alguien';

            // Criar notificação para o destinatário
            const { error: notificationError } = await supabase
                .from('user_notifications')
                .insert({
                    user_id: receiverId,
                    type: 'new_message',
                    title: `Nuevo mensaje`,
                    message: `${senderName} te ha enviado un mensaje en el chat`,
                    related_id: itemId,
                    read: false,
                });

            if (notificationError) {
                console.error('Erro ao criar notificação:', notificationError);
            }

            setMessageText('');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            Alert.alert('Error', 'Não foi possível enviar a mensagem');
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isCurrentUser = item.sender_id === session?.user?.id;

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2c4455" />
                <Text style={styles.loadingText}>Cargando mensajes...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ImageBackground
                source={require('../../assets/images/chat-bg.png')}
                style={styles.backgroundContainer}
                imageStyle={styles.backgroundImage}
            >
                {/* Header del Chat */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitle}>
                            <Text style={styles.headerItemTitle} numberOfLines={1}>{itemTitle}</Text>
                            <Text style={styles.headerUserName}>{ownerProfile.username || 'Usuario'}</Text>
                        </View>
                    </View>
                </View>

                {/* Mensajes */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input de Mensagem */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escriba un mensaje..."
                        placeholderTextColor="#999"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxHeight={100}
                        editable={!sending}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!messageText.trim() || sending}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sendButtonText}>{sending ? '...' : '📤'}</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
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

