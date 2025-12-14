import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

export default function MyRentalsScreen({ navigation, session }) {
    const [activeTab, setActiveTab] = useState('my_rentals'); // my_rentals (cosas que alquilo), my_products (mis productos que otros alquilan)
    const [subTab, setSubTab] = useState('pending'); // pending, approved, active, history
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRentals();
    }, [activeTab, subTab]);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    renter:profiles!rentals_renter_id_fkey(id, username, full_name),
                    owner:profiles!rentals_owner_id_fkey(id, username, full_name)
                `)
                .order('created_at', { ascending: false });

            // Filtrar por tipo (coisas que eu alugo vs meus produtos que outros alugam)
            if (activeTab === 'my_rentals') {
                query = query.eq('renter_id', session.user.id);
            } else {
                query = query.eq('owner_id', session.user.id);
            }

            // Filtrar por status
            if (subTab === 'pending') {
                query = query.eq('status', 'pending');
            } else if (subTab === 'approved') {
                query = query.in('status', ['approved']);
            } else if (subTab === 'active') {
                // Activas deve mostrar tanto approved quanto active
                query = query.in('status', ['approved', 'active']);
            } else if (subTab === 'history') {
                query = query.in('status', ['completed', 'cancelled', 'rejected']);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRentals(data || []);
        } catch (error) {
            console.error('Erro ao buscar aluguéis:', error);
        }
        setLoading(false);
    };

    const generateCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Função para calcular o valor que o proprietário receberá
    const calculateOwnerAmount = (rental) => {
        if (rental.owner_amount) {
            return parseFloat(rental.owner_amount);
        }

        // Calcular baseado no preço anunciado (sem taxa)
        const basePrice = parseFloat(rental.item?.price_per_day || 0);
        const days = rental.total_days || 1;
        let ownerAmount = basePrice * days;

        // Aplicar desconto semanal se houver
        if (days >= 7 && days < 30 && rental.item?.discount_week) {
            const discount = parseFloat(rental.item.discount_week) || 0;
            ownerAmount = ownerAmount * (1 - discount / 100);
        }

        // Aplicar desconto mensal se houver
        if (days >= 30 && rental.item?.discount_month) {
            const discount = parseFloat(rental.item.discount_month) || 0;
            ownerAmount = ownerAmount * (1 - discount / 100);
        }

        return ownerAmount;
    };

    const handleApprove = async (rentalId) => {
        Alert.alert(
            'Aprobar Solicitud',
            '¿Deseas aprobar esta solicitud de alquiler?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprobar',
                    onPress: async () => {
                        try {
                            const rental = rentals.find(r => r.id === rentalId);

                            // Gerar códigos únicos
                            const ownerCode = generateCode();
                            const renterCode = generateCode();

                            // Calcular valor que o locador recebe (preço base * dias com descontos aplicados)
                            const basePrice = parseFloat(rental.item.price_per_day);
                            const days = rental.total_days;
                            let ownerAmount = basePrice * days;

                            // Aplicar desconto semanal se houver
                            if (days >= 7 && days < 30 && rental.item.discount_week) {
                                const discount = parseFloat(rental.item.discount_week) || 0;
                                ownerAmount = ownerAmount * (1 - discount / 100);
                            }

                            // Aplicar desconto mensal se houver
                            if (days >= 30 && rental.item.discount_month) {
                                const discount = parseFloat(rental.item.discount_month) || 0;
                                ownerAmount = ownerAmount * (1 - discount / 100);
                            }

                            const { error } = await supabase
                                .from('rentals')
                                .update({
                                    status: 'approved',
                                    owner_code: ownerCode,
                                    renter_code: renterCode,
                                    owner_amount: ownerAmount,
                                })
                                .eq('id', rentalId);

                            if (error) throw error;

                            // Criar notificação para o locatário com código
                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: rental.renter_id,
                                    type: 'rental_approved',
                                    title: '✅ Solicitud Aprobada',
                                    message: `Tu solicitud para alquilar "${rental.item.title}" fue aprobada.\n\n🔑 Tu código de devolución: ${renterCode}\n\nGuarda este código, lo necesitarás al devolver el artículo.`,
                                    related_id: rentalId,
                                    read: false,
                                });

                            Alert.alert(
                                '✅ Solicitud Aprobada',
                                `La solicitud fue aprobada.\n\n🔑 Tu código de recogida: ${ownerCode}\n\nComparte este código con el arrendatario al momento de entregar el artículo.\n\n💰 Recibirás: €${ownerAmount.toFixed(2)}`,
                                [{ text: 'Entendido' }]
                            );

                            fetchRentals();
                        } catch (error) {
                            console.error('Erro ao aprovar:', error);
                            Alert.alert('Error', 'No se pudo aprobar la solicitud');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (rentalId) => {
        Alert.prompt(
            'Rechazar Solicitud',
            'Por favor, indica el motivo del rechazo:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async (rejectionReason) => {
                        if (!rejectionReason || rejectionReason.trim() === '') {
                            Alert.alert('Atención', 'Debes proporcionar un motivo para rechazar la solicitud.');
                            return;
                        }

                        try {
                            const { error } = await supabase
                                .from('rentals')
                                .update({
                                    status: 'rejected',
                                    rejection_reason: rejectionReason.trim()
                                })
                                .eq('id', rentalId);

                            if (error) throw error;

                            // Criar notificação para o locatário com o motivo da recusa
                            const rental = rentals.find(r => r.id === rentalId);
                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: rental.renter_id,
                                    type: 'rental_rejected',
                                    title: 'Solicitud Rechazada',
                                    message: `Tu solicitud para alquilar "${rental.item.title}" fue rechazada.\n\nMotivo: ${rejectionReason.trim()}`,
                                    related_id: rentalId,
                                    read: false,
                                });

                            Alert.alert('Éxito', 'Solicitud rechazada');
                            fetchRentals();
                        } catch (error) {
                            console.error('Erro ao rejeitar:', error);
                            Alert.alert('Error', 'No se pudo rechazar la solicitud');
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const renderRental = (rental) => {
        const isOwner = rental.owner_id === session.user.id;
        const otherUser = isOwner ? rental.renter : rental.owner;
        const itemTitle = rental.item?.title || 'Item';

        const startDate = new Date(rental.start_date).toLocaleDateString('es-ES');
        const endDate = new Date(rental.end_date).toLocaleDateString('es-ES');
        const pickupTime = rental.pickup_time || '10:00';
        const returnTime = rental.return_time || '18:00';

        return (
            <View key={rental.id} style={styles.rentalCard}>
                <View style={styles.rentalHeader}>
                    <Text style={styles.rentalTitle}>{itemTitle}</Text>
                    <View style={[styles.statusBadge, styles[`status${rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}`]]}>
                        <Text style={styles.statusText}>{rental.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.rentalInfo}>
                    <Text style={styles.rentalLabel}>
                        {isOwner ? '🔵 Solicitante:' : '🟢 Propietario:'}
                    </Text>
                    <Text style={styles.rentalValue}>{otherUser?.full_name || otherUser?.username}</Text>
                </View>

                <View style={styles.rentalInfo}>
                    <Text style={styles.rentalLabel}>📅 Recogida:</Text>
                    <Text style={styles.rentalValue}>{startDate} a las {pickupTime}</Text>
                </View>

                <View style={styles.rentalInfo}>
                    <Text style={styles.rentalLabel}>📅 Devolución:</Text>
                    <Text style={styles.rentalValue}>{endDate} a las {returnTime} ({rental.total_days} días)</Text>
                </View>

                {isOwner ? (
                    <View style={styles.rentalInfo}>
                        <Text style={styles.rentalLabel}>💰 Recibirás:</Text>
                        <Text style={[styles.rentalValue, styles.ownerAmount]}>
                            €{calculateOwnerAmount(rental).toFixed(2)}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.rentalInfo}>
                        <Text style={styles.rentalLabel}>💰 Total a pagar:</Text>
                        <Text style={styles.rentalValue}>€{parseFloat(rental.total_amount).toFixed(2)}</Text>
                    </View>
                )}

                {rental.deposit_amount > 0 && (
                    <View style={styles.rentalInfo}>
                        <Text style={styles.rentalLabel}>🔒 Depósito:</Text>
                        <Text style={styles.rentalValue}>€{parseFloat(rental.deposit_amount).toFixed(2)}</Text>
                    </View>
                )}

                {/* Mostrar códigos se status = approved ou active */}
                {rental.status === 'approved' || rental.status === 'active' ? (
                    <View style={styles.codesContainer}>
                        {isOwner && rental.owner_code && (
                            <View style={styles.codeBox}>
                                <Text style={styles.codeLabel}>🔑 Tu código de recogida:</Text>
                                <Text style={styles.codeValue}>{rental.owner_code}</Text>
                                <Text style={styles.codeHint}>
                                    {rental.owner_code_used ? '✅ Código usado' : 'Comparte con el arrendatario al entregar'}
                                </Text>
                            </View>
                        )}
                        {!isOwner && rental.renter_code && (
                            <View style={styles.codeBox}>
                                <Text style={styles.codeLabel}>🔑 Tu código de devolución:</Text>
                                <Text style={styles.codeValue}>{rental.renter_code}</Text>
                                <Text style={styles.codeHint}>
                                    {rental.renter_code_used ? '✅ Código usado' : 'Comparte con el propietario al devolver'}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Botões de ação apenas para o dono e se status = pending */}
                {isOwner && rental.status === 'pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => handleApprove(rental.id)}
                        >
                            <Text style={styles.approveButtonText}>✓ Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => handleReject(rental.id)}
                        >
                            <Text style={styles.rejectButtonText}>✗ Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {activeTab === 'my_rentals' ? 'Mis Alquileres' : 'Mis Productos'}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Main Tabs (Mis Alquileres vs Mis Productos) */}
            <View style={styles.mainTabsContainer}>
                <TouchableOpacity
                    style={[styles.mainTab, activeTab === 'my_rentals' && styles.mainTabActive]}
                    onPress={() => setActiveTab('my_rentals')}
                >
                    <Text style={[styles.mainTabText, activeTab === 'my_rentals' && styles.mainTabTextActive]}>
                        🛒 Mis Alquileres
                    </Text>
                    <Text style={styles.mainTabSubtext}>Cosas que alquilo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.mainTab, activeTab === 'my_products' && styles.mainTabActive]}
                    onPress={() => setActiveTab('my_products')}
                >
                    <Text style={[styles.mainTabText, activeTab === 'my_products' && styles.mainTabTextActive]}>
                        📦 Mis Productos
                    </Text>
                    <Text style={styles.mainTabSubtext}>Que otros alquilan</Text>
                </TouchableOpacity>
            </View>

            {/* Sub Tabs (Status) */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, subTab === 'pending' && styles.tabActive]}
                    onPress={() => setSubTab('pending')}
                >
                    <Text style={[styles.tabText, subTab === 'pending' && styles.tabTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, subTab === 'approved' && styles.tabActive]}
                    onPress={() => setSubTab('approved')}
                >
                    <Text style={[styles.tabText, subTab === 'approved' && styles.tabTextActive]}>
                        Aprobadas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, subTab === 'active' && styles.tabActive]}
                    onPress={() => setSubTab('active')}
                >
                    <Text style={[styles.tabText, subTab === 'active' && styles.tabTextActive]}>
                        Activas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, subTab === 'history' && styles.tabActive]}
                    onPress={() => setSubTab('history')}
                >
                    <Text style={[styles.tabText, subTab === 'history' && styles.tabTextActive]}>
                        Historial
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Lista */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                </View>
            ) : rentals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>No hay solicitudes</Text>
                    <Text style={styles.emptyText}>
                        {activeTab === 'pending' && 'No tienes solicitudes pendientes'}
                        {activeTab === 'approved' && 'No hay solicitudes aprobadas'}
                        {activeTab === 'renting' && 'No tienes alquileres activos'}
                        {activeTab === 'rented' && 'No hay historial de alquileres'}
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {rentals.map(renderRental)}
                </ScrollView>
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
    mainTabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        gap: 8,
    },
    mainTab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    mainTabActive: {
        backgroundColor: '#E8F5E9',
        borderColor: '#10B981',
    },
    mainTabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginBottom: 2,
    },
    mainTabTextActive: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    mainTabSubtext: {
        fontSize: 10,
        color: '#999',
        fontStyle: 'italic',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#2c4455',
    },
    tabText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#2c4455',
        fontWeight: 'bold',
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
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    rentalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    rentalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    rentalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
    },
    statusApproved: {
        backgroundColor: '#D1FAE5',
    },
    statusActive: {
        backgroundColor: '#DBEAFE',
    },
    statusCompleted: {
        backgroundColor: '#E0E7FF',
    },
    statusRejected: {
        backgroundColor: '#FEE2E2',
    },
    statusCancelled: {
        backgroundColor: '#F3F4F6',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
    },
    rentalInfo: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    rentalLabel: {
        fontSize: 14,
        color: '#666',
        width: 120,
    },
    rentalValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    approveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    ownerAmount: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 15,
    },
    codesContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    codeBox: {
        marginBottom: 8,
    },
    codeLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    codeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
        letterSpacing: 4,
        textAlign: 'center',
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#10B981',
        borderStyle: 'dashed',
    },
    codeHint: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
