import React, { useState, useEffect, useRef, useCallback } from 'react';
import {View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Platform, Alert, ImageBackground, KeyboardAvoidingView } from 'react-native';
import { supabase } from '../../supabase';
import { chatWindowStyles } from '../styles/components/chatWindowStyles';

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
            <View style={chatWindowStyles.container}>
                <Text style={chatWindowStyles.errorText}>Error: Información del usuario incompleta</Text>
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
            <View style={[chatWindowStyles.messageRow, isCurrentUser ? chatWindowStyles.messageRowRight : chatWindowStyles.messageRowLeft]}>
                <View
                    style={[
                        chatWindowStyles.messageBubble,
                        isCurrentUser ? chatWindowStyles.messageBubbleCurrentUser : chatWindowStyles.messageBubbleOtherUser,
                    ]}
                >
                    <Text style={[chatWindowStyles.messageText, isCurrentUser ? chatWindowStyles.messageTextLight : chatWindowStyles.messageTextDark]}>
                        {item.message_text}
                    </Text>
                    <Text style={[chatWindowStyles.messageTime, isCurrentUser ? chatWindowStyles.messageTimeLight : chatWindowStyles.messageTimeDark]}>
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
            <View style={chatWindowStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#2c4455" />
                <Text style={chatWindowStyles.loadingText}>Cargando mensajes...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={chatWindowStyles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ImageBackground
                source={require('../../assets/images/chat-bg.png')}
                style={chatWindowStyles.backgroundContainer}
                imageStyle={chatWindowStyles.backgroundImage}
            >
                {/* Header del Chat */}
                <View style={chatWindowStyles.header}>
                    <View style={chatWindowStyles.headerContent}>
                        <TouchableOpacity onPress={onClose} style={chatWindowStyles.closeButton}>
                            <Text style={chatWindowStyles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                        <View style={chatWindowStyles.headerTitle}>
                            <Text style={chatWindowStyles.headerItemTitle} numberOfLines={1}>{itemTitle}</Text>
                            <Text style={chatWindowStyles.headerUserName}>{ownerProfile.username || 'Usuario'}</Text>
                        </View>
                    </View>
                </View>

                {/* Mensajes */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={chatWindowStyles.messagesList}
                    contentContainerStyle={chatWindowStyles.messagesContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input de Mensagem */}
                <View style={chatWindowStyles.inputContainer}>
                    <TextInput
                        style={chatWindowStyles.input}
                        placeholder="Escriba un mensaje..."
                        placeholderTextColor="#999"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxHeight={100}
                        editable={!sending}
                    />
                    <TouchableOpacity
                        style={[chatWindowStyles.sendButton, (!messageText.trim() || sending) && chatWindowStyles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!messageText.trim() || sending}
                        activeOpacity={0.7}
                    >
                        <Text style={chatWindowStyles.sendButtonText}>{sending ? '...' : '📤'}</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}



