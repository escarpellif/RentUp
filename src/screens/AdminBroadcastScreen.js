import React, { useState } from 'react';
import {View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { adminBroadcastStyles } from '../styles/screens/adminBroadcastStyles';

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
                adminBroadcastStyles.recipientButton,
                messageType === type && adminBroadcastStyles.recipientButtonActive,
            ]}
            onPress={() => setMessageType(type)}
        >
            <View style={adminBroadcastStyles.recipientButtonLeft}>
                <View
                    style={[
                        adminBroadcastStyles.recipientIcon,
                        messageType === type && adminBroadcastStyles.recipientIconActive,
                    ]}
                >
                    <Ionicons
                        name={icon}
                        size={24}
                        color={messageType === type ? '#3B82F6' : '#6B7280'}
                    />
                </View>
                <View style={adminBroadcastStyles.recipientText}>
                    <Text
                        style={[
                            adminBroadcastStyles.recipientLabel,
                            messageType === type && adminBroadcastStyles.recipientLabelActive,
                        ]}
                    >
                        {label}
                    </Text>
                    <Text style={adminBroadcastStyles.recipientDescription}>{description}</Text>
                </View>
            </View>
            {messageType === type && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={adminBroadcastStyles.container}>
            {/* Header */}
            <View style={adminBroadcastStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={adminBroadcastStyles.headerTitle}>Mensaje Masivo</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={adminBroadcastStyles.content}>
                {/* Destinatarios */}
                <View style={adminBroadcastStyles.section}>
                    <Text style={adminBroadcastStyles.sectionTitle}>📢 Destinatarios</Text>
                    <View style={adminBroadcastStyles.recipientsContainer}>
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
                <View style={adminBroadcastStyles.section}>
                    <Text style={adminBroadcastStyles.sectionTitle}>✉️ Mensaje</Text>
                    <View style={adminBroadcastStyles.messageContainer}>
                        {/* Asunto */}
                        <View style={adminBroadcastStyles.inputGroup}>
                            <Text style={adminBroadcastStyles.inputLabel}>Asunto</Text>
                            <TextInput
                                style={adminBroadcastStyles.subjectInput}
                                placeholder="Ej: Actualización importante de la plataforma"
                                value={subject}
                                onChangeText={setSubject}
                                maxLength={100}
                            />
                            <Text style={adminBroadcastStyles.charCount}>{subject.length}/100</Text>
                        </View>

                        {/* Mensaje */}
                        <View style={adminBroadcastStyles.inputGroup}>
                            <Text style={adminBroadcastStyles.inputLabel}>Mensaje</Text>
                            <TextInput
                                style={adminBroadcastStyles.messageInput}
                                placeholder="Escribe tu mensaje aquí..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={8}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                            <Text style={adminBroadcastStyles.charCount}>{message.length}/500</Text>
                        </View>

                        {/* Preview */}
                        {(subject || message) && (
                            <View style={adminBroadcastStyles.previewContainer}>
                                <Text style={adminBroadcastStyles.previewLabel}>Vista Previa:</Text>
                                <View style={adminBroadcastStyles.preview}>
                                    <Text style={adminBroadcastStyles.previewSubject}>
                                        {subject || 'Sin asunto'}
                                    </Text>
                                    <Text style={adminBroadcastStyles.previewMessage}>
                                        {message || 'Sin mensaje'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Botão de Enviar */}
                <View style={adminBroadcastStyles.sendButtonContainer}>
                    <TouchableOpacity
                        style={[adminBroadcastStyles.sendButton, sending && adminBroadcastStyles.sendButtonDisabled]}
                        onPress={sendBroadcast}
                        disabled={sending}
                    >
                        <Ionicons
                            name={sending ? 'hourglass' : 'send'}
                            size={20}
                            color="#fff"
                        />
                        <Text style={adminBroadcastStyles.sendButtonText}>
                            {sending ? 'Enviando...' : `Enviar a ${getRecipientLabel()}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={adminBroadcastStyles.infoContainer}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={adminBroadcastStyles.infoText}>
                        Los usuarios recibirán este mensaje como notificación en la app.
                        Usa este canal con responsabilidad.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}



