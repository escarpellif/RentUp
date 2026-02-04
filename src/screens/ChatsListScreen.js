import React, { useState, useEffect } from 'react';
import {View, Text, FlatList, TouchableOpacity, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { chatsListStyles } from '../styles/screens/chatsListStyles';

export default function ChatsListScreen({ navigation, session }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();

        // Subscribe to new messages
        const subscription = supabase
            .channel('messages_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            // Buscar todas as mensagens onde eu sou remetente ou destinatário
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    items!messages_item_id_fkey(id, title, photo_url, photos, owner_id),
                    sender:profiles!messages_sender_id_fkey(id, username, full_name),
                    receiver:profiles!messages_receiver_id_fkey(id, username, full_name)
                `)
                .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Agrupar por conversation_id (que é único por item + par de usuários)
            const conversationsMap = new Map();

            messages?.forEach(msg => {
                const convId = msg.conversation_id;

                if (!conversationsMap.has(convId)) {
                    // Determinar quem é o outro usuário
                    const otherUser = msg.sender_id === session.user.id ? msg.receiver : msg.sender;

                    conversationsMap.set(convId, {
                        conversation_id: convId,
                        item: msg.items,
                        other_user: otherUser,
                        last_message: msg.message_text,
                        last_message_time: msg.created_at,
                        unread: !msg.is_read && msg.receiver_id === session.user.id,
                        item_id: msg.item_id,
                    });
                } else {
                    // Atualizar unread count
                    const conv = conversationsMap.get(convId);
                    if (!msg.is_read && msg.receiver_id === session.user.id) {
                        conv.unread = true;
                    }
                }
            });

            setConversations(Array.from(conversationsMap.values()));
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
        }
        setLoading(false);
    };

    const openChat = (conversation) => {
        navigation.navigate('ChatConversation', {
            itemId: conversation.item_id,
            item: conversation.item,
            otherUser: conversation.other_user,
            conversationId: conversation.conversation_id,
        });
    };

    const renderConversation = ({ item }) => {
        const otherUserName = item.other_user?.full_name || item.other_user?.username || 'Usuario';
        const itemTitle = item.item?.title || 'Item';
        const lastMessage = item.last_message || '';
        const time = new Date(item.last_message_time);
        const timeStr = time.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        return (
            <TouchableOpacity
                style={[chatsListStyles.conversationCard, item.unread && chatsListStyles.conversationUnread]}
                onPress={() => openChat(item)}
                activeOpacity={0.7}
            >
                <View style={chatsListStyles.avatarContainer}>
                    <Text style={chatsListStyles.avatarText}>
                        {otherUserName.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={chatsListStyles.conversationContent}>
                    <View style={chatsListStyles.conversationHeader}>
                        <Text style={chatsListStyles.conversationName} numberOfLines={1}>
                            {otherUserName}
                        </Text>
                        <Text style={chatsListStyles.conversationTime}>{timeStr}</Text>
                    </View>
                    <Text style={chatsListStyles.conversationItem} numberOfLines={1}>
                        📦 {itemTitle}
                    </Text>
                    <Text
                        style={[chatsListStyles.conversationMessage, item.unread && chatsListStyles.conversationMessageUnread]}
                        numberOfLines={1}
                    >
                        {lastMessage}
                    </Text>
                </View>

                {item.unread && (
                    <View style={chatsListStyles.unreadDot} />
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={chatsListStyles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={chatsListStyles.header}>
                    <Text style={chatsListStyles.headerTitle}>💬 Chats</Text>
                </View>
                <View style={chatsListStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={chatsListStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={chatsListStyles.header}>
                <TouchableOpacity
                    style={chatsListStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={chatsListStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={chatsListStyles.headerTitle}>💬 Chats</Text>
                <View style={chatsListStyles.headerSpacer} />
            </View>

            {/* Lista de Conversas */}
            {conversations.length === 0 ? (
                <View style={chatsListStyles.emptyContainer}>
                    <Text style={chatsListStyles.emptyIcon}>💬</Text>
                    <Text style={chatsListStyles.emptyTitle}>No hay conversaciones</Text>
                    <Text style={chatsListStyles.emptyText}>
                        Tus conversaciones aparecerán aquí
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.conversation_id}
                    contentContainerStyle={chatsListStyles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}



