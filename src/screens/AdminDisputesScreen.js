import React, { useState, useEffect } from 'react';
import {View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { adminDisputesStyles } from '../styles/screens/adminDisputesStyles';

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
                style={adminDisputesStyles.disputeCard}
                onPress={() => navigation.navigate('DisputeDetails', { dispute: item })}
            >
                <View style={adminDisputesStyles.disputeHeader}>
                    <Text style={adminDisputesStyles.itemTitle}>{item.item?.title}</Text>
                    <View style={[adminDisputesStyles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                        <Text style={[adminDisputesStyles.statusText, { color: statusColors[item.status] }]}>
                            {item.status === 'open' ? 'Abierta' : item.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                        </Text>
                    </View>
                </View>

                <View style={adminDisputesStyles.disputeInfo}>
                    <Text style={adminDisputesStyles.infoLabel}>Propietario:</Text>
                    <Text style={adminDisputesStyles.infoValue}>{item.owner?.full_name}</Text>
                </View>

                <View style={adminDisputesStyles.disputeInfo}>
                    <Text style={adminDisputesStyles.infoLabel}>Locatario:</Text>
                    <Text style={adminDisputesStyles.infoValue}>{item.renter?.full_name}</Text>
                </View>

                <View style={adminDisputesStyles.disputeInfo}>
                    <Text style={adminDisputesStyles.infoLabel}>Caución:</Text>
                    <Text style={adminDisputesStyles.infoValue}>€{item.deposit_amount?.toFixed(2)}</Text>
                </View>

                <View style={adminDisputesStyles.disputeInfo}>
                    <Text style={adminDisputesStyles.infoLabel}>Problemas:</Text>
                    <Text style={adminDisputesStyles.infoValue}>
                        {item.issue_types?.join(', ')}
                    </Text>
                </View>

                {item.severity && (
                    <View style={adminDisputesStyles.disputeInfo}>
                        <Text style={adminDisputesStyles.infoLabel}>Severidad:</Text>
                        <View style={[adminDisputesStyles.severityBadge, { backgroundColor: severityColors[item.severity] + '20' }]}>
                            <Text style={[adminDisputesStyles.severityText, { color: severityColors[item.severity] }]}>
                                {item.severity === 'ok' ? 'OK' : item.severity === 'minor' ? 'Leve' : 'Grave'}
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={adminDisputesStyles.observation} numberOfLines={2}>
                    {item.observation}
                </Text>

                <View style={adminDisputesStyles.disputeFooter}>
                    <Text style={adminDisputesStyles.dateText}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    {item.status === 'open' && (
                        <TouchableOpacity
                            style={adminDisputesStyles.resolveButton}
                            onPress={() => handleResolveDispute(item)}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={adminDisputesStyles.resolveButtonText}>Resolver</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={adminDisputesStyles.container}>
            <View style={adminDisputesStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={adminDisputesStyles.headerTitle}>Gestión de Disputas</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={adminDisputesStyles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={adminDisputesStyles.searchInput}
                    placeholder="Buscar disputas..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={adminDisputesStyles.filtersContainer}>
                <TouchableOpacity
                    style={[adminDisputesStyles.filterButton, filter === 'all' && adminDisputesStyles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[adminDisputesStyles.filterText, filter === 'all' && adminDisputesStyles.filterTextActive]}>
                        Todas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminDisputesStyles.filterButton, filter === 'open' && adminDisputesStyles.filterButtonActive]}
                    onPress={() => setFilter('open')}
                >
                    <Text style={[adminDisputesStyles.filterText, filter === 'open' && adminDisputesStyles.filterTextActive]}>
                        Abiertas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminDisputesStyles.filterButton, filter === 'resolved' && adminDisputesStyles.filterButtonActive]}
                    onPress={() => setFilter('resolved')}
                >
                    <Text style={[adminDisputesStyles.filterText, filter === 'resolved' && adminDisputesStyles.filterTextActive]}>
                        Resueltas
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={disputes}
                keyExtractor={(item) => item.id}
                renderItem={renderDispute}
                contentContainerStyle={adminDisputesStyles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadDisputes} />
                }
                ListEmptyComponent={
                    <View style={adminDisputesStyles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
                        <Text style={adminDisputesStyles.emptyText}>No hay disputas</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}



