import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DisputeDetailsScreen({ route, navigation }) {
    const { dispute } = route.params;
    const [selectedImage, setSelectedImage] = useState(null);
    const [resolving, setResolving] = useState(false);

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
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalles de la Disputa</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[dispute.status] + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColors[dispute.status] }]}>
                            {dispute.status === 'open' ? 'Abierta' : dispute.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                        </Text>
                    </View>
                </View>

                {/* Item Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📦 Artículo</Text>
                    <View style={styles.card}>
                        <Text style={styles.itemTitle}>{dispute.item?.title}</Text>
                        <Text style={styles.itemSubtitle}>ID: {dispute.item_id}</Text>
                    </View>
                </View>

                {/* Parties */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Partes Involucradas</Text>
                    <View style={styles.card}>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Propietario (Reportó):</Text>
                            <Text style={styles.partyValue}>{dispute.owner?.full_name}</Text>
                        </View>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyEmail}>{dispute.owner?.email}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.partyRow}>
                            <Text style={styles.partyLabel}>Locatario (Acusado):</Text>
                            <Text style={styles.partyValue}>{dispute.renter?.full_name}</Text>
                        </View>
                        <View style={styles.partyRow}>
                            <Text style={styles.partyEmail}>{dispute.renter?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Issues */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚠️ Problemas Reportados</Text>
                    <View style={styles.card}>
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
                                <View key={index} style={styles.issueRow}>
                                    <Text style={styles.issueIcon}>{icons[issue]}</Text>
                                    <Text style={styles.issueText}>{labels[issue]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Observation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Observaciones del Propietario</Text>
                    <View style={styles.card}>
                        <Text style={styles.observationText}>{dispute.observation}</Text>
                    </View>
                </View>

                {/* Photos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        📸 Fotos de Evidencia ({dispute.photos?.length || 0})
                    </Text>
                    <View style={styles.photosContainer}>
                        {dispute.photos?.map((photo, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.photoWrapper}
                                onPress={() => setSelectedImage(getPhotoUrl(photo))}
                            >
                                <Image
                                    source={{ uri: getPhotoUrl(photo) }}
                                    style={styles.photo}
                                    resizeMode="cover"
                                />
                                <View style={styles.photoOverlay}>
                                    <Ionicons name="expand" size={24} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Financial Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 Información Financiera</Text>
                    <View style={styles.card}>
                        <View style={styles.financeRow}>
                            <Text style={styles.financeLabel}>Valor de la Caución:</Text>
                            <Text style={styles.financeValue}>€{dispute.deposit_amount?.toFixed(2)}</Text>
                        </View>

                        {dispute.status === 'resolved' && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.financeRow}>
                                    <Text style={styles.financeLabel}>Severidad:</Text>
                                    <View style={[styles.severityBadge, { backgroundColor: severityColors[dispute.severity] + '20' }]}>
                                        <Text style={[styles.severityText, { color: severityColors[dispute.severity] }]}>
                                            {dispute.severity === 'ok' ? 'OK' : dispute.severity === 'minor' ? 'Leve' : 'Grave'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.financeRow}>
                                    <Text style={styles.financeLabel}>Porcentaje Retenido:</Text>
                                    <Text style={styles.financeValue}>{dispute.deduction_percentage}%</Text>
                                </View>
                                <View style={styles.financeRow}>
                                    <Text style={styles.financeLabel}>Monto Retenido:</Text>
                                    <Text style={[styles.financeValue, { color: '#EF4444' }]}>
                                        €{dispute.deduction_amount?.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.financeRow}>
                                    <Text style={styles.financeLabel}>Monto Devuelto:</Text>
                                    <Text style={[styles.financeValue, { color: '#10B981' }]}>
                                        €{dispute.refund_amount?.toFixed(2)}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Dates */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Fechas</Text>
                    <View style={styles.card}>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Creada:</Text>
                            <Text style={styles.dateValue}>
                                {new Date(dispute.created_at).toLocaleString('es-ES')}
                            </Text>
                        </View>
                        {dispute.resolved_at && (
                            <View style={styles.dateRow}>
                                <Text style={styles.dateLabel}>Resuelta:</Text>
                                <Text style={styles.dateValue}>
                                    {new Date(dispute.resolved_at).toLocaleString('es-ES')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Button */}
                {dispute.status === 'open' && (
                    <TouchableOpacity
                        style={[styles.resolveButton, resolving && styles.resolveButtonDisabled]}
                        onPress={handleResolveDispute}
                        disabled={resolving}
                    >
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.resolveButtonText}>
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
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity
                        style={styles.imageModalClose}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close-circle" size={40} color="#fff" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    partyRow: {
        marginBottom: 4,
    },
    partyLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    partyValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    partyEmail: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    issueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    issueIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    issueText: {
        fontSize: 16,
        color: '#1F2937',
    },
    observationText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    photoWrapper: {
        width: (SCREEN_WIDTH - 48) / 2,
        height: (SCREEN_WIDTH - 48) / 2,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    financeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    financeLabel: {
        fontSize: 15,
        color: '#6B7280',
    },
    financeValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateRow: {
        marginBottom: 8,
    },
    dateLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 15,
        color: '#1F2937',
    },
    resolveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    resolveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    resolveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: '80%',
    },
});

