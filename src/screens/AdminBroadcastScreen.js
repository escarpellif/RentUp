import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

export default function AdminBroadcastScreen({ navigation }) {
    const [messageType, setMessageType] = useState('all'); // all, verified, problematic, active_rentals
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const sendBroadcast = async () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert('Error', 'Por favor completa el asunto y el mensaje');
            return;
        }

        Alert.alert(
            'Confirmar Envío',
            `¿Enviar mensaje a: ${getRecipientLabel()}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Enviar',
                    onPress: async () => {
                        try {
                            setSending(true);

                            // Obtener destinatarios según el tipo
                            let query = supabase.from('profiles').select('id, email, full_name');

                            switch (messageType) {
                                case 'verified':
                                    query = query.eq('verification_status', 'approved');
                                    break;
                                case 'problematic':
                                    query = query.eq('problematic_user', true);
                                    break;
                                case 'active_rentals':
                                    // Usuários com locações ativas
                                    const { data: activeRentals } = await supabase
                                        .from('rentals')
                                        .select('renter_id, owner_id')
                                        .eq('status', 'active');

                                    const userIds = new Set();
                                    activeRentals?.forEach(r => {
                                        userIds.add(r.renter_id);
                                        userIds.add(r.owner_id);
                                    });

                                    query = query.in('id', Array.from(userIds));
                                    break;
                            }

                            const { data: users, error } = await query;

                            if (error) throw error;

                            // Criar notificação para cada usuário
                            const notifications = users.map(user => ({
                                user_id: user.id,
                                type: 'broadcast',
                                title: subject,
                                message: message,
                                read: false,
                                created_at: new Date().toISOString(),
                            }));

                            const { error: notifError } = await supabase
                                .from('user_notifications')
                                .insert(notifications);

                            if (notifError) throw notifError;

                            Alert.alert(
                                'Éxito',
                                `Mensaje enviado a ${users.length} usuario(s)`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            setSubject('');
                                            setMessage('');
                                        },
                                    },
                                ]
                            );
                        } catch (error) {
                            console.error('Error sending broadcast:', error);
                            Alert.alert('Error', 'No se pudo enviar el mensaje');
                        } finally {
                            setSending(false);
                        }
                    },
                },
            ]
        );
    };

    const getRecipientLabel = () => {
        switch (messageType) {
            case 'all':
                return 'Todos los usuarios';
            case 'verified':
                return 'Usuarios verificados';
            case 'problematic':
                return 'Usuarios problemáticos';
            case 'active_rentals':
                return 'Usuarios con locaciones activas';
            default:
                return 'Usuarios';
        }
    };

    const RecipientButton = ({ type, icon, label, description }) => (
        <TouchableOpacity
            style={[
                styles.recipientButton,
                messageType === type && styles.recipientButtonActive,
            ]}
            onPress={() => setMessageType(type)}
        >
            <View style={styles.recipientButtonLeft}>
                <View
                    style={[
                        styles.recipientIcon,
                        messageType === type && styles.recipientIconActive,
                    ]}
                >
                    <Ionicons
                        name={icon}
                        size={24}
                        color={messageType === type ? '#3B82F6' : '#6B7280'}
                    />
                </View>
                <View style={styles.recipientText}>
                    <Text
                        style={[
                            styles.recipientLabel,
                            messageType === type && styles.recipientLabelActive,
                        ]}
                    >
                        {label}
                    </Text>
                    <Text style={styles.recipientDescription}>{description}</Text>
                </View>
            </View>
            {messageType === type && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mensaje Masivo</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Destinatarios */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📢 Destinatarios</Text>
                    <View style={styles.recipientsContainer}>
                        <RecipientButton
                            type="all"
                            icon="people"
                            label="Todos los Usuarios"
                            description="Enviar a toda la comunidad"
                        />
                        <RecipientButton
                            type="verified"
                            icon="checkmark-circle"
                            label="Usuarios Verificados"
                            description="Solo usuarios con verificación aprobada"
                        />
                        <RecipientButton
                            type="problematic"
                            icon="warning"
                            label="Usuarios Problemáticos"
                            description="Usuarios marcados como problemáticos"
                        />
                        <RecipientButton
                            type="active_rentals"
                            icon="repeat"
                            label="Con Locaciones Activas"
                            description="Usuarios con locaciones en curso"
                        />
                    </View>
                </View>

                {/* Mensaje */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✉️ Mensaje</Text>
                    <View style={styles.messageContainer}>
                        {/* Asunto */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Asunto</Text>
                            <TextInput
                                style={styles.subjectInput}
                                placeholder="Ej: Actualización importante de la plataforma"
                                value={subject}
                                onChangeText={setSubject}
                                maxLength={100}
                            />
                            <Text style={styles.charCount}>{subject.length}/100</Text>
                        </View>

                        {/* Mensaje */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mensaje</Text>
                            <TextInput
                                style={styles.messageInput}
                                placeholder="Escribe tu mensaje aquí..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={8}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{message.length}/500</Text>
                        </View>

                        {/* Preview */}
                        {(subject || message) && (
                            <View style={styles.previewContainer}>
                                <Text style={styles.previewLabel}>Vista Previa:</Text>
                                <View style={styles.preview}>
                                    <Text style={styles.previewSubject}>
                                        {subject || 'Sin asunto'}
                                    </Text>
                                    <Text style={styles.previewMessage}>
                                        {message || 'Sin mensaje'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Botão de Enviar */}
                <View style={styles.sendButtonContainer}>
                    <TouchableOpacity
                        style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                        onPress={sendBroadcast}
                        disabled={sending}
                    >
                        <Ionicons
                            name={sending ? 'hourglass' : 'send'}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.sendButtonText}>
                            {sending ? 'Enviando...' : `Enviar a ${getRecipientLabel()}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        Los usuarios recibirán este mensaje como notificación en la app.
                        Usa este canal con responsabilidad.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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

