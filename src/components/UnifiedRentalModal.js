import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    Linking,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {supabase} from '../../supabase';

const UnifiedRentalModal = ({session, navigation}) => {
    const [allRentals, setAllRentals] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchAllRentals();
        }
    }, [session]);

    useEffect(() => {
        if (visible && session?.user?.id) {
            fetchAllRentals();
        }
    }, [visible]);

    useEffect(() => {
        if (allRentals.length > 0 && visible) {
            const interval = setInterval(() => {
                updateTimeRemaining();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [allRentals, visible, currentIndex]);

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

    const fetchAllRentals = async () => {
        try {
            // Verificar se session existe antes de acessar user
            if (!session?.user?.id) {
                return;
            }

            // Buscar locações onde usuário é LOCATÁRIO (renter)
            // Busca 'approved' (aguardando retirada) E 'active' (em locação, aguardando devolução)
            const {data: renterRentals, error: renterError} = await supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                    renter:profiles!rentals_renter_id_fkey(full_name)
                `)
                .eq('renter_id', session.user.id)
                .in('status', ['approved', 'active']);
                // ✅ REMOVIDO filtro de data temporariamente para debug

            // Buscar locações onde usuário é LOCADOR (owner)
            // 'approved' (aguardando entrega) E 'active' (em locação, aguardando devolução)
            const {data: ownerRentals, error: ownerError} = await supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                    renter:profiles!rentals_renter_id_fkey(full_name)
                `)
                .eq('owner_id', session.user.id)
                .in('status', ['approved', 'active']);
                // ✅ REMOVIDO filtro de data temporariamente para debug

            if (renterError && renterError.code !== 'PGRST116') {
                console.error('Erro ao buscar locações como renter:', renterError);
            }

            if (ownerError && ownerError.code !== 'PGRST116') {
                console.error('Erro ao buscar locações como owner:', ownerError);
            }

            // Combinar e adicionar flag de tipo
            const combinedRentals = [
                ...(renterRentals || []).map(r => ({...r, userRole: 'renter'})),
                ...(ownerRentals || []).map(r => ({...r, userRole: 'owner'}))
            ];

            console.log('🔵 UnifiedRentalModal - Locações encontradas:');
            console.log('   - Como Renter:', renterRentals?.length || 0);
            console.log('   - Como Owner:', ownerRentals?.length || 0);
            console.log('   - Total combinado:', combinedRentals.length);
            console.log('   - Data atual (filtro):', new Date().toISOString().split('T')[0]);

            if (combinedRentals.length > 0) {
                console.log('   - Primeira locação:', {
                    id: combinedRentals[0].id,
                    status: combinedRentals[0].status,
                    start_date: combinedRentals[0].start_date,
                    pickup_time: combinedRentals[0].pickup_time,
                    userRole: combinedRentals[0].userRole
                });
                console.log('   - Dados completos da primeira locação:', combinedRentals[0]);
            }

            // Ordenar por data
            combinedRentals.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            if (combinedRentals.length > 0) {
                setAllRentals(combinedRentals);
                setVisible(true);
                console.log('✅ Modal setado como VISIBLE com', combinedRentals.length, 'locação(ões)');
                updateTimeRemaining(combinedRentals[0]);
            } else {
                setVisible(false);
                console.log('⚪ Modal setado como HIDDEN (nenhuma locação)');
            }
        } catch (error) {
            console.error('Erro ao buscar locações:', error);
        }
    };

    const updateTimeRemaining = (rental = allRentals[currentIndex]) => {
        // ✅ Validação completa
        if (!rental || !rental.start_date || !rental.pickup_time) {
            setTimeRemaining('Calculando...');
            return;
        }

        const now = new Date();

        // ✅ Extrair apenas a data (YYYY-MM-DD) do start_date e end_date
        const startDateOnly = rental.start_date.split('T')[0];
        const endDateOnly = rental.end_date.split('T')[0];

        // Criar datetime de retirada e devolução
        const pickupDateTime = new Date(`${startDateOnly}T${rental.pickup_time}:00`);
        const returnDateTime = new Date(`${endDateOnly}T${rental.return_time || '18:00'}:00`);

        // ✅ Verificar se as datas são válidas
        if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
            setTimeRemaining('Fecha inválida');
            console.error('❌ Data inválida:', {
                start_date: rental.start_date,
                end_date: rental.end_date,
                pickup_time: rental.pickup_time,
                return_time: rental.return_time
            });
            return;
        }

        console.log('✅ Datas criadas:', {
            pickupDateTime: pickupDateTime.toISOString(),
            returnDateTime: returnDateTime.toISOString(),
            now: now.toISOString(),
            status: rental.status
        });

        // ✅ Se status é 'active' OU já passou horário de retirada, mostrar tempo até DEVOLUÇÃO
        if (rental.status === 'active' || now >= pickupDateTime) {
            const diffReturn = returnDateTime - now;

            if (diffReturn <= 0) {
                if (rental.userRole === 'renter') {
                    setTimeRemaining('⏰ Hora de devolver el artículo');
                } else {
                    setTimeRemaining('⏰ Hora de recibir la devolución');
                }
                return;
            }

            const days = Math.floor(diffReturn / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffReturn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffReturn % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffReturn % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            }
            return;
        }

        // ✅ Caso contrário, mostrar tempo até RETIRADA (status approved)
        const diffPickup = pickupDateTime - now;

        if (diffPickup <= 0) {
            if (rental.userRole === 'renter') {
                setTimeRemaining('⏰ Hora de recoger el artículo');
            } else {
                setTimeRemaining('⏰ Hora de entregar el artículo');
            }
            return;
        }

        const days = Math.floor(diffPickup / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffPickup % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffPickup % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffPickup % (1000 * 60)) / 1000);

        if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
            setTimeRemaining(`${minutes}m ${seconds}s`);
        }
    };

    const handleConfirmAction = async () => {
        const currentRental = allRentals[currentIndex];

        if (currentRental.userRole === 'owner') {
            // LOCADOR: Confirmar entrega (precisa validar código do locatário)
            if (!codeInput || codeInput.trim() === '') {
                Alert.alert('Error', 'Por favor, ingresa el código del locatario');
                return;
            }

            if (codeInput.trim() !== currentRental.renter_code) {
                Alert.alert(
                    'Código Incorrecto',
                    'El código ingresado no coincide. Por favor, solicita el código correcto al locatario.',
                    [{text: 'OK'}]
                );
                setCodeInput('');
                return;
            }

            Alert.alert(
                'Confirmar Entrega',
                '¿Confirmas que el artículo fue entregado al locatario y está en buenas condiciones?',
                [
                    {text: 'Cancelar', style: 'cancel'},
                    {
                        text: 'Confirmar',
                        onPress: async () => {
                            setConfirming(true);
                            try {
                                const {error} = await supabase
                                    .from('rentals')
                                    .update({
                                        status: 'active',
                                        pickup_confirmed_at: new Date().toISOString()
                                    })
                                    .eq('id', currentRental.id);

                                if (error) throw error;

                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: currentRental.renter_id,
                                        type: 'rental_active',
                                        title: 'Locación Confirmada',
                                        message: `La entrega de "${currentRental.item.title}" fue confirmada. No olvides devolverlo en la fecha acordada.`,
                                        related_id: currentRental.id,
                                        read: false,
                                    });

                                Alert.alert('Éxito', 'Entrega confirmada. El artículo ahora está en locación.', [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // ✅ Re-buscar rentals ao invés de remover
                                            // Owner agora verá status 'active' com owner_code destacado
                                            setCodeInput('');
                                            fetchAllRentals();
                                        }
                                    }
                                ]);
                            } catch (error) {
                                console.error('Erro ao confirmar entrega:', error);
                                Alert.alert('Error', 'No se pudo confirmar la entrega');
                            } finally {
                                setConfirming(false);
                            }
                        }
                    }
                ]
            );
        } else {
            // LOCATÁRIO
            if (currentRental.status === 'approved') {
                // Se ainda não foi retirado: Ação de maps
                openMaps(currentRental);
            } else if (currentRental.status === 'active') {
                // Se já foi retirado: Confirmar devolução
                if (!codeInput || codeInput.trim() === '') {
                    Alert.alert('Error', 'Por favor, ingresa el código del propietario');
                    return;
                }

                if (codeInput.trim() !== currentRental.owner_code) {
                    Alert.alert(
                        'Código Incorrecto',
                        'El código ingresado no coincide. Por favor, solicita el código correcto al propietario.',
                        [{text: 'OK'}]
                    );
                    setCodeInput('');
                    return;
                }

                Alert.alert(
                    'Confirmar Devolución',
                    '¿Confirmas que el artículo fue devuelto al propietario en buenas condiciones?',
                    [
                        {text: 'Cancelar', style: 'cancel'},
                        {
                            text: 'Confirmar',
                            onPress: async () => {
                                setConfirming(true);
                                try {

                                    const {data, error} = await supabase
                                        .from('rentals')
                                        .update({
                                            status: 'completed',
                                            return_confirmed_at: new Date().toISOString()
                                        })
                                        .eq('id', currentRental.id)
                                        .select();

                                    if (error) {
                                        console.error('❌ Erro ao atualizar status:', error);
                                        throw error;
                                    }

                                    console.log('✅ Status atualizado com sucesso:', data);

                                    // Notificar owner
                                    await supabase
                                        .from('user_notifications')
                                        .insert({
                                            user_id: currentRental.owner_id,
                                            type: 'rental_completed',
                                            title: 'Devolución Confirmada',
                                            message: `La devolución de "${currentRental.item.title}" fue confirmada. El pago será procesado.`,
                                            related_id: currentRental.id,
                                            read: false,
                                        });


                                    Alert.alert('¡Éxito!', 'Devolución confirmada. Gracias por usar ALUKO!', [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                const updatedRentals = allRentals.filter((_, index) => index !== currentIndex);
                                                setAllRentals(updatedRentals);
                                                setCodeInput('');

                                                if (updatedRentals.length === 0) {
                                                    setVisible(false);
                                                } else if (currentIndex >= updatedRentals.length) {
                                                    setCurrentIndex(updatedRentals.length - 1);
                                                }
                                            }
                                        }
                                    ]);
                                } catch (error) {
                                    console.error('Erro ao confirmar devolução:', error);
                                    Alert.alert('Error', 'No se pudo confirmar la devolución');
                                } finally {
                                    setConfirming(false);
                                }
                            }
                        }
                    ]
                );
            }
        }
    };

    const handleEditRental = (rental) => {
        // Fechar modal e navegar para tela de edição
        setVisible(false);

        if (rental.status === 'approved') {
            Alert.alert(
                'Editar Alquiler',
                'Esta solicitud ya fue aprobada. Los cambios volverán la solicitud a estado PENDIENTE y necesitará nueva aprobación.\n\n¿Deseas continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Continuar',
                        onPress: () => {
                            if (navigation) {
                                navigation.navigate('RequestRental', {
                                    item: rental.item,
                                    ownerProfile: rental.owner,
                                    editingRental: rental,
                                });
                            }
                        }
                    }
                ]
            );
        } else {
            if (navigation) {
                navigation.navigate('RequestRental', {
                    item: rental.item,
                    ownerProfile: rental.owner,
                    editingRental: rental,
                });
            }
        }
    };

    const handleCancelRental = (rental) => {
        Alert.alert(
            'Cancelar Solicitud',
            rental.status === 'approved'
                ? '¿Estás seguro de que deseas cancelar este alquiler?\n\nATENCIÓN: El alquiler ya fue aprobado. Se notificará al propietario.'
                : '¿Estás seguro de que deseas cancelar esta solicitud?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (rental.status === 'pending') {
                                // Se pendente, deletar
                                const { error } = await supabase
                                    .from('rentals')
                                    .delete()
                                    .eq('id', rental.id);

                                if (error) throw error;

                                Alert.alert('Éxito', 'Solicitud eliminada');
                            } else {
                                // Se aprovado, marcar como cancelado
                                const { error } = await supabase
                                    .from('rentals')
                                    .update({ status: 'cancelled' })
                                    .eq('id', rental.id);

                                if (error) throw error;

                                // Remover bloqueios de data
                                await supabase
                                    .from('item_availability')
                                    .delete()
                                    .eq('rental_id', rental.id);

                                // Notificar proprietário
                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: rental.owner_id,
                                        type: 'rental_cancelled',
                                        title: 'Alquiler Cancelado',
                                        message: `${rental.renter?.full_name || 'El locatario'} canceló el alquiler de "${rental.item?.title}"`,
                                        related_id: rental.id,
                                        read: false,
                                    });

                                Alert.alert('Éxito', 'Alquiler cancelado');
                            }

                            // Atualizar lista
                            const updatedRentals = allRentals.filter(r => r.id !== rental.id);
                            setAllRentals(updatedRentals);

                            if (updatedRentals.length === 0) {
                                setVisible(false);
                            } else if (currentIndex >= updatedRentals.length) {
                                setCurrentIndex(updatedRentals.length - 1);
                            }
                        } catch (error) {
                            console.error('Erro ao cancelar:', error);
                            Alert.alert('Error', 'No se pudo cancelar la solicitud');
                        }
                    }
                }
            ]
        );
    };

    const openMaps = (rental) => {
        if (!rental?.owner) {
            Alert.alert('Error', 'No se pudo obtener la dirección');
            return;
        }

        const {address, city, postal_code} = rental.owner;
        const fullAddress = `${address}, ${postal_code} ${city}, España`;
        const encodedAddress = encodeURIComponent(fullAddress);

        const googleMapsUrl = Platform.select({
            ios: `comgooglemaps://?q=${encodedAddress}`,
            android: `google.navigation:q=${encodedAddress}`
        });

        Linking.canOpenURL(googleMapsUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(googleMapsUrl);
                } else {
                    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                    return Linking.openURL(webUrl);
                }
            })
            .catch((err) => {
                console.error('Erro ao abrir Google Maps:', err);
                const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                Linking.openURL(webUrl)
                    .catch(() => Alert.alert('Error', 'No se pudo abrir Google Maps'));
            });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleOpenChat = () => {
        const currentRental = allRentals[currentIndex];
        const isOwner = currentRental.userRole === 'owner';

        // Fechar o modal e navegar para o chat
        setVisible(false);

        if (navigation) {
            // Criar objeto otherUser com estrutura correta
            const otherUserId = isOwner ? currentRental.renter_id : currentRental.owner_id;
            const otherUser = {
                id: otherUserId,
                full_name: isOwner
                    ? (currentRental.renter?.full_name || 'Locatario')
                    : (currentRental.owner?.full_name || 'Propietario'),
            };

            // Criar conversation_id único incluindo ITEM_ID
            const conversationId = [session.user.id, otherUserId].sort().join('_') + '_' + currentRental.item_id;

            navigation.navigate('ChatConversation', {
                itemId: currentRental.item_id,
                item: currentRental.item,
                otherUser: otherUser,
                conversationId: conversationId,
            });
        }
    };

    if (allRentals.length === 0 || !visible) {
        return null;
    }

    const currentRental = allRentals[currentIndex];
    const isOwner = currentRental.userRole === 'owner';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={[styles.header, isOwner ? styles.headerOwner : styles.headerRenter]}>
                            <Text style={styles.headerTitle}>
                                {isOwner ? '📦 Entrega Pendiente' : '🎉 Locación Activa'}
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de Página */}
                        {allRentals.length > 1 && (
                            <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                    style={styles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex > 0) {
                                            const newIndex = currentIndex - 1;
                                            setCurrentIndex(newIndex);
                                            setCodeInput('');
                                        }
                                    }}
                                    disabled={currentIndex === 0}
                                >
                                    <Text
                                        style={[styles.arrowText, currentIndex === 0 && styles.arrowDisabled]}>←</Text>
                                </TouchableOpacity>

                                <View style={styles.dotsContainer}>
                                    {allRentals.map((rental, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                index === currentIndex && styles.dotActive,
                                                rental.userRole === 'owner' ? styles.dotOwner : styles.dotRenter
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Text style={styles.pageIndicator}>
                                    {currentIndex + 1} / {allRentals.length}
                                </Text>

                                <TouchableOpacity
                                    style={styles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex < allRentals.length - 1) {
                                            const newIndex = currentIndex + 1;
                                            console.log('➡️ Navegando para locação', newIndex + 1);
                                            setCurrentIndex(newIndex);
                                            setCodeInput('');
                                        }
                                    }}
                                    disabled={currentIndex === allRentals.length - 1}
                                >
                                    <Text
                                        style={[styles.arrowText, currentIndex === allRentals.length - 1 && styles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Badge de Tipo */}
                        <View style={styles.roleContainer}>
                            <View style={[styles.roleBadge, isOwner ? styles.roleBadgeOwner : styles.roleBadgeRenter]}>
                                <Text style={styles.roleBadgeText}>
                                    {isOwner ? '👤 Tú eres el PROPIETARIO' : '🎒 Tú eres el LOCATARIO'}
                                </Text>
                            </View>
                        </View>

                        {/* Cronômetro */}
                        <View style={[styles.timerContainer, isOwner ? styles.timerOwner : styles.timerRenter]}>
                            <Text style={styles.timerLabel}>
                                {currentRental.status === 'active'
                                    ? (isOwner ? 'Tiempo para devolución:' : 'Tiempo para devolución:')
                                    : (isOwner ? 'Tiempo para entrega:' : 'Tiempo para recogida:')
                                }
                            </Text>
                            <Text
                                style={[styles.timerValue, isOwner ? styles.timerValueOwner : styles.timerValueRenter]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {timeRemaining}
                            </Text>
                        </View>

                        {/* Dados da Locação */}
                        <View style={styles.detailsContainer}>
                            <Text style={styles.itemTitle}>{currentRental.item?.title || 'Item'}</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Recogida:</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(currentRental.start_date)} - {currentRental.pickup_time || '10:00'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Devolución:</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(currentRental.end_date)} - {currentRental.return_time || '18:00'}
                                </Text>
                            </View>

                            {isOwner ? (
                                <>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>👤 Locatario:</Text>
                                        <Text style={styles.detailValue}>
                                            {currentRental.renter?.full_name || 'Usuario'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>💰 Total a Recibir:</Text>
                                        <Text style={[styles.detailValue, styles.priceText]}>
                                            €{calculateOwnerAmount(currentRental).toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Campo de Código para Owner - APENAS se status = 'approved' */}
                                    {currentRental.status === 'approved' && (
                                        <View style={styles.codeInputContainer}>
                                            <Text style={styles.codeInputLabel}>Código del Locatario:</Text>
                                            <TextInput
                                                style={styles.codeInput}
                                                value={codeInput}
                                                onChangeText={setCodeInput}
                                                placeholder="000000"
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                placeholderTextColor="#999"
                                            />
                                            <Text style={styles.codeInputHint}>
                                                El locatario debe mostrarte su código de 6 dígitos después de confirmar que
                                                el artículo está de acuerdo con lo anunciado.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Owner Code - Sempre visível, mas destaque diferente se active */}
                                    <View style={[
                                        styles.ownerCodeContainer,
                                        currentRental.status === 'active' && styles.ownerCodeContainerHighlight
                                    ]}>
                                        <Text style={[
                                            styles.ownerCodeLabel,
                                            currentRental.status === 'active' && styles.ownerCodeLabelHighlight
                                        ]}>
                                            {currentRental.status === 'active'
                                                ? '⏳ Aguardando Devolución - Tu Código:'
                                                : 'Tu Código de Devolución:'
                                            }
                                        </Text>
                                        <View style={[
                                            styles.ownerCodeBadge,
                                            currentRental.status === 'active' && styles.ownerCodeBadgeHighlight
                                        ]}>
                                            <Text style={[
                                                styles.ownerCodeValue,
                                                currentRental.status === 'active' && styles.ownerCodeValueHighlight
                                            ]}>
                                                {currentRental.owner_code || '------'}
                                            </Text>
                                        </View>
                                        <Text style={styles.ownerCodeHint}>
                                            {currentRental.status === 'active'
                                                ? '✅ Artículo entregado. Muestra este código al locatario cuando devuelva el artículo en buenas condiciones.'
                                                : 'Debes proporcionar este código al locatario después de garantizar que el artículo ha sido devuelto en las mismas condiciones en que fue retirado.'
                                            }
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>👤 Propietario:</Text>
                                        <Text style={styles.detailValue}>
                                            {currentRental.owner?.full_name || 'Usuario'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>📍 Dirección:</Text>
                                        <Text style={styles.detailValue}>
                                            {currentRental.owner?.address}, {currentRental.owner?.city}
                                        </Text>
                                    </View>

                                    {/* Se status é 'approved': Mostra código para retirada */}
                                    {currentRental.status === 'approved' && (
                                        <View style={styles.renterCodeContainer}>
                                            <Text style={styles.renterCodeLabel}>Código de Recogida:</Text>
                                            <View style={styles.renterCodeBadge}>
                                                <Text style={styles.renterCodeValue}>
                                                    {currentRental.renter_code || '------'}
                                                </Text>
                                            </View>
                                            <Text style={styles.renterCodeHint}>
                                                Entrega este código al propietario del artículo después de confirmar que
                                                el
                                                artículo está de acuerdo con lo anunciado.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Se status é 'active': Mostra campo para digitar código de devolução */}
                                    {currentRental.status === 'active' && (
                                        <>
                                            <View style={styles.returnWarning}>
                                                <Text style={styles.returnWarningIcon}>⏰</Text>
                                                <Text style={styles.returnWarningText}>
                                                    Artículo en locación. Debes devolverlo hasta
                                                    el {formatDate(currentRental.end_date)} a
                                                    las {currentRental.return_time || '18:00'}.
                                                </Text>
                                            </View>

                                            <View style={styles.codeInputContainer}>
                                                <Text style={styles.codeInputLabel}>Código de Devolución del
                                                    Propietario:</Text>
                                                <TextInput
                                                    style={styles.codeInput}
                                                    value={codeInput}
                                                    onChangeText={setCodeInput}
                                                    placeholder="000000"
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                    placeholderTextColor="#999"
                                                />
                                                <Text style={styles.codeInputHint}>
                                                    El propietario debe mostrarte su código de 6 dígitos después de
                                                    verificar que el artículo está en buenas condiciones
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Botões */}
                        <View style={styles.buttonsContainer}>
                            {isOwner ? (
                                <>
                                    {currentRental.status === 'approved' ? (
                                        <TouchableOpacity
                                            style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                                            onPress={handleConfirmAction}
                                            disabled={confirming}
                                        >
                                            <Text style={styles.confirmButtonText}>
                                                {confirming ? 'Confirmando...' : '✓ Confirmar Entrega'}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.waitingContainer}>
                                            <Text style={styles.waitingIcon}>⏳</Text>
                                            <Text style={styles.waitingText}>
                                                Aguardando devolución del artículo
                                            </Text>
                                            <Text style={styles.waitingSubtext}>
                                                El locatario debe devolver el artículo y confirmar con tu código
                                            </Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    {currentRental.status === 'approved' ? (
                                        <>
                                            <TouchableOpacity
                                                style={styles.mapsButton}
                                                onPress={() => openMaps(currentRental)}
                                            >
                                                <Text style={styles.mapsButtonIcon}>📍</Text>
                                                <Text style={styles.mapsButtonText}>Iniciar Pick Up</Text>
                                            </TouchableOpacity>

                                            {/* Botões de Editar e Cancelar para o Renter */}
                                            <View style={styles.actionButtonsRow}>
                                                <TouchableOpacity
                                                    style={styles.editRentalButton}
                                                    onPress={() => handleEditRental(currentRental)}
                                                >
                                                    <Ionicons name="pencil" size={18} color="#fff" />
                                                    <Text style={styles.editRentalButtonText}>Editar</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.cancelRentalButton}
                                                    onPress={() => handleCancelRental(currentRental)}
                                                >
                                                    <Ionicons name="close-circle" size={18} color="#fff" />
                                                    <Text style={styles.cancelRentalButtonText}>Cancelar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                                            onPress={handleConfirmAction}
                                            disabled={confirming}
                                        >
                                            <Text style={styles.confirmButtonText}>
                                                {confirming ? 'Confirmando...' : '✓ Confirmar Devolución'}
                                            </Text>
                                        </TouchableOpacity>
                                )}
                            </>
                            )}

                            {/* Botão de Chat - Sempre visível */}
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={handleOpenChat}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{marginRight: 8}} />
                                <Text style={styles.chatButtonText}>
                                    Chatear con {isOwner
                                        ? (currentRental.renter?.full_name || 'Locatario')
                                        : (currentRental.owner?.full_name || 'Propietario')
                                    }
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={styles.closeModalButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerRenter: {
        backgroundColor: '#10B981',
    },
    headerOwner: {
        backgroundColor: '#2c4455',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 15,
    },
    arrowButton: {
        padding: 8,
    },
    arrowText: {
        fontSize: 24,
        color: '#2c4455',
        fontWeight: 'bold',
    },
    arrowDisabled: {
        color: '#D1D5DB',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
    },
    dotActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotRenter: {
        backgroundColor: '#10B981',
    },
    dotOwner: {
        backgroundColor: '#2c4455',
    },
    pageIndicator: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    roleContainer: {
        padding: 15,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    roleBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    roleBadgeRenter: {
        backgroundColor: '#D1FAE5',
    },
    roleBadgeOwner: {
        backgroundColor: '#DBEAFE',
    },
    roleBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    timerContainer: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    timerRenter: {
        backgroundColor: '#EFF6FF',
    },
    timerOwner: {
        backgroundColor: '#F0F9FF',
    },
    timerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    timerValue: {
        fontSize: 32,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
    },
    timerValueRenter: {
        color: '#10B981',
    },
    timerValueOwner: {
        color: '#2c4455',
    },
    detailsContainer: {
        padding: 20,
    },
    itemTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a3a52',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabel: {
        fontSize: 15,
        color: '#666',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        marginLeft: 10,
    },
    priceText: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 16,
    },
    codeInputContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2c4455',
    },
    codeInputLabel: {
        fontSize: 14,
        color: '#2c4455',
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    codeInput: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        fontVariant: ['tabular-nums'],
    },
    codeInputHint: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    ownerCodeContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F59E0B',
        borderStyle: 'dashed',
    },
    ownerCodeLabel: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    ownerCodeBadge: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    ownerCodeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F59E0B',
        letterSpacing: 4,
        fontVariant: ['tabular-nums'],
    },
    ownerCodeHint: {
        fontSize: 12,
        color: '#92400E',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Estilos de destaque quando status = 'active'
    ownerCodeContainerHighlight: {
        backgroundColor: '#DBEAFE',
        borderColor: '#2563EB',
        borderWidth: 3,
        borderStyle: 'solid',
    },
    ownerCodeLabelHighlight: {
        color: '#1E40AF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ownerCodeBadgeHighlight: {
        backgroundColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    ownerCodeValueHighlight: {
        color: '#fff',
        fontSize: 36,
    },
    renterCodeContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#D1FAE5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    renterCodeLabel: {
        fontSize: 14,
        color: '#065F46',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    renterCodeBadge: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    renterCodeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
        letterSpacing: 4,
        fontVariant: ['tabular-nums'],
    },
    renterCodeHint: {
        fontSize: 12,
        color: '#065F46',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    returnWarning: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    returnWarningIcon: {
        fontSize: 24,
    },
    returnWarningText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        fontWeight: '600',
    },
    buttonsContainer: {
        padding: 20,
        gap: 12,
    },
    confirmButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    mapsButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mapsButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    mapsButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    waitingContainer: {
        backgroundColor: '#F3F4F6',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
    },
    waitingIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    waitingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
    },
    waitingSubtext: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    chatButton: {
        backgroundColor: '#2c4455',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#2c4455',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 12,
    },
    chatButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeModalButton: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    editRentalButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    editRentalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    cancelRentalButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    cancelRentalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default UnifiedRentalModal;

