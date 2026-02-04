import React, { useState } from 'react';
import {View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Modal,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { disputeDetailsStyles } from '../styles/screens/disputeDetailsStyles';

export default function DisputeDetailsScreen({ route, navigation }) {
    const { dispute } = route.params;
    const [selectedImage, setSelectedImage] = useState(null);
    const [resolving, setResolving] = useState(false);

    // TEMPORÁRIO: Valor fixo para debug
    const SCREEN_WIDTH = 375;

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        return `https://fvhnkwxvxnsatqmljnxu.supabase.co/storage/v1/object/public/item_photos/${photoPath}`;
    };

    const handleResolveDispute = () => {
        Alert.alert(
            'Resolver Disputa',
            '¿Cómo deseas resolver esta disputa?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Sin Problema (0%)',
                    onPress: () => resolveDispute(0, 'ok'),
                },
                {
                    text: 'Leve (30%)',
                    onPress: () => resolveDispute(30, 'minor'),
                },
                {
                    text: 'Grave (100%)',
                    onPress: () => resolveDispute(100, 'severe'),
                    style: 'destructive',
                },
            ]
        );
    };

    const resolveDispute = async (percentage, severity) => {
        try {
            setResolving(true);
            const deductionAmount = (dispute.deposit_amount * percentage) / 100;
            const refundAmount = dispute.deposit_amount - deductionAmount;

            const { error: disputeError } = await supabase
                .from('rental_disputes')
                .update({
                    status: 'resolved',
                    severity: severity,
                    deduction_percentage: percentage,
                    deduction_amount: deductionAmount,
                    refund_amount: refundAmount,
                    resolved_at: new Date().toISOString(),
                    admin_reviewed: true,
                })
                .eq('id', dispute.id);

            if (disputeError) throw disputeError;

            const { error: rentalError } = await supabase
                .from('rentals')
                .update({
                    status: 'completed',
                    dispute_resolution: `Resolvido por admin: ${percentage}% retido`,
                    deposit_refunded: refundAmount,
                    deposit_deducted: deductionAmount,
                })
                .eq('id', dispute.rental_id);

            if (rentalError) throw rentalError;

            await supabase
                .from('user_notifications')
                .insert({
                    user_id: dispute.renter_id,
                    type: 'dispute_resolved',
                    title: 'Disputa Resuelta',
                    message: `La disputa fue resuelta. Devolución: €${refundAmount.toFixed(2)}, Retención: €${deductionAmount.toFixed(2)}`,
                    related_id: dispute.id,
                    read: false,
                });

            if (severity === 'severe') {
                await supabase.rpc('increment_dispute_count', { user_id: dispute.renter_id });
            }

            Alert.alert(
                'Éxito',
                'Disputa resuelta correctamente',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao resolver disputa:', error);
            Alert.alert('Error', 'No se pudo resolver la disputa');
        } finally {
            setResolving(false);
        }
    };

    const severityColors = {
        ok: '#10B981',
        minor: '#F59E0B',
        severe: '#EF4444',
    };

    const statusColors = {
        open: '#F59E0B',
        resolved: '#10B981',
        cancelled: '#6B7280',
    };

    return (
        <SafeAreaView style={disputeDetailsStyles.container}>
            {/* Header */}
            <View style={disputeDetailsStyles.header}>
                <TouchableOpacity
                    style={disputeDetailsStyles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={disputeDetailsStyles.headerTitle}>Detalles de la Disputa</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={disputeDetailsStyles.content}>
                {/* Status Badge */}
                <View style={disputeDetailsStyles.statusContainer}>
                    <View style={[disputeDetailsStyles.statusBadge, { backgroundColor: statusColors[dispute.status] + '20' }]}>
                        <Text style={[disputeDetailsStyles.statusText, { color: statusColors[dispute.status] }]}>
                            {dispute.status === 'open' ? 'Abierta' : dispute.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                        </Text>
                    </View>
                </View>

                {/* Item Info */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>📦 Artículo</Text>
                    <View style={disputeDetailsStyles.card}>
                        <Text style={disputeDetailsStyles.itemTitle}>{dispute.item?.title}</Text>
                        <Text style={disputeDetailsStyles.itemSubtitle}>ID: {dispute.item_id}</Text>
                    </View>
                </View>

                {/* Parties */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>👥 Partes Involucradas</Text>
                    <View style={disputeDetailsStyles.card}>
                        <View style={disputeDetailsStyles.partyRow}>
                            <Text style={disputeDetailsStyles.partyLabel}>Propietario (Reportó):</Text>
                            <Text style={disputeDetailsStyles.partyValue}>{dispute.owner?.full_name}</Text>
                        </View>
                        <View style={disputeDetailsStyles.partyRow}>
                            <Text style={disputeDetailsStyles.partyEmail}>{dispute.owner?.email}</Text>
                        </View>

                        <View style={disputeDetailsStyles.divider} />

                        <View style={disputeDetailsStyles.partyRow}>
                            <Text style={disputeDetailsStyles.partyLabel}>Locatario (Acusado):</Text>
                            <Text style={disputeDetailsStyles.partyValue}>{dispute.renter?.full_name}</Text>
                        </View>
                        <View style={disputeDetailsStyles.partyRow}>
                            <Text style={disputeDetailsStyles.partyEmail}>{dispute.renter?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Issues */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>⚠️ Problemas Reportados</Text>
                    <View style={disputeDetailsStyles.card}>
                        {dispute.issue_types?.map((issue, index) => {
                            const icons = {
                                damaged: '💥',
                                incomplete: '📦',
                                dirty: '🧹',
                                not_returned: '❌',
                            };
                            const labels = {
                                damaged: 'Dañado',
                                incomplete: 'Incompleto',
                                dirty: 'Sucio',
                                not_returned: 'No Devuelto',
                            };
                            return (
                                <View key={index} style={disputeDetailsStyles.issueRow}>
                                    <Text style={disputeDetailsStyles.issueIcon}>{icons[issue]}</Text>
                                    <Text style={disputeDetailsStyles.issueText}>{labels[issue]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Observation */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>📝 Observaciones del Propietario</Text>
                    <View style={disputeDetailsStyles.card}>
                        <Text style={disputeDetailsStyles.observationText}>{dispute.observation}</Text>
                    </View>
                </View>

                {/* Photos */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>
                        📸 Fotos de Evidencia ({dispute.photos?.length || 0})
                    </Text>
                    <View style={disputeDetailsStyles.photosContainer}>
                        {dispute.photos?.map((photo, index) => (
                            <TouchableOpacity
                                key={index}
                                style={disputeDetailsStyles.photoWrapper}
                                onPress={() => setSelectedImage(getPhotoUrl(photo))}
                            >
                                <Image
                                    source={{ uri: getPhotoUrl(photo) }}
                                    style={disputeDetailsStyles.photo}
                                    resizeMode="cover"
                                />
                                <View style={disputeDetailsStyles.photoOverlay}>
                                    <Ionicons name="expand" size={24} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Financial Info */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>💰 Información Financiera</Text>
                    <View style={disputeDetailsStyles.card}>
                        <View style={disputeDetailsStyles.financeRow}>
                            <Text style={disputeDetailsStyles.financeLabel}>Valor de la Caución:</Text>
                            <Text style={disputeDetailsStyles.financeValue}>€{dispute.deposit_amount?.toFixed(2)}</Text>
                        </View>

                        {dispute.status === 'resolved' && (
                            <>
                                <View style={disputeDetailsStyles.divider} />
                                <View style={disputeDetailsStyles.financeRow}>
                                    <Text style={disputeDetailsStyles.financeLabel}>Severidad:</Text>
                                    <View style={[disputeDetailsStyles.severityBadge, { backgroundColor: severityColors[dispute.severity] + '20' }]}>
                                        <Text style={[disputeDetailsStyles.severityText, { color: severityColors[dispute.severity] }]}>
                                            {dispute.severity === 'ok' ? 'OK' : dispute.severity === 'minor' ? 'Leve' : 'Grave'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={disputeDetailsStyles.financeRow}>
                                    <Text style={disputeDetailsStyles.financeLabel}>Porcentaje Retenido:</Text>
                                    <Text style={disputeDetailsStyles.financeValue}>{dispute.deduction_percentage}%</Text>
                                </View>
                                <View style={disputeDetailsStyles.financeRow}>
                                    <Text style={disputeDetailsStyles.financeLabel}>Monto Retenido:</Text>
                                    <Text style={[disputeDetailsStyles.financeValue, { color: '#EF4444' }]}>
                                        €{dispute.deduction_amount?.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={disputeDetailsStyles.financeRow}>
                                    <Text style={disputeDetailsStyles.financeLabel}>Monto Devuelto:</Text>
                                    <Text style={[disputeDetailsStyles.financeValue, { color: '#10B981' }]}>
                                        €{dispute.refund_amount?.toFixed(2)}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Dates */}
                <View style={disputeDetailsStyles.section}>
                    <Text style={disputeDetailsStyles.sectionTitle}>📅 Fechas</Text>
                    <View style={disputeDetailsStyles.card}>
                        <View style={disputeDetailsStyles.dateRow}>
                            <Text style={disputeDetailsStyles.dateLabel}>Creada:</Text>
                            <Text style={disputeDetailsStyles.dateValue}>
                                {new Date(dispute.created_at).toLocaleString('es-ES')}
                            </Text>
                        </View>
                        {dispute.resolved_at && (
                            <View style={disputeDetailsStyles.dateRow}>
                                <Text style={disputeDetailsStyles.dateLabel}>Resuelta:</Text>
                                <Text style={disputeDetailsStyles.dateValue}>
                                    {new Date(dispute.resolved_at).toLocaleString('es-ES')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Button */}
                {dispute.status === 'open' && (
                    <TouchableOpacity
                        style={[disputeDetailsStyles.resolveButton, resolving && disputeDetailsStyles.resolveButtonDisabled]}
                        onPress={handleResolveDispute}
                        disabled={resolving}
                    >
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={disputeDetailsStyles.resolveButtonText}>
                            {resolving ? 'Resolviendo...' : 'Resolver Disputa'}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal
                visible={selectedImage !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={disputeDetailsStyles.imageModalOverlay}>
                    <TouchableOpacity
                        style={disputeDetailsStyles.imageModalClose}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close-circle" size={40} color="#fff" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={disputeDetailsStyles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}



