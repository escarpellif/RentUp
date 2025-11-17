import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

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
                style={[styles.conversationCard, item.unread && styles.conversationUnread]}
                onPress={() => openChat(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {otherUserName.charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.conversationName} numberOfLines={1}>
                            {otherUserName}
                        </Text>
                        <Text style={styles.conversationTime}>{timeStr}</Text>
                    </View>
                    <Text style={styles.conversationItem} numberOfLines={1}>
                        📦 {itemTitle}
                    </Text>
                    <Text
                        style={[styles.conversationMessage, item.unread && styles.conversationMessageUnread]}
                        numberOfLines={1}
                    >
                        {lastMessage}
                    </Text>
                </View>

                {item.unread && (
                    <View style={styles.unreadDot} />
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>💬 Chats</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
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
                <Text style={styles.headerTitle}>💬 Chats</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Lista de Conversas */}
            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>💬</Text>
                    <Text style={styles.emptyTitle}>No hay conversaciones</Text>
                    <Text style={styles.emptyText}>
                        Tus conversaciones aparecerán aquí
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.conversation_id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    backArrow: {
        fontSize: 22,
        color: '#333',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c4455',
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
        gap: 12,
    },
    conversationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    conversationUnread: {
        backgroundColor: '#F0F8FF',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2c4455',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    conversationTime: {
        fontSize: 12,
        color: '#999',
        marginLeft: 8,
    },
    conversationItem: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    conversationMessage: {
        fontSize: 14,
        color: '#666',
    },
    conversationMessageUnread: {
        fontWeight: '600',
        color: '#333',
    },
    unreadDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        marginLeft: 8,
        marginTop: 4,
    },
});

