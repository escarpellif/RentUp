import React, { useState, useEffect, useRef } from 'react';
import {View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { handleApiError } from '../utils/errorHandler';
import { withTimeout } from '../utils/apiHelpers';
import { chatConversationStyles } from '../styles/screens/chatConversationStyles';

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
            <View style={[chatConversationStyles.messageRow, isCurrentUser ? chatConversationStyles.messageRowRight : chatConversationStyles.messageRowLeft]}>
                <View
                    style={[
                        chatConversationStyles.messageBubble,
                        isCurrentUser ? chatConversationStyles.messageBubbleCurrentUser : chatConversationStyles.messageBubbleOtherUser,
                    ]}
                >
                    <Text style={[chatConversationStyles.messageText, isCurrentUser ? chatConversationStyles.messageTextLight : chatConversationStyles.messageTextDark]}>
                        {item.message_text}
                    </Text>
                    <Text style={[chatConversationStyles.messageTime, isCurrentUser ? chatConversationStyles.messageTimeLight : chatConversationStyles.messageTimeDark]}>
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
            <SafeAreaView style={chatConversationStyles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={chatConversationStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                    <Text style={chatConversationStyles.loadingText}>Cargando mensajes...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={chatConversationStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={chatConversationStyles.header}>
                <TouchableOpacity
                    style={chatConversationStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={chatConversationStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={chatConversationStyles.headerInfo}>
                    <Text style={chatConversationStyles.headerName}>{otherUserName}</Text>
                    <Text style={chatConversationStyles.headerItem} numberOfLines={1}>📦 {itemTitle}</Text>
                </View>
                <View style={chatConversationStyles.headerSpacer} />
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={chatConversationStyles.chatContainer}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={chatConversationStyles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input */}
                <View style={chatConversationStyles.inputContainer}>
                    <TextInput
                        style={chatConversationStyles.input}
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[chatConversationStyles.sendButton, (!messageText.trim() || sending) && chatConversationStyles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!messageText.trim() || sending}
                        activeOpacity={0.7}
                    >
                        <Text style={chatConversationStyles.sendButtonText}>
                            {sending ? '...' : '➤'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}



