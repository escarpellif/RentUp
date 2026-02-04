import React, { useState, useEffect } from 'react';
import {View, Text, ScrollView, TouchableOpacity, Platform, StatusBar, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import { myRentalsStyles } from '../styles/screens/myRentalsStyles';

export default function MyRentalsScreen({ navigation, session }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('hosting'); // hosting (mis productos), renting (alquilo), tickets
    const [subTab, setSubTab] = useState('pending'); // pending, approved, active, history
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRentals();
    }, [activeTab, subTab]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRentals();
        setRefreshing(false);
    };

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

            if (activeTab === 'tickets') {
                // Tickets = todas as locações ativas (approved ou active)
                query = query.in('status', ['approved', 'active']);
                // Pode ser tanto renter quanto owner
                const userId = session.user.id;
                query = query.or(`renter_id.eq.${userId},owner_id.eq.${userId}`);
            } else if (activeTab === 'renting') {
                // Alquilo = coisas que EU alugo de outros
                query = query.eq('renter_id', session.user.id);
            } else if (activeTab === 'hosting') {
                // Mis Productos = meus produtos que OUTROS alugam
                query = query.eq('owner_id', session.user.id);
            }

            // Filtrar por status (exceto em tickets)
            if (activeTab !== 'tickets') {
                if (subTab === 'pending') {
                    query = query.eq('status', 'pending');
                } else if (subTab === 'approved') {
                    query = query.eq('status', 'approved');
                } else if (subTab === 'active') {
                    query = query.in('status', ['approved', 'active']);
                } else if (subTab === 'history') {
                    query = query.in('status', ['completed', 'cancelled', 'rejected']);
                }
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

                            // ✅ Marcar notificação original como lida (rental_request)
                            await supabase
                                .from('user_notifications')
                                .update({ read: true })
                                .eq('related_id', rentalId)
                                .eq('user_id', rental.owner_id)
                                .eq('type', 'rental_request');

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
                                [{
                                    text: 'Entendido',
                                    onPress: () => {
                                        // Recarregar a lista imediatamente
                                        fetchRentals();
                                        // Navegar de volta para forçar refresh dos hooks
                                        navigation.navigate('Home');
                                    }
                                }]
                            );

                            // Recarregar também em paralelo
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

    const handleReject = async (rentalId, reason) => {
        if (!reason || reason.trim() === '') {
            Alert.alert('Error', 'Por favor, ingresa un motivo para el rechazo');
            return;
        }

        try {
            // Atualizar status para rejected
            const { error } = await supabase
                .from('rentals')
                .update({
                    status: 'rejected',
                    rejection_reason: reason
                })
                .eq('id', rentalId);

            if (error) throw error;

            // Buscar dados do rental para notificação
            const rental = rentals.find(r => r.id === rentalId);

            // Enviar notificação ao solicitante
            await supabase
                .from('user_notifications')
                .insert({
                    user_id: rental.renter_id,
                    type: 'rental_rejected',
                    title: 'Solicitud Rechazada',
                    message: `Tu solicitud para "${rental.item?.title}" fue rechazada. Motivo: ${reason}`,
                    related_id: rentalId,
                    read: false,
                });

            // Marcar notificação original como lida
            await supabase
                .from('user_notifications')
                .update({ read: true })
                .eq('related_id', rentalId)
                .eq('user_id', rental.owner_id)
                .eq('type', 'rental_request');

            Alert.alert('Éxito', 'Solicitud rechazada', [
                {
                    text: 'OK',
                    onPress: () => {
                        fetchRentals();
                        navigation.navigate('Home');
                    }
                }
            ]);
        } catch (error) {
            console.error('Erro ao rejeitar:', error);
            Alert.alert('Error', 'No se pudo rechazar la solicitud');
        }
    };

    const handleEditRental = (rental) => {
        // Se a locação já foi aprovada ou está ativa, mostrar alerta
        if (rental.status === 'approved' || rental.status === 'active') {
            Alert.alert(
                'Editar Alquiler',
                'Esta solicitud ya fue aprobada. Los cambios serán notificados al propietario y pueden requerir nueva aprobación.\n\n¿Deseas continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Continuar',
                        onPress: () => {
                            // Navegar para tela de editar com os dados do rental
                            navigation.navigate('RequestRental', {
                                item: rental.item,
                                ownerProfile: rental.owner,
                                editingRental: rental, // Passar dados para edição
                            });
                        }
                    }
                ]
            );
        } else {
            // Se ainda está pendente, navegar direto
            navigation.navigate('RequestRental', {
                item: rental.item,
                ownerProfile: rental.owner,
                editingRental: rental, // Passar dados para edição
            });
        }
    };

    const handleCancelRental = (rentalId) => {
        const rental = rentals.find(r => r.id === rentalId);

        Alert.alert(
            'Cancelar Solicitud',
            `¿Estás seguro de que deseas cancelar ${rental.status === 'pending' ? 'esta solicitud' : 'este alquiler'}?\n\n${rental.status === 'approved' || rental.status === 'active' ? 'ATENCIÓN: El alquiler ya fue aprobado. Se notificará al propietario.' : ''}`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Deletar ou marcar como cancelado dependendo do status
                            if (rental.status === 'pending') {
                                // Se ainda está pendente, pode deletar
                                const { error } = await supabase
                                    .from('rentals')
                                    .delete()
                                    .eq('id', rentalId);

                                if (error) throw error;
                            } else {
                                // Se já foi aprovado, marcar como cancelado
                                const { error } = await supabase
                                    .from('rentals')
                                    .update({ status: 'cancelled' })
                                    .eq('id', rentalId);

                                if (error) throw error;

                                // Notificar o proprietário
                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: rental.owner_id,
                                        type: 'rental_cancelled',
                                        title: 'Alquiler Cancelado',
                                        message: `${rental.renter?.full_name} canceló el alquiler de "${rental.item?.title}"`,
                                        related_id: rentalId,
                                        read: false,
                                    });
                            }

                            Alert.alert('Éxito', rental.status === 'pending' ? 'Solicitud eliminada' : 'Alquiler cancelado');
                            fetchRentals();
                        } catch (error) {
                            console.error('Erro ao cancelar:', error);
                            Alert.alert('Error', 'No se pudo cancelar la solicitud');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectWithReason = (rentalId) => {
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

                            // ✅ Marcar notificação original como lida (rental_request)
                            const rental = rentals.find(r => r.id === rentalId);

                            await supabase
                                .from('user_notifications')
                                .update({ read: true })
                                .eq('related_id', rentalId)
                                .eq('user_id', rental.owner_id)
                                .eq('type', 'rental_request');

                            // Criar notificação para o locatário com o motivo da recusa
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

                            Alert.alert('Éxito', 'Solicitud rechazada', [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        fetchRentals();
                                    }
                                }
                            ]);

                            // Recarregar também em paralelo
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

        // Formatar datas sem problemas de timezone
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const startDate = formatDate(rental.start_date);
        const endDate = formatDate(rental.end_date);
        const pickupTime = rental.pickup_time || '10:00';
        const returnTime = rental.return_time || '18:00';

        return (
            <View key={rental.id} style={myRentalsStyles.rentalCard}>
                <View style={myRentalsStyles.rentalHeader}>
                    <Text style={myRentalsStyles.rentalTitle}>{itemTitle}</Text>
                    <View style={[myRentalsStyles.statusBadge, styles[`status${rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}`]]}>
                        <Text style={myRentalsStyles.statusText}>{rental.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={myRentalsStyles.rentalInfo}>
                    <Text style={myRentalsStyles.rentalLabel}>
                        {isOwner ? '🔵 Solicitante:' : '🟢 Propietario:'}
                    </Text>
                    <Text style={myRentalsStyles.rentalValue}>{otherUser?.full_name || otherUser?.username}</Text>
                </View>

                <View style={myRentalsStyles.rentalInfo}>
                    <Text style={myRentalsStyles.rentalLabel}>📅 Recogida:</Text>
                    <Text style={myRentalsStyles.rentalValue}>{startDate} a las {pickupTime}</Text>
                </View>

                <View style={myRentalsStyles.rentalInfo}>
                    <Text style={myRentalsStyles.rentalLabel}>📅 Devolución:</Text>
                    <Text style={myRentalsStyles.rentalValue}>{endDate} a las {returnTime} ({rental.total_days} días)</Text>
                </View>

                {/* Mostrar endereço completo do item */}
                {rental.item?.street && (
                    <View style={myRentalsStyles.rentalInfo}>
                        <Text style={myRentalsStyles.rentalLabel}>📍 Dirección:</Text>
                        <Text style={myRentalsStyles.rentalValue}>
                            {rental.item.street}
                            {rental.item.number ? `, ${rental.item.number}` : ''}
                            {rental.item.complement ? `, ${rental.item.complement}` : ''}
                            {'\n'}
                            {rental.item.postal_code} {rental.item.city}
                            {rental.item.province ? `, ${rental.item.province}` : ''}
                        </Text>
                    </View>
                )}

                {isOwner ? (
                    <View style={myRentalsStyles.rentalInfo}>
                        <Text style={myRentalsStyles.rentalLabel}>💰 Recibirás:</Text>
                        <Text style={[myRentalsStyles.rentalValue, myRentalsStyles.ownerAmount]}>
                            €{calculateOwnerAmount(rental).toFixed(2)}
                        </Text>
                    </View>
                ) : (
                    <View style={myRentalsStyles.rentalInfo}>
                        <Text style={myRentalsStyles.rentalLabel}>💰 Total a pagar:</Text>
                        <Text style={myRentalsStyles.rentalValue}>€{parseFloat(rental.total_amount).toFixed(2)}</Text>
                    </View>
                )}

                {rental.deposit_amount > 0 && (
                    <View style={myRentalsStyles.rentalInfo}>
                        <Text style={myRentalsStyles.rentalLabel}>🔒 Depósito:</Text>
                        <Text style={myRentalsStyles.rentalValue}>€{parseFloat(rental.deposit_amount).toFixed(2)}</Text>
                    </View>
                )}

                {/* Mostrar códigos se status = approved ou active */}
                {rental.status === 'approved' || rental.status === 'active' ? (
                    <View style={myRentalsStyles.codesContainer}>
                        {isOwner && rental.owner_code && (
                            <View style={myRentalsStyles.codeBox}>
                                <Text style={myRentalsStyles.codeLabel}>🔑 Tu código de recogida:</Text>
                                <Text style={myRentalsStyles.codeValue}>{rental.owner_code}</Text>
                                <Text style={myRentalsStyles.codeHint}>
                                    {rental.owner_code_used ? '✅ Código usado' : 'Comparte con el arrendatario al entregar'}
                                </Text>
                            </View>
                        )}
                        {!isOwner && rental.renter_code && (
                            <View style={myRentalsStyles.codeBox}>
                                <Text style={myRentalsStyles.codeLabel}>🔑 Tu código de devolución:</Text>
                                <Text style={myRentalsStyles.codeValue}>{rental.renter_code}</Text>
                                <Text style={myRentalsStyles.codeHint}>
                                    {rental.renter_code_used ? '✅ Código usado' : 'Comparte con el propietario al devolver'}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Botões de ação apenas para o dono e se status = pending */}
                {isOwner && rental.status === 'pending' && (
                    <View style={myRentalsStyles.actionButtons}>
                        <TouchableOpacity
                            style={myRentalsStyles.approveButton}
                            onPress={() => handleApprove(rental.id)}
                        >
                            <Text style={myRentalsStyles.approveButtonText}>✓ Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={myRentalsStyles.rejectButton}
                            onPress={() => handleRejectWithReason(rental.id)}
                        >
                            <Text style={myRentalsStyles.rejectButtonText}>✗ Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Botões de ação para o renter (locatário) */}
                {!isOwner && (rental.status === 'pending' || rental.status === 'approved' || rental.status === 'active') && (
                    <View style={myRentalsStyles.actionButtons}>
                        {rental.status === 'pending' && (
                            <TouchableOpacity
                                style={myRentalsStyles.editButton}
                                onPress={() => handleEditRental(rental)}
                            >
                                <Text style={myRentalsStyles.editButtonText}>✏️ Editar</Text>
                            </TouchableOpacity>
                        )}
                        {(rental.status === 'approved' || rental.status === 'active') && (
                            <TouchableOpacity
                                style={myRentalsStyles.editButton}
                                onPress={() => handleEditRental(rental)}
                            >
                                <Text style={myRentalsStyles.editButtonText}>✏ Editar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={myRentalsStyles.cancelButton}
                            onPress={() => handleCancelRental(rental.id)}
                        >
                            <Text style={myRentalsStyles.cancelButtonText}>
                                {rental.status === 'pending' ? '🗑️ Eliminar' : '✗ Cancelar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={myRentalsStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={myRentalsStyles.header}>
                <TouchableOpacity
                    style={myRentalsStyles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={myRentalsStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={myRentalsStyles.headerTitle}>
                    {activeTab === 'hosting' ? 'Mis Productos' : activeTab === 'renting' ? 'Mis Alquileres' : 'Mis Transacciones'}
                </Text>
                <View style={myRentalsStyles.headerSpacer} />
            </View>

            {/* Main Tabs (Mis Productos vs Mis Alquileres) */}
            <View style={myRentalsStyles.mainTabsContainer}>
                <TouchableOpacity
                    style={[myRentalsStyles.mainTab, activeTab === 'hosting' && myRentalsStyles.mainTabActive]}
                    onPress={() => setActiveTab('hosting')}
                >
                    <Text style={[myRentalsStyles.mainTabText, activeTab === 'hosting' && myRentalsStyles.mainTabTextActive]}>
                        📦 Mis Productos
                    </Text>
                    <Text style={myRentalsStyles.mainTabSubtext}>Que otros alquilan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[myRentalsStyles.mainTab, activeTab === 'renting' && myRentalsStyles.mainTabActive]}
                    onPress={() => setActiveTab('renting')}
                >
                    <Text style={[myRentalsStyles.mainTabText, activeTab === 'renting' && myRentalsStyles.mainTabTextActive]}>
                        🛒 Mis Alquileres
                    </Text>
                    <Text style={myRentalsStyles.mainTabSubtext}>Cosas que alquilo</Text>
                </TouchableOpacity>
            </View>

            {/* Sub Tabs (Status) */}
            <View style={myRentalsStyles.tabsContainer}>
                <TouchableOpacity
                    style={[myRentalsStyles.tab, subTab === 'pending' && myRentalsStyles.tabActive]}
                    onPress={() => setSubTab('pending')}
                >
                    <Text style={[myRentalsStyles.tabText, subTab === 'pending' && myRentalsStyles.tabTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[myRentalsStyles.tab, subTab === 'approved' && myRentalsStyles.tabActive]}
                    onPress={() => setSubTab('approved')}
                >
                    <Text style={[myRentalsStyles.tabText, subTab === 'approved' && myRentalsStyles.tabTextActive]}>
                        Aprobadas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[myRentalsStyles.tab, subTab === 'active' && myRentalsStyles.tabActive]}
                    onPress={() => setSubTab('active')}
                >
                    <Text style={[myRentalsStyles.tabText, subTab === 'active' && myRentalsStyles.tabTextActive]}>
                        Activas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[myRentalsStyles.tab, subTab === 'history' && myRentalsStyles.tabActive]}
                    onPress={() => setSubTab('history')}
                >
                    <Text style={[myRentalsStyles.tabText, subTab === 'history' && myRentalsStyles.tabTextActive]}>
                        Historial
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Lista */}
            {loading ? (
                <View style={myRentalsStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c4455" />
                </View>
            ) : rentals.length === 0 ? (
                <View style={myRentalsStyles.emptyContainer}>
                    <Text style={myRentalsStyles.emptyIcon}>📋</Text>
                    <Text style={myRentalsStyles.emptyTitle}>No hay solicitudes</Text>
                    <Text style={myRentalsStyles.emptyText}>
                        {activeTab === 'pending' && 'No tienes solicitudes pendientes'}
                        {activeTab === 'approved' && 'No hay solicitudes aprobadas'}
                        {activeTab === 'renting' && 'No tienes alquileres activos'}
                        {activeTab === 'rented' && 'No hay historial de alquileres'}
                    </Text>
                </View>
            ) : (
                <ScrollView style={myRentalsStyles.list} contentContainerStyle={myRentalsStyles.listContent}>
                    {rentals.map(renderRental)}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}


