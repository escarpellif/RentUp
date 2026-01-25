import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import PermissionManager from '../utils/PermissionManager';

export default function ReturnDisputeModal({
    visible,
    onClose,
    rental,
    onDisputeCreated,
}) {
    const { t } = useTranslation();
    const [issueType, setIssueType] = useState([]);
    const [observation, setObservation] = useState('');
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    const issueTypes = [
        { id: 'damaged', label: t('dispute.damaged'), emoji: '💥' },
        { id: 'incomplete', label: t('dispute.incomplete'), emoji: '📦' },
        { id: 'dirty', label: t('dispute.dirty'), emoji: '🧹' },
        { id: 'not_returned', label: t('dispute.notReturned'), emoji: '❌' },
    ];

    const toggleIssueType = (type) => {
        if (issueType.includes(type)) {
            setIssueType(issueType.filter(t => t !== type));
        } else {
            setIssueType([...issueType, type]);
        }
    };

    const pickImage = async () => {
        if (photos.length >= 5) {
            Alert.alert(t('common.error'), t('dispute.maxPhotos'));
            return;
        }

        // Usar PermissionManager para pedir permissão com explicação
        const hasPermission = await PermissionManager.requestPhotoLibrary('dispute', {
            component: 'ReturnDisputeModal',
            action: 'pickImage'
        });

        if (!hasPermission) {
            return; // Usuário negou ou cancelou
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false,
            quality: 0.8,
            aspect: [4, 3],
        });

        if (!result.canceled && result.assets[0]) {
            setPhotos([...photos, result.assets[0]]);
        }
    };

    const removePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const uploadPhotos = async () => {
        const uploadedUrls = [];

        for (const photo of photos) {
            try {
                // Ler a imagem como base64
                const base64 = await FileSystem.readAsStringAsync(photo.uri, {
                    encoding: 'base64'
                });

                const fileName = `dispute_${rental.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                const filePath = `${rental.owner_id}/${fileName}`;

                // Upload para o bucket item_photos (mesmo bucket usado para fotos de itens)
                const { error } = await supabase.storage
                    .from('item_photos')
                    .upload(filePath, decode(base64), {
                        contentType: 'image/jpeg',
                        upsert: false,
                    });

                if (error) {
                    console.error('Erro ao fazer upload da foto:', error);
                    throw error;
                }

                uploadedUrls.push(filePath);
            } catch (err) {
                console.error('Erro ao processar foto:', err);
                throw err;
            }
        }

        return uploadedUrls;
    };

    const handleSubmitDispute = async () => {
        // Validações
        if (issueType.length === 0) {
            Alert.alert(t('common.error'), t('dispute.selectIssue'));
            return;
        }

        if (photos.length === 0) {
            Alert.alert(t('common.error'), t('dispute.photoRequired'));
            return;
        }

        if (!observation.trim()) {
            Alert.alert(t('common.error'), t('dispute.observationRequired'));
            return;
        }

        if (observation.length > 500) {
            Alert.alert(t('common.error'), t('dispute.observationTooLong'));
            return;
        }

        setUploading(true);

        try {
            // Upload das fotos
            const photoUrls = await uploadPhotos();

            // Calcular severidade automaticamente
            const severity = calculateSeverity(issueType, observation);

            // Criar disputa
            const { data: dispute, error: disputeError } = await supabase
                .from('rental_disputes')
                .insert({
                    rental_id: rental.id,
                    item_id: rental.item_id,
                    owner_id: rental.owner_id,
                    renter_id: rental.renter_id,
                    issue_types: issueType,
                    observation: observation.trim(),
                    photos: photoUrls,
                    severity: severity,
                    status: 'open',
                    deposit_amount: rental.deposit_amount || 0,
                })
                .select()
                .single();

            if (disputeError) throw disputeError;

            // Atualizar status do rental
            const { error: rentalError } = await supabase
                .from('rentals')
                .update({
                    status: 'dispute_open',
                })
                .eq('id', rental.id);

            if (rentalError) throw rentalError;

            // Enviar email para suporte
            await sendDisputeEmailToSupport(dispute, photoUrls);

            // Notificar locatário
            await supabase
                .from('user_notifications')
                .insert({
                    user_id: rental.renter_id,
                    type: 'dispute_created',
                    title: t('dispute.disputeCreated'),
                    message: t('dispute.disputeUnderReview', { item: rental.item.title }),
                    related_id: dispute.id,
                    read: false,
                });

            Alert.alert(
                t('common.success'),
                t('dispute.disputeSubmittedToSupport'),
                [{
                    text: 'OK',
                    onPress: () => {
                        onDisputeCreated();
                        resetForm();
                        onClose();
                    }
                }]
            );

        } catch (error) {
            console.error('Erro ao criar disputa:', error);
            Alert.alert(t('common.error'), t('dispute.submitError'));
        } finally {
            setUploading(false);
        }
    };

    const calculateSeverity = (issues, obs) => {
        // Se não devolvido = sempre GRAVE
        if (issues.includes('not_returned')) {
            return 'severe';
        }

        // Se danificado E tem palavras-chave graves
        const severeKeywords = ['quebrado', 'roto', 'destruido', 'inutilizable', 'destroyed', 'broken', 'unusable'];
        const hasSevereKeyword = severeKeywords.some(keyword =>
            obs.toLowerCase().includes(keyword)
        );

        if (issues.includes('damaged') && hasSevereKeyword) {
            return 'severe';
        }

        // Se incompleto ou danificado (sem palavras graves) = LEVE
        if (issues.includes('damaged') || issues.includes('incomplete')) {
            return 'minor';
        }

        // Se apenas sujo = OK
        if (issues.includes('dirty') && issues.length === 1) {
            return 'ok';
        }

        // Default
        return 'minor';
    };

    const sendDisputeEmailToSupport = async (dispute, photoUrls) => {
        try {
            // Montar corpo do email com todas as informações
            const issueTypesText = dispute.issue_types.map(type => {
                const labels = {
                    'damaged': '💥 Dañado / Damaged',
                    'incomplete': '📦 Incompleto / Incomplete',
                    'dirty': '🧹 Sucio / Dirty',
                    'not_returned': '❌ No Devuelto / Not Returned'
                };
                return labels[type] || type;
            }).join(', ');

            const severityText = {
                'ok': '✅ OK (Sin problema)',
                'minor': '⚠️ LEVE (30% caução)',
                'severe': '🚨 GRAVE (100% caução)'
            }[dispute.severity] || dispute.severity;

            // URLs completas das fotos
            const photoLinks = photoUrls.map((url, index) =>
                `Foto ${index + 1}: https://fvhnkwxvxnsatqmljnxu.supabase.co/storage/v1/object/public/item_photos/${url}`
            ).join('\n');

            const emailBody = `
🚨 NOVA DISPUTA DE DEVOLUÇÃO - ALUKO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMAÇÕES DA DISPUTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ID da Disputa: ${dispute.id}
• ID da Locação: ${dispute.rental_id}
• Data/Hora: ${new Date().toLocaleString('es-ES')}

📦 INFORMAÇÕES DO ITEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Item: ${rental.item?.title || 'N/A'}
• ID do Item: ${dispute.item_id}

👥 PARTES ENVOLVIDAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Proprietário (Reportou): ${rental.owner?.full_name || 'N/A'}
• ID Proprietário: ${dispute.owner_id}

• Locatário (Acusado): ${rental.renter?.full_name || 'N/A'}
• ID Locatário: ${dispute.renter_id}

⚠️ PROBLEMAS REPORTADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${issueTypesText}

📝 OBSERVAÇÕES DO PROPRIETÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${dispute.observation}

📊 ANÁLISE AUTOMÁTICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Severidade: ${severityText}

💰 VALORES FINANCEIROS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Valor da Caução: €${dispute.deposit_amount?.toFixed(2) || '0.00'}

📸 FOTOS DE EVIDÊNCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de fotos: ${photoUrls.length}

${photoLinks}

🔗 LINKS ÚTEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Ver Disputa no Admin: [Implementar link do admin]
• Ver Locação: [Implementar link]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este é um email automático gerado pelo sistema ALUKO.
Para processar esta disputa, acesse o painel administrativo.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `.trim();

            // Usar Supabase Edge Function ou serviço de email
            // Por enquanto, salvar no banco para o admin processar
            await supabase
                .from('admin_notifications')
                .insert({
                    user_id: null, // Notificação do sistema
                    type: 'dispute_pending',
                    title: `Nova Disputa: ${rental.item?.title}`,
                    message: emailBody,
                    related_id: dispute.id,
                    read: false,
                });

            console.log('📧 Email de disputa preparado para envio ao suporte');
            console.log('Support Email: support@aluko.io');
            console.log('Dispute ID:', dispute.id);

        } catch (error) {
            console.error('Erro ao enviar email para suporte:', error);
            // Não bloquear o fluxo se o email falhar
        }
    };

    const resetForm = () => {
        setIssueType([]);
        setObservation('');
        setPhotos([]);
    };

    if (!rental) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContainer}>
                        {/* Header com botão X fixo */}
                        <View style={styles.header}>
                            <View style={styles.headerContent}>
                                <Text style={styles.headerIcon}>⚠️</Text>
                                <Text style={styles.headerTitle}>{t('dispute.reportProblem')}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Conteúdo scrollável */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Item Info */}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemTitle}>{rental.item?.title}</Text>
                                <Text style={styles.itemSubtitle}>
                                    {t('dispute.renter')}: {rental.renter?.full_name}
                                </Text>
                            </View>

                            {/* Tipo de Problema */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{t('dispute.issueType')}</Text>
                                <Text style={styles.sectionSubtitle}>{t('dispute.selectAll')}</Text>

                                <View style={styles.issueTypesContainer}>
                                    {issueTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.issueTypeButton,
                                                issueType.includes(type.id) && styles.issueTypeButtonActive
                                            ]}
                                            onPress={() => toggleIssueType(type.id)}
                                        >
                                            <Text style={styles.issueTypeEmoji}>{type.emoji}</Text>
                                            <Text style={[
                                                styles.issueTypeText,
                                                issueType.includes(type.id) && styles.issueTypeTextActive
                                            ]}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Fotos */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{t('dispute.photos')} *</Text>
                                <Text style={styles.sectionSubtitle}>{t('dispute.photosRequired')}</Text>

                                <View style={styles.photosContainer}>
                                    {photos.map((photo, index) => (
                                        <View key={index} style={styles.photoWrapper}>
                                            <Image source={{ uri: photo.uri }} style={styles.photo} />
                                            <TouchableOpacity
                                                style={styles.removePhotoButton}
                                                onPress={() => removePhoto(index)}
                                            >
                                                <Text style={styles.removePhotoText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {photos.length < 5 && (
                                        <TouchableOpacity
                                            style={styles.addPhotoButton}
                                            onPress={pickImage}
                                        >
                                            <Text style={styles.addPhotoIcon}>📷</Text>
                                            <Text style={styles.addPhotoText}>{t('dispute.addPhoto')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Observação */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{t('dispute.observation')} *</Text>
                                <Text style={styles.sectionSubtitle}>
                                    {t('dispute.observationLimit')} ({observation.length}/500)
                                </Text>

                                <TextInput
                                    style={styles.observationInput}
                                    value={observation}
                                    onChangeText={setObservation}
                                    placeholder={t('dispute.observationPlaceholder')}
                                    placeholderTextColor="#999"
                                    multiline
                                    maxLength={500}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Aviso sobre caução */}
                            <View style={styles.warningBox}>
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <View style={styles.warningContent}>
                                    <Text style={styles.warningTitle}>{t('dispute.depositWarning')}</Text>
                                    <Text style={styles.warningText}>
                                        {t('dispute.depositInfo', { amount: rental.deposit_amount?.toFixed(2) || '0.00' })}
                                    </Text>
                                </View>
                            </View>

                            {/* Botões */}
                            <View style={styles.buttonsContainer}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}
                                    disabled={uploading}
                                >
                                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        uploading && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleSubmitDispute}
                                    disabled={uploading}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {uploading ? t('dispute.submitting') : t('dispute.submit')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '92%',
        maxHeight: '85%',
        maxWidth: 500,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FEF2F2',
        borderBottomWidth: 2,
        borderBottomColor: '#FECACA',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#DC2626',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#DC2626',
        fontWeight: 'bold',
    },
    itemInfo: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 15,
    },
    issueTypesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    issueTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        gap: 8,
    },
    issueTypeButtonActive: {
        borderColor: '#DC2626',
        backgroundColor: '#FEE2E2',
    },
    issueTypeEmoji: {
        fontSize: 20,
    },
    issueTypeText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    issueTypeTextActive: {
        color: '#DC2626',
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removePhotoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    addPhotoIcon: {
        fontSize: 30,
        marginBottom: 5,
    },
    addPhotoText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    observationInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 15,
        fontSize: 14,
        color: '#1F2937',
        minHeight: 120,
        backgroundColor: '#F9FAFB',
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#92400E',
        marginBottom: 5,
    },
    warningText: {
        fontSize: 13,
        color: '#92400E',
    },
    buttonsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: '#DC2626',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#FCA5A5',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});


