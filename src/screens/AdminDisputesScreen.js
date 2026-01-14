import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

export default function AdminDisputesScreen({ navigation }) {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDisputes();
    }, [filter]);

    const loadDisputes = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('rental_disputes')
                .select(`
                    *,
                    item:items(title),
                    owner:profiles!owner_id(full_name, email),
                    renter:profiles!renter_id(full_name, email),
                    rental:rentals(*)
                `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            setDisputes(data || []);
        } catch (error) {
            console.error('Erro ao carregar disputas:', error);
            Alert.alert('Error', 'No se pudieron cargar las disputas');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDispute = async (dispute) => {
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
                    onPress: () => resolveDispute(dispute, 0, 'ok'),
                },
                {
                    text: 'Leve (30%)',
                    onPress: () => resolveDispute(dispute, 30, 'minor'),
                },
                {
                    text: 'Grave (100%)',
                    onPress: () => resolveDispute(dispute, 100, 'severe'),
                    style: 'destructive',
                },
            ]
        );
    };

    const resolveDispute = async (dispute, percentage, severity) => {
        try {
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

            Alert.alert('Éxito', 'Disputa resuelta correctamente');
            loadDisputes();
        } catch (error) {
            console.error('Erro ao resolver disputa:', error);
            Alert.alert('Error', 'No se pudo resolver la disputa');
        }
    };

    const renderDispute = ({ item }) => {
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
            <TouchableOpacity
                style={styles.disputeCard}
                onPress={() => navigation.navigate('DisputeDetails', { dispute: item })}
            >
                <View style={styles.disputeHeader}>
                    <Text style={styles.itemTitle}>{item.item?.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                            {item.status === 'open' ? 'Abierta' : item.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                        </Text>
                    </View>
                </View>

                <View style={styles.disputeInfo}>
                    <Text style={styles.infoLabel}>Propietario:</Text>
                    <Text style={styles.infoValue}>{item.owner?.full_name}</Text>
                </View>

                <View style={styles.disputeInfo}>
                    <Text style={styles.infoLabel}>Locatario:</Text>
                    <Text style={styles.infoValue}>{item.renter?.full_name}</Text>
                </View>

                <View style={styles.disputeInfo}>
                    <Text style={styles.infoLabel}>Caución:</Text>
                    <Text style={styles.infoValue}>€{item.deposit_amount?.toFixed(2)}</Text>
                </View>

                <View style={styles.disputeInfo}>
                    <Text style={styles.infoLabel}>Problemas:</Text>
                    <Text style={styles.infoValue}>
                        {item.issue_types?.join(', ')}
                    </Text>
                </View>

                {item.severity && (
                    <View style={styles.disputeInfo}>
                        <Text style={styles.infoLabel}>Severidad:</Text>
                        <View style={[styles.severityBadge, { backgroundColor: severityColors[item.severity] + '20' }]}>
                            <Text style={[styles.severityText, { color: severityColors[item.severity] }]}>
                                {item.severity === 'ok' ? 'OK' : item.severity === 'minor' ? 'Leve' : 'Grave'}
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={styles.observation} numberOfLines={2}>
                    {item.observation}
                </Text>

                <View style={styles.disputeFooter}>
                    <Text style={styles.dateText}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    {item.status === 'open' && (
                        <TouchableOpacity
                            style={styles.resolveButton}
                            onPress={() => handleResolveDispute(item)}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.resolveButtonText}>Resolver</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Disputas</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar disputas..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.filtersContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Todas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'open' && styles.filterButtonActive]}
                    onPress={() => setFilter('open')}
                >
                    <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
                        Abiertas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
                    onPress={() => setFilter('resolved')}
                >
                    <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
                        Resueltas
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={disputes}
                keyExtractor={(item) => item.id}
                renderItem={renderDispute}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadDisputes} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No hay disputas</Text>
                    </View>
                }
            />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1F2937',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    disputeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    disputeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    disputeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    observation: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        fontStyle: 'italic',
    },
    disputeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    resolveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    resolveButtonText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
});

