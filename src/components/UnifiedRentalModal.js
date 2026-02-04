import React, {useState, useEffect, useRef} from 'react';
import {View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Linking,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {supabase} from '../../supabase';
import { useTranslation } from 'react-i18next';
import ReturnDisputeModal from './ReturnDisputeModal';
import { unifiedRentalStyles } from '../styles/components/unifiedRentalStyles';

const UnifiedRentalModal = ({session, navigation, showOnMount = false}) => {
    const { t } = useTranslation();
    const [allRentals, setAllRentals] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [disputeModalVisible, setDisputeModalVisible] = useState(false);
    const [selectedRentalForDispute, setSelectedRentalForDispute] = useState(null);
    const [hasShownOnMount, setHasShownOnMount] = useState(false);
    const previousShowOnMount = useRef(showOnMount);

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

    // Detectar quando showOnMount muda (quando clica no botão Locaciones)
    useEffect(() => {
        console.log('🔄 useEffect executado - showOnMount:', showOnMount, 'previous:', previousShowOnMount.current);

        // IMPORTANTE: Atualizar ref ANTES de verificar
        const previous = previousShowOnMount.current;
        previousShowOnMount.current = showOnMount;

        // Detectar mudança de false -> true (clique no botão)
        const wasClicked = !previous && showOnMount;

        console.log('❓ wasClicked:', wasClicked, 'session:', !!session?.user?.id);

        if (wasClicked && session?.user?.id) {
            console.log('🔘 Botão clicado - buscando rentals...');
            fetchAllRentals().then((rentals) => {
                console.log('📊 Rentals retornados:', rentals?.length || 0);
                if (rentals && rentals.length > 0) {
                    console.log('✅ Abrindo modal');
                    setVisible(true);
                } else {
                    console.log('⚠️ Mostrando alert - sem rentals');
                    Alert.alert(
                        t('dispute.noActiveRentals') || 'Sin Locaciones Activas',
                        t('dispute.noActiveRentalsMessage') || 'No tienes locaciones activas en este momento.',
                        [{text: 'OK'}]
                    );
                }
            }).catch(error => {
                console.error('❌ Erro ao buscar rentals:', error);
                Alert.alert(
                    'Error',
                    'No se pudo cargar las locaciones. Por favor, intenta de nuevo.',
                    [{text: 'OK'}]
                );
            });
        }
    }, [showOnMount]);

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

            // Ordenar por data
            combinedRentals.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            setAllRentals(combinedRentals);

            // Só mostrar automaticamente se:
            // 1. showOnMount é true (primeira vez que loga)
            // 2. Ainda não mostrou neste mount
            // 3. Tem locações ativas
            if (combinedRentals.length > 0 && showOnMount && !hasShownOnMount) {
                setVisible(true);
                setHasShownOnMount(true);
                updateTimeRemaining(combinedRentals[0]);
            } else if (combinedRentals.length === 0 && showOnMount && !hasShownOnMount) {
                // Se não tem locações mas clicou no botão, mostrar mensagem
                setHasShownOnMount(true);
            }

            // Retornar os rentals para uso em callbacks
            return combinedRentals;
        } catch (error) {
            console.error('Erro ao buscar locações:', error);
            return [];
        }
    };

    const updateTimeRemaining = (rental = allRentals[currentIndex]) => {
        if (!rental || !rental.start_date || !rental.pickup_time) {
            setTimeRemaining('Calculando...');
            return;
        }

        const now = new Date();

        // Extrair data e horário de retirada
        const startDateMatch = rental.start_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        const endDateMatch = rental.end_date.match(/^(\d{4})-(\d{2})-(\d{2})/);

        if (!startDateMatch || !endDateMatch) {
            setTimeRemaining('Fecha inválida');
            return;
        }

        const startYear = parseInt(startDateMatch[1], 10);
        const startMonth = parseInt(startDateMatch[2], 10);
        const startDay = parseInt(startDateMatch[3], 10);

        const endYear = parseInt(endDateMatch[1], 10);
        const endMonth = parseInt(endDateMatch[2], 10);
        const endDay = parseInt(endDateMatch[3], 10);

        // Extrair horários - pode vir como HH:MM ou HH:MM:SS
        const pickupTimeParts = rental.pickup_time.split(':');
        const pickupHour = parseInt(pickupTimeParts[0], 10);
        const pickupMinute = parseInt(pickupTimeParts[1], 10);

        const returnTimeParts = (rental.return_time || '18:00').split(':');
        const returnHour = parseInt(returnTimeParts[0], 10);
        const returnMinute = parseInt(returnTimeParts[1], 10);

        // Criar Date objects no timezone local
        // Mês é 0-indexed (Janeiro = 0, Dezembro = 11)
        const pickupDateTime = new Date(startYear, startMonth - 1, startDay, pickupHour, pickupMinute, 0);
        const returnDateTime = new Date(endYear, endMonth - 1, endDay, returnHour, returnMinute, 0);

        // Validar datas
        if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
            setTimeRemaining('Fecha inválida');
            return;
        }

        // Se status é 'active' OU já passou horário de retirada, mostrar tempo até DEVOLUÇÃO
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

            const totalSeconds = Math.floor(diffReturn / 1000);
            const days = Math.floor(totalSeconds / (60 * 60 * 24));
            const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m`);
            } else {
                setTimeRemaining(`${minutes}m`);
            }
            return;
        }

        // Caso contrário, mostrar tempo até RETIRADA (status approved)
        const diffPickup = pickupDateTime - now;

        if (diffPickup <= 0) {
            if (rental.userRole === 'renter') {
                setTimeRemaining('⏰ Hora de recoger el artículo');
            } else {
                setTimeRemaining('⏰ Hora de entregar el artículo');
            }
            return;
        }

        const totalSeconds = Math.floor(diffPickup / 1000);
        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

        if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
            setTimeRemaining(`${minutes}m`);
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
                        'El código ingresado no coincide. Por favor, solicita el código correto ao proprietário.',
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
                'Esta solicitud ya fue aprobada. Los cambios volverán la solicitud a estado PENDIENTE e necesitará nova aprovação.\n\n¿Deseas continuar?',
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

    const handleOwnerCancelRental = (rental) => {
        Alert.prompt(
            'Cancelar Locación',
            'Por favor, indica el motivo del cancelamento para informar al locatario:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar Cancelamento',
                    style: 'destructive',
                    onPress: async (cancellationReason) => {
                        if (!cancellationReason || cancellationReason.trim() === '') {
                            Alert.alert('Atención', 'Debes proporcionar un motivo para cancelar la locación.');
                            return;
                        }

                        try {
                            // Marcar como cancelado
                            const { error } = await supabase
                                .from('rentals')
                                .update({
                                    status: 'cancelled',
                                    rejection_reason: cancellationReason.trim()
                                })
                                .eq('id', rental.id);

                            if (error) throw error;

                            // Remover bloqueios de data
                            await supabase
                                .from('item_availability')
                                .delete()
                                .eq('rental_id', rental.id);

                            // Notificar locatário com o motivo
                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: rental.renter_id,
                                    type: 'rental_cancelled',
                                    title: 'Locación Cancelada por el Propietario',
                                    message: `El propietario canceló la locación de "${rental.item?.title}".\n\nMotivo: ${cancellationReason.trim()}`,
                                    related_id: rental.id,
                                    read: false,
                                });

                            Alert.alert('Éxito', 'Locación cancelada correctamente');

                            // Atualizar lista
                            const updatedRentals = allRentals.filter(r => r.id !== rental.id);
                            setAllRentals(updatedRentals);

                            if (updatedRentals.length === 0) {
                                setVisible(false);
                            } else if (currentIndex >= updatedRentals.length) {
                                setCurrentIndex(updatedRentals.length - 1);
                            }
                        } catch (error) {
                            console.error('Erro ao cancelar locação:', error);
                            Alert.alert('Error', 'No se pudo cancelar la locación');
                        }
                    }
                }
            ],
            'plain-text'
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
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} de ${month} de ${year}`;
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
            <View style={unifiedRentalStyles.modalOverlay}>
                <ScrollView
                    contentContainerStyle={unifiedRentalStyles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={unifiedRentalStyles.modalContent}>
                        {/* Header */}
                        <View style={[unifiedRentalStyles.header, isOwner ? unifiedRentalStyles.headerOwner : unifiedRentalStyles.headerRenter]}>
                            <Text style={unifiedRentalStyles.headerTitle}>
                                {isOwner ? `📦 ${t('rental.pendingDelivery')}` : `🎉 ${t('rental.activeRental')}`}
                            </Text>
                            <TouchableOpacity
                                style={unifiedRentalStyles.closeButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={unifiedRentalStyles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de Página */}
                        {allRentals.length > 1 && (
                            <View style={unifiedRentalStyles.paginationContainer}>
                                <TouchableOpacity
                                    style={unifiedRentalStyles.arrowButton}
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
                                        style={[unifiedRentalStyles.arrowText, currentIndex === 0 && unifiedRentalStyles.arrowDisabled]}>←</Text>
                                </TouchableOpacity>

                                <View style={unifiedRentalStyles.dotsContainer}>
                                    {allRentals.map((rental, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                unifiedRentalStyles.dot,
                                                index === currentIndex && unifiedRentalStyles.dotActive,
                                                rental.userRole === 'owner' ? unifiedRentalStyles.dotOwner : unifiedRentalStyles.dotRenter
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Text style={unifiedRentalStyles.pageIndicator}>
                                    {currentIndex + 1} / {allRentals.length}
                                </Text>

                                <TouchableOpacity
                                    style={unifiedRentalStyles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex < allRentals.length - 1) {
                                            const newIndex = currentIndex + 1;
                                            setCurrentIndex(newIndex);
                                            setCodeInput('');
                                        }
                                    }}
                                    disabled={currentIndex === allRentals.length - 1}
                                >
                                    <Text
                                        style={[unifiedRentalStyles.arrowText, currentIndex === allRentals.length - 1 && unifiedRentalStyles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Badge de Tipo */}
                        <View style={unifiedRentalStyles.roleContainer}>
                            <View style={[unifiedRentalStyles.roleBadge, isOwner ? unifiedRentalStyles.roleBadgeOwner : unifiedRentalStyles.roleBadgeRenter]}>
                                <Text style={unifiedRentalStyles.roleBadgeText}>
                                    {isOwner ? '👤 Tú eres el PROPIETARIO' : '🎒 Tú eres el LOCATARIO'}
                                </Text>
                            </View>
                        </View>

                        {/* Cronômetro */}
                        <View style={[unifiedRentalStyles.timerContainer, isOwner ? unifiedRentalStyles.timerOwner : unifiedRentalStyles.timerRenter]}>
                            <Text style={unifiedRentalStyles.timerLabel}>
                                {currentRental.status === 'active'
                                    ? (isOwner ? 'Tiempo para devolución:' : 'Tiempo para devolución:')
                                    : (isOwner ? 'Tiempo para entrega:' : 'Tiempo para recogida:')
                                }
                            </Text>
                            <Text
                                style={[unifiedRentalStyles.timerValue, isOwner ? unifiedRentalStyles.timerValueOwner : unifiedRentalStyles.timerValueRenter]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {timeRemaining}
                            </Text>
                        </View>

                        {/* Dados da Locação */}
                        <View style={unifiedRentalStyles.detailsContainer}>
                            <Text style={unifiedRentalStyles.itemTitle}>{currentRental.item?.title || 'Item'}</Text>

                            <View style={unifiedRentalStyles.detailRow}>
                                <Text style={unifiedRentalStyles.detailLabel}>📅 Recogida:</Text>
                                <Text style={unifiedRentalStyles.detailValue}>
                                    {formatDate(currentRental.start_date)} - {currentRental.pickup_time || '10:00'}
                                </Text>
                            </View>

                            <View style={unifiedRentalStyles.detailRow}>
                                <Text style={unifiedRentalStyles.detailLabel}>📅 Devolución:</Text>
                                <Text style={unifiedRentalStyles.detailValue}>
                                    {formatDate(currentRental.end_date)} - {currentRental.return_time || '18:00'}
                                </Text>
                            </View>

                            {isOwner ? (
                                <>
                                    <View style={unifiedRentalStyles.detailRow}>
                                        <Text style={unifiedRentalStyles.detailLabel}>👤 Locatario:</Text>
                                        <Text style={unifiedRentalStyles.detailValue}>
                                            {currentRental.renter?.full_name || 'Usuario'}
                                        </Text>
                                    </View>

                                    <View style={unifiedRentalStyles.detailRow}>
                                        <Text style={unifiedRentalStyles.detailLabel}>💰 Total a Recibir:</Text>
                                        <Text style={[unifiedRentalStyles.detailValue, unifiedRentalStyles.priceText]}>
                                            €{calculateOwnerAmount(currentRental).toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Campo de Código para Owner - APENAS se status = 'approved' */}
                                    {currentRental.status === 'approved' && (
                                        <View style={unifiedRentalStyles.codeInputContainer}>
                                            <Text style={unifiedRentalStyles.codeInputLabel}>Código del Locatario:</Text>
                                            <TextInput
                                                style={unifiedRentalStyles.codeInput}
                                                value={codeInput}
                                                onChangeText={setCodeInput}
                                                placeholder="000000"
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                placeholderTextColor="#999"
                                            />
                                            <Text style={unifiedRentalStyles.codeInputHint}>
                                                El locatario debe mostrarte su código de 6 dígitos después de confirmar que
                                                el artículo está de acuerdo con lo anunciado.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Owner Code - Sempre visível, mas destaque diferente se active */}
                                    <View style={[
                                        unifiedRentalStyles.ownerCodeContainer,
                                        currentRental.status === 'active' && unifiedRentalStyles.ownerCodeContainerHighlight
                                    ]}>
                                        <Text style={[
                                            unifiedRentalStyles.ownerCodeLabel,
                                            currentRental.status === 'active' && unifiedRentalStyles.ownerCodeLabelHighlight
                                        ]}>
                                            {currentRental.status === 'active'
                                                ? '⏳ Aguardando Devolução - Tu Código:'
                                                : 'Tu Código de Devolução:'
                                            }
                                        </Text>
                                        <View style={[
                                            unifiedRentalStyles.ownerCodeBadge,
                                            currentRental.status === 'active' && unifiedRentalStyles.ownerCodeBadgeHighlight
                                        ]}>
                                            <Text style={[
                                                unifiedRentalStyles.ownerCodeValue,
                                                currentRental.status === 'active' && unifiedRentalStyles.ownerCodeValueHighlight
                                            ]}>
                                                {currentRental.owner_code || '------'}
                                            </Text>
                                        </View>
                                        <Text style={unifiedRentalStyles.ownerCodeHint}>
                                            {currentRental.status === 'active'
                                                ? '✅ Artículo entregado. Muestra este código al locatario cuando devuelva el artículo en buenas condiciones.'
                                                : 'Debes proporcionar este código al locatario después de garantizar que el artículo ha sido devuelto en las mismas condiciones en que fue retirado.'
                                            }
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={unifiedRentalStyles.detailRow}>
                                        <Text style={unifiedRentalStyles.detailLabel}>👤 Propietario:</Text>
                                        <Text style={unifiedRentalStyles.detailValue}>
                                            {currentRental.owner?.full_name || 'Usuario'}
                                        </Text>
                                    </View>

                                    <View style={unifiedRentalStyles.detailRow}>
                                        <Text style={unifiedRentalStyles.detailLabel}>📍 Dirección:</Text>
                                        <Text style={unifiedRentalStyles.detailValue}>
                                            {currentRental.owner?.address}, {currentRental.owner?.city}
                                        </Text>
                                    </View>

                                    {/* Se status é 'approved': Mostra código para retirada */}
                                    {currentRental.status === 'approved' && (
                                        <View style={unifiedRentalStyles.renterCodeContainer}>
                                            <Text style={unifiedRentalStyles.renterCodeLabel}>Código de Recogida:</Text>
                                            <View style={unifiedRentalStyles.renterCodeBadge}>
                                                <Text style={unifiedRentalStyles.renterCodeValue}>
                                                    {currentRental.renter_code || '------'}
                                                </Text>
                                            </View>
                                            <Text style={unifiedRentalStyles.renterCodeHint}>
                                                Entrega este código al proprietário del artículo después de confirmar que
                                                el
                                                artículo está de acuerdo con lo anunciado.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Se status é 'active': Mostra campo para digitar código de devolução */}
                                    {currentRental.status === 'active' && (
                                        <>
                                            <View style={unifiedRentalStyles.returnWarning}>
                                                <Text style={unifiedRentalStyles.returnWarningIcon}>⏰</Text>
                                                <Text style={unifiedRentalStyles.returnWarningText}>
                                                    Artículo en locação. Debes devolverlo hasta
                                                    el {formatDate(currentRental.end_date)} a
                                                    las {currentRental.return_time || '18:00'}.
                                                </Text>
                                            </View>

                                            <View style={unifiedRentalStyles.codeInputContainer}>
                                                <Text style={unifiedRentalStyles.codeInputLabel}>Código de Devolución del
                                                    Propietario:</Text>
                                                <TextInput
                                                    style={unifiedRentalStyles.codeInput}
                                                    value={codeInput}
                                                    onChangeText={setCodeInput}
                                                    placeholder="000000"
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                    placeholderTextColor="#999"
                                                />
                                                <Text style={unifiedRentalStyles.codeInputHint}>
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
                        <View style={unifiedRentalStyles.buttonsContainer}>
                            {isOwner ? (
                                <>
                                    {currentRental.status === 'approved' ? (
                                        <>
                                            <TouchableOpacity
                                                style={[unifiedRentalStyles.confirmButton, confirming && unifiedRentalStyles.confirmButtonDisabled]}
                                                onPress={handleConfirmAction}
                                                disabled={confirming}
                                            >
                                                <Text style={unifiedRentalStyles.confirmButtonText}>
                                                    {confirming ? 'Confirmando...' : '✓ Confirmar Entrega'}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Botão de Cancelar - APENAS quando status = 'approved' */}
                                            <TouchableOpacity
                                                style={unifiedRentalStyles.cancelRentalButton}
                                                onPress={() => handleOwnerCancelRental(currentRental)}
                                            >
                                                <Ionicons name="close-circle" size={18} color="#fff" />
                                                <Text style={unifiedRentalStyles.cancelRentalButtonText}>Cancelar Locación</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <View style={unifiedRentalStyles.waitingContainer}>
                                                <Text style={unifiedRentalStyles.waitingIcon}>⏳</Text>
                                                <Text style={unifiedRentalStyles.waitingText}>
                                                    Aguardando devolução do artigo
                                                </Text>
                                                <Text style={unifiedRentalStyles.waitingSubtext}>
                                                    O locatário deve devolver o artigo e confirmar com seu código
                                                </Text>
                                            </View>

                                            {/* Botão de Reportar Problema - APENAS quando status = 'active' */}
                                            <TouchableOpacity
                                                style={unifiedRentalStyles.reportProblemButton}
                                                onPress={() => {
                                                    setSelectedRentalForDispute(currentRental);
                                                    setDisputeModalVisible(true);
                                                }}
                                            >
                                                <Text style={unifiedRentalStyles.reportProblemButtonIcon}>⚠️</Text>
                                                <Text style={unifiedRentalStyles.reportProblemButtonText}>
                                                    {t('dispute.itemReturnedWithProblem')}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {currentRental.status === 'approved' ? (
                                        <>
                                            <TouchableOpacity
                                                style={unifiedRentalStyles.mapsButton}
                                                onPress={() => openMaps(currentRental)}
                                            >
                                                <Text style={unifiedRentalStyles.mapsButtonIcon}>📍</Text>
                                                <Text style={unifiedRentalStyles.mapsButtonText}>Iniciar Pick Up</Text>
                                            </TouchableOpacity>

                                            {/* Botões de Editar e Cancelar para o Renter */}
                                            <View style={unifiedRentalStyles.actionButtonsRow}>
                                                <TouchableOpacity
                                                    style={unifiedRentalStyles.editRentalButton}
                                                    onPress={() => handleEditRental(currentRental)}
                                                >
                                                    <Ionicons name="pencil" size={18} color="#fff" />
                                                    <Text style={unifiedRentalStyles.editRentalButtonText}>Editar</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={unifiedRentalStyles.cancelRentalButton}
                                                    onPress={() => handleCancelRental(currentRental)}
                                                >
                                                    <Ionicons name="close-circle" size={18} color="#fff" />
                                                    <Text style={unifiedRentalStyles.cancelRentalButtonText}>Cancelar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <TouchableOpacity
                                            style={[unifiedRentalStyles.confirmButton, confirming && unifiedRentalStyles.confirmButtonDisabled]}
                                            onPress={handleConfirmAction}
                                            disabled={confirming}
                                        >
                                            <Text style={unifiedRentalStyles.confirmButtonText}>
                                                {confirming ? 'Confirmando...' : '✓ Confirmar Devolução'}
                                            </Text>
                                        </TouchableOpacity>
                                )}
                            </>
                            )}

                            {/* Botão de Chat - Sempre visível */}
                            <TouchableOpacity
                                style={unifiedRentalStyles.chatButton}
                                onPress={handleOpenChat}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{marginRight: 8}} />
                                <Text style={unifiedRentalStyles.chatButtonText}>
                                    Chatear com {isOwner
                                        ? (currentRental.renter?.full_name || 'Locatario')
                                        : (currentRental.owner?.full_name || 'Propietario')
                                    }
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={unifiedRentalStyles.closeModalButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={unifiedRentalStyles.closeModalButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Modal de Disputa */}
            <ReturnDisputeModal
                visible={disputeModalVisible}
                rental={selectedRentalForDispute}
                onClose={() => {
                    setDisputeModalVisible(false);
                    setSelectedRentalForDispute(null);
                }}
                onDisputeCreated={() => {
                    // Recarregar locações e fechar modal principal
                    fetchAllRentals();
                    setVisible(false);
                }}
            />
        </Modal>
    );
};



export default UnifiedRentalModal;

