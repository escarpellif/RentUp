import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RentalCalendar from '../components/RentalCalendar';
import { supabase } from '../../supabase';
import { handleApiError } from '../utils/errorHandler';
import { withTimeout } from '../utils/apiHelpers';
import { requestRentalStyles } from '../styles/screens/requestRentalStyles';

export default function RequestRentalScreen({ route, navigation, session }) {
    const { item, ownerProfile, bookingDates, editingRental } = route.params || {};

    // Função para calcular horário default (2 horas à frente)
    const getDefaultTime = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calcular horário mínimo (2 horas à frente)
        // Se tem minutos, arredonda para a próxima hora + 1
        const minimumHour = currentMinute > 0 ? currentHour + 2 : currentHour + 2;

        // Garantir que não ultrapasse 23:00 e não seja menor que 6:00
        const finalHour = Math.max(6, Math.min(minimumHour, 23));

        return `${finalHour.toString().padStart(2, '0')}:00`;
    };

    // Se estiver editando, usar dados do rental existente
    const initialStart = editingRental
        ? new Date(editingRental.start_date)
        : (bookingDates && bookingDates.startDate ? new Date(bookingDates.startDate) : new Date());
    const initialEnd = editingRental
        ? new Date(editingRental.end_date)
        : (bookingDates && bookingDates.endDate ? new Date(bookingDates.endDate) : new Date(Date.now() + 86400000));

    // Usar horário dinâmico se não estiver editando
    const defaultTime = getDefaultTime();
    const initialPickupTime = editingRental?.pickup_time || defaultTime;
    const initialReturnTime = editingRental?.return_time || defaultTime;
    const initialDeliveryMethod = editingRental?.delivery_method || 'pickup';

    const [startDate, setStartDate] = useState(initialStart);
    const [endDate, setEndDate] = useState(initialEnd);
    const [showCalendar, setShowCalendar] = useState(false);
    const [pickupTime, setPickupTime] = useState(initialPickupTime);
    const [returnTime, setReturnTime] = useState(initialReturnTime);
    const [deliveryMethod, setDeliveryMethod] = useState(initialDeliveryMethod); // 'pickup' ou 'delivery'

    // Callback do calendário
    const handleDateRangeChange = (start, end) => {
        if (start && end) {
            setStartDate(start);
            setEndDate(end);

            // Se a data de início for hoje, atualizar horários para valores válidos
            const now = new Date();
            const isToday = start.toDateString() === now.toDateString();

            if (isToday) {
                const defaultTime = getDefaultTime();
                const currentPickupHour = parseInt(pickupTime.split(':')[0]);
                const minimumHour = parseInt(defaultTime.split(':')[0]);

                // Se o horário atual de pickup é menor que o mínimo, atualizar
                if (currentPickupHour < minimumHour) {
                    setPickupTime(defaultTime);
                    setReturnTime(defaultTime);
                }
            }
        }
    };

    const calculateDays = () => {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };

    const getAvailableHours = () => {
        const now = new Date();
        const isToday = startDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calcular horário mínimo (pelo menos 1 hora de antecedência)
        // Se são 20:11, só pode a partir das 22:00
        // Se são 20:45, só pode a partir das 22:00 (arredonda pra cima)
        const minimumHour = currentMinute > 0 ? currentHour + 2 : currentHour + 1;

        let availableHours = [];

        // Se horário flexível, retorna 06:00 - 23:00
        if (item?.flexible_hours) {
            availableHours = Array.from({length: 18}, (_, i) => {
                const hour = (i + 6).toString().padStart(2, '0');
                return `${hour}:00`;
            });
        } else {
            // Caso contrário, retorna horários específicos configurados

            // Manhã
            if (item?.pickup_morning) {
                const start = parseInt((item.pickup_morning_start || '07:00').split(':')[0]);
                const end = parseInt((item.pickup_morning_end || '12:00').split(':')[0]);
                for (let i = start; i <= end; i++) {
                    availableHours.push(`${i.toString().padStart(2, '0')}:00`);
                }
            }

            // Tarde
            if (item?.pickup_afternoon) {
                const start = parseInt((item.pickup_afternoon_start || '12:00').split(':')[0]);
                const end = parseInt((item.pickup_afternoon_end || '18:00').split(':')[0]);
                for (let i = start; i <= end; i++) {
                    if (!availableHours.includes(`${i.toString().padStart(2, '0')}:00`)) {
                        availableHours.push(`${i.toString().padStart(2, '0')}:00`);
                    }
                }
            }

            // Noite
            if (item?.pickup_evening) {
                const start = parseInt((item.pickup_evening_start || '18:00').split(':')[0]);
                const end = parseInt((item.pickup_evening_end || '23:00').split(':')[0]);
                for (let i = start; i <= end; i++) {
                    if (!availableHours.includes(`${i.toString().padStart(2, '0')}:00`)) {
                        availableHours.push(`${i.toString().padStart(2, '0')}:00`);
                    }
                }
            }

            // Se não houver horários configurados, retorna 06:00 - 23:00 como padrão
            if (availableHours.length === 0) {
                availableHours = Array.from({length: 18}, (_, i) => {
                    const hour = (i + 6).toString().padStart(2, '0');
                    return `${hour}:00`;
                });
            }
        }

        // Filtrar horários passados se for hoje
        if (isToday) {
            const originalCount = availableHours.length;
            availableHours = availableHours.filter(hour => {
                const hourNum = parseInt(hour.split(':')[0]);
                return hourNum >= minimumHour;
            });

            // Se não sobrou nenhum horário disponível hoje
            if (availableHours.length === 0) {
                Alert.alert(
                    'Sem horários disponíveis hoje',
                    `Selecione uma data futura. Hoje só há horários disponíveis a partir das ${minimumHour}:00, mas todos já passaram.`,
                    [{text: 'OK'}]
                );
                return [];
            }
        }

        return availableHours.sort();
    };

    const calculateSubtotal = () => {
        const days = calculateDays();
        // Preço já inclui taxa de 18%
        const priceWithTax = parseFloat(item.price_per_day) * 1.18;
        let subtotal = priceWithTax * days;

        // Aplicar desconto semanal (7+ dias)
        if (days >= 7 && days < 30 && item.discount_week) {
            const discount = parseFloat(item.discount_week) || 0;
            subtotal = subtotal * (1 - discount / 100);
        }

        // Aplicar desconto mensal (30+ dias)
        if (days >= 30 && item.discount_month) {
            const discount = parseFloat(item.discount_month) || 0;
            subtotal = subtotal * (1 - discount / 100);
        }

        return subtotal;
    };

    const calculateServiceFee = () => {
        // Taxa já está incluída no preço
        return 0;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        let total = subtotal;

        // Adicionar taxa de entrega se delivery estiver selecionado e não for gratuito
        if (deliveryMethod === 'delivery' && item?.delivery_fee && !item?.is_free_delivery) {
            total += parseFloat(item.delivery_fee);
        }

        return total.toFixed(2);
    };

    const handleConfirmRental = async () => {
        const days = calculateDays();
        const subtotal = calculateSubtotal();
        const serviceFee = calculateServiceFee();
        const total = calculateTotal();
        
        if (days < 1) {
            Alert.alert('Atención', 'El período de alquiler debe ser de al menos 1 día.');
            return;
        }

        // ✅ VALIDAR: Se for hoje, verificar se o horário ainda é válido
        const now = new Date();
        const isToday = startDate.toDateString() === now.toDateString();

        if (isToday) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const minimumHour = currentMinute > 0 ? currentHour + 2 : currentHour + 1;
            const selectedHour = parseInt(pickupTime.split(':')[0]);

            if (selectedHour < minimumHour) {
                Alert.alert(
                    'Horario No Disponible',
                    `El horario seleccionado (${pickupTime}) ya no está disponible. Por favor, selecciona un horario a partir de las ${minimumHour}:00 o elige otra fecha.`,
                    [{text: 'OK'}]
                );
                return;
            }
        }

        // Validar que o horário de devolução não ultrapasse o período selecionado
        const pickupHour = parseInt(pickupTime.split(':')[0]);
        const returnHour = parseInt(returnTime.split(':')[0]);

        if (returnHour > pickupHour) {
            Alert.alert(
                'Horario Inválido',
                `Para mantener el alquiler de ${days} ${days === 1 ? 'día' : 'días'}, la hora de devolución debe ser hasta las ${pickupTime}.\n\nSi devuelves después, se cobrará un día adicional.`,
                [
                    { text: 'Ajustar Horario', style: 'cancel' },
                    {
                        text: 'Continuar así',
                        onPress: () => proceedWithRental(days, subtotal, serviceFee, total)
                    }
                ]
            );
            return;
        }

        proceedWithRental(days, subtotal, serviceFee, total);
    };

    const proceedWithRental = async (days, subtotal, serviceFee, total) => {
        const depositMessage = item?.deposit_value && item.deposit_value > 0
            ? `\n\nDepósito de Garantía: €${parseFloat(item.deposit_value).toFixed(2)}\n(No saldrá de tu cuenta, solo será bloqueado)`
            : '';

        // ✅ Mensagem adicional se estiver editando locação aprovada/ativa
        const editWarning = editingRental && (editingRental.status === 'approved' || editingRental.status === 'active')
            ? '\n\n⚠️ ATENCIÓN: La solicitud volverá a estado PENDIENTE y necesitará nueva aprobación del anunciante.'
            : '';

        Alert.alert(
            editingRental ? 'Confirmar Edición' : 'Confirmar Solicitud',
            `¿Deseas ${editingRental ? 'guardar los cambios' : 'confirmar el alquiler'}?\n\nArtículo: ${item?.title || 'Sin título'}\nPeríodo: ${days} ${days === 1 ? 'día' : 'días'}\nRecogida: ${formatDate(startDate)} a las ${pickupTime}\nDevolución: ${formatDate(endDate)} a las ${returnTime}\n\n💰 Valor Total: €${total}\n(Tasa de servicio ya incluida)${depositMessage}${editWarning}\n\n${editingRental ? 'Los cambios serán notificados al anunciante.' : 'El anunciante recibirá tu solicitud.'}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: editingRental ? 'Guardar' : 'Confirmar',
                    onPress: async () => {
                        try {
                            if (editingRental) {
                                // MODO EDIÇÃO - Atualizar rental existente

                                // ✅ Se estava aprovado ou ativo, voltar para PENDING e limpar códigos
                                const wasApprovedOrActive = editingRental.status === 'approved' || editingRental.status === 'active';

                                const updateData = {
                                    start_date: startDate.toISOString().split('T')[0], // Salvar apenas YYYY-MM-DD
                                    end_date: endDate.toISOString().split('T')[0], // Salvar apenas YYYY-MM-DD
                                    pickup_time: pickupTime,
                                    return_time: returnTime,
                                    total_days: days,
                                    subtotal: subtotal,
                                    service_fee: serviceFee,
                                    total_amount: parseFloat(total),
                                };

                                // ✅ Se estava aprovado/ativo, resetar para pending e limpar códigos
                                if (wasApprovedOrActive) {
                                    updateData.status = 'pending';
                                    updateData.owner_code = null;
                                    updateData.renter_code = null;
                                    updateData.owner_code_used = false;
                                    updateData.renter_code_used = false;
                                    updateData.pickup_confirmed_at = null;
                                }

                                const { error: updateError } = await supabase
                                    .from('rentals')
                                    .update(updateData)
                                    .eq('id', editingRental.id);

                                if (updateError) throw updateError;

                                // ✅ Se estava aprovado/ativo, remover bloqueio de datas anterior
                                if (wasApprovedOrActive) {
                                    await supabase
                                        .from('item_availability')
                                        .delete()
                                        .eq('rental_id', editingRental.id);
                                }

                                // Notificar o proprietário sobre a mudança
                                const { data: renterProfile } = await supabase
                                    .from('profiles')
                                    .select('username, full_name')
                                    .eq('id', session.user.id)
                                    .single();

                                const renterName = renterProfile?.full_name || renterProfile?.username || 'Alguien';

                                const notificationMessage = wasApprovedOrActive
                                    ? `${renterName} modificó su alquiler de "${item.title}". La solicitud necesita nueva aprobación.`
                                    : `${renterName} actualizó su solicitud de alquiler para "${item.title}"`;

                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: item.owner_id,
                                        type: wasApprovedOrActive ? 'rental_request' : 'rental_updated',
                                        title: wasApprovedOrActive ? 'Nueva Solicitud de Aprobación' : 'Solicitud actualizada',
                                        message: notificationMessage,
                                        related_id: editingRental.id,
                                        read: false,
                                    });

                                const successMessage = wasApprovedOrActive
                                    ? 'Los cambios han sido guardados. La solicitud volverá a estado PENDIENTE y el anunciante necesitará aprobarla nuevamente.'
                                    : 'Los cambios han sido guardados y el anunciante fue notificado.';

                                Alert.alert(
                                    '¡Éxito!',
                                    successMessage,
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => navigation.navigate('HomeScreen')
                                        }
                                    ]
                                );
                            } else {
                                // MODO CRIAÇÃO - Salvar nova solicitação de aluguel
                                const { data: rentalData, error: rentalError } = await supabase
                                    .from('rentals')
                                    .insert({
                                        item_id: item.id,
                                        renter_id: session.user.id,
                                        owner_id: item.owner_id,
                                        start_date: startDate.toISOString().split('T')[0], // Salvar apenas YYYY-MM-DD
                                        end_date: endDate.toISOString().split('T')[0], // Salvar apenas YYYY-MM-DD
                                        pickup_time: pickupTime,
                                        return_time: returnTime,
                                        total_days: days,
                                        price_per_day: parseFloat(item.price_per_day),
                                        subtotal: subtotal,
                                        service_fee: serviceFee,
                                        total_amount: parseFloat(total),
                                        deposit_amount: item?.deposit_value ? parseFloat(item.deposit_value) : 0,
                                        status: 'pending',
                                    })
                                    .select()
                                    .single();

                                if (rentalError) throw rentalError;

                                // Buscar informações do solicitante para a notificação
                                const { data: renterProfile } = await supabase
                                    .from('profiles')
                                    .select('username, full_name')
                                    .eq('id', session.user.id)
                                    .single();

                                const renterName = renterProfile?.full_name || renterProfile?.username || 'Alguien';

                                // Criar notificação para o anunciante
                                const { error: notificationError } = await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: item.owner_id,
                                        type: 'rental_request',
                                        title: `Nueva solicitud de alquiler`,
                                        message: `${renterName} quiere alquilar tu artículo "${item.title}" del ${formatDate(startDate)} al ${formatDate(endDate)}`,
                                        related_id: rentalData?.id,
                                        read: false,
                                    });

                                if (notificationError) {
                                    console.error('Erro ao criar notificação:', notificationError);
                                }

                                Alert.alert(
                                    '¡Éxito!',
                                    'Tu solicitud ha sido enviada al anunciante.',
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => navigation.navigate('HomeScreen')
                                        }
                                    ]
                                );
                            }
                        } catch (error) {
                            console.error('Error al enviar solicitud:', error);
                            handleApiError(error, () => {
                                // Retry automático da submissão
                                Alert.alert(
                                    'Confirmar Alquiler',
                                    `¿Deseas ${editingRental ? 'guardar los cambios' : 'enviar la solicitud'}?`,
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { text: 'Confirmar', onPress: () => {/* retry logic */} }
                                    ]
                                );
                            });
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (date) => {
        // Usar getDate/getMonth/getFullYear para evitar problemas de timezone
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <SafeAreaView style={requestRentalStyles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde - Mesmo layout do ItemDetailsScreen */}
            <View style={requestRentalStyles.headerContainer}>
                <View style={requestRentalStyles.headerTopRow}>
                    {/* Botão Voltar + Título */}
                    <View style={requestRentalStyles.leftHeader}>
                        <TouchableOpacity
                            style={requestRentalStyles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={requestRentalStyles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={requestRentalStyles.headerTitle}>{editingRental ? 'Editar Alquiler' : 'Solicitar Alquiler'}</Text>
                    </View>

                    {/* ALUKO à Direita */}
                    <View style={requestRentalStyles.logoContainer}>
                        <Image
                            source={require('../../assets/images/app-icon.png')}
                            style={requestRentalStyles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={requestRentalStyles.logoText}>ALUKO</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={requestRentalStyles.container}>
            <View style={requestRentalStyles.content}>
                {/* Card: Informações do Item */}
                <View style={requestRentalStyles.card}>
                    <Text style={requestRentalStyles.cardTitle}>📦 Artículo</Text>
                    <Text style={requestRentalStyles.itemTitle}>{item?.title || 'Sin título'}</Text>
                    <Text style={requestRentalStyles.itemPrice}>€{(parseFloat(item?.price_per_day || 0) * 1.18).toFixed(2)} / día</Text>
                    <Text style={requestRentalStyles.ownerName}>Anunciante: {ownerProfile?.full_name || 'Usuario'}</Text>
                </View>

                {/* Card: Seleção de Período */}
                <View style={requestRentalStyles.card}>
                    <Text style={requestRentalStyles.cardTitle}>📅 Período del Alquiler</Text>

                    {/* Botão para mostrar o calendário */}
                    {!showCalendar && (
                        <TouchableOpacity
                            style={requestRentalStyles.selectDatesButton}
                            onPress={() => setShowCalendar(true)}
                        >
                            <Text style={requestRentalStyles.selectDatesText}>Seleccionar Fechas en el Calendario</Text>
                        </TouchableOpacity>
                    )}

                    {/* Calendário (mostra apenas quando showCalendar = true) */}
                    {showCalendar && (
                        <View style={requestRentalStyles.calendarContainer}>
                            <RentalCalendar
                                itemId={item.id}
                                onDateRangeChange={handleDateRangeChange}
                                initialStartDate={startDate}
                                initialEndDate={endDate}
                                excludeRentalId={editingRental?.id}  // ✅ Excluir rental atual ao editar
                            />
                        </View>
                    )}
                </View>

                {/* Card: Método de Entrega (só mostra se item tiver opção de delivery) */}
                {item?.delivery_type === 'delivery' && (
                    <View style={requestRentalStyles.card}>
                        <Text style={requestRentalStyles.cardTitle}>🚚 Método de Entrega</Text>

                        <View style={requestRentalStyles.deliveryMethodContainer}>
                            {/* Opção: Retirar */}
                            <TouchableOpacity
                                style={[requestRentalStyles.deliveryMethodOption, deliveryMethod === 'pickup' && requestRentalStyles.deliveryMethodActive]}
                                onPress={() => setDeliveryMethod('pickup')}
                                activeOpacity={0.7}
                            >
                                <Text style={requestRentalStyles.deliveryMethodIcon}>📍</Text>
                                <Text style={[requestRentalStyles.deliveryMethodText, deliveryMethod === 'pickup' && requestRentalStyles.deliveryMethodTextActive]}>
                                    Recogida en el local
                                </Text>
                                {deliveryMethod === 'pickup' && (
                                    <View style={requestRentalStyles.deliveryMethodCheck}>
                                        <Text style={requestRentalStyles.deliveryMethodCheckText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Opção: Entrega */}
                            <TouchableOpacity
                                style={[requestRentalStyles.deliveryMethodOption, deliveryMethod === 'delivery' && requestRentalStyles.deliveryMethodActive]}
                                onPress={() => setDeliveryMethod('delivery')}
                                activeOpacity={0.7}
                            >
                                <Text style={requestRentalStyles.deliveryMethodIcon}>🚚</Text>
                                <View style={requestRentalStyles.deliveryMethodTextContainer}>
                                    <Text style={[requestRentalStyles.deliveryMethodText, deliveryMethod === 'delivery' && requestRentalStyles.deliveryMethodTextActive]}>
                                        Recibir en casa
                                    </Text>
                                    {item?.is_free_delivery ? (
                                        <Text style={requestRentalStyles.deliveryMethodSubtext}>Gratis</Text>
                                    ) : (
                                        <Text style={requestRentalStyles.deliveryMethodSubtext}>+€{parseFloat(item?.delivery_fee || 0).toFixed(2)}</Text>
                                    )}
                                </View>
                                {deliveryMethod === 'delivery' && (
                                    <View style={requestRentalStyles.deliveryMethodCheck}>
                                        <Text style={requestRentalStyles.deliveryMethodCheckText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {deliveryMethod === 'delivery' && item?.delivery_distance && (
                            <Text style={requestRentalStyles.deliveryNote}>
                                📍 El anunciante entrega hasta {item.delivery_distance} km
                            </Text>
                        )}
                    </View>
                )}

                {/* Card: Horários de Retirada e Devolución - SEMPRE MOSTRA */}
                <View style={requestRentalStyles.card}>
                    <Text style={requestRentalStyles.cardTitle}>⏰ Horarios</Text>

                        {/* Hora de Retirada */}
                        <View style={requestRentalStyles.timeContainer}>
                            <Text style={requestRentalStyles.timeLabel}>Hora de Recogida:</Text>
                            <View style={requestRentalStyles.timeSelector}>
                                <TouchableOpacity
                                    style={requestRentalStyles.timeButton}
                                    onPress={() => {
                                        const hours = getAvailableHours();

                                        Alert.alert(
                                            'Selecciona Hora de Recogida',
                                            '',
                                            hours.map(hour => ({
                                                text: hour,
                                                onPress: () => {
                                                    setPickupTime(hour);
                                                    // Sempre ajustar returnTime para o mesmo horário
                                                    setReturnTime(hour);
                                                }
                                            }))
                                        );
                                    }}
                                >
                                    <Text style={requestRentalStyles.timeIcon}>🕐</Text>
                                    <Text style={requestRentalStyles.timeValue}>{pickupTime}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Hora de Devolución */}
                        <View style={requestRentalStyles.timeContainer}>
                            <Text style={requestRentalStyles.timeLabel}>Hora de Devolución:</Text>
                            <View style={requestRentalStyles.timeSelector}>
                                <TouchableOpacity
                                    style={requestRentalStyles.timeButton}
                                    onPress={() => {
                                        let hours = getAvailableHours();

                                        // Bloquear horários DEPOIS do pickupTime (só permitir igual ou antes)
                                        const pickupHour = parseInt(pickupTime.split(':')[0]);
                                        hours = hours.filter(hour => {
                                            const h = parseInt(hour.split(':')[0]);
                                            return h <= pickupHour;
                                        });

                                        Alert.alert(
                                            'Selecciona Hora de Devolución',
                                            `Para mantener ${calculateDays()} ${calculateDays() === 1 ? 'día' : 'días'}, devuelve hasta las ${pickupTime}`,
                                            hours.map(hour => ({
                                                text: hour,
                                                onPress: () => setReturnTime(hour)
                                            }))
                                        );
                                    }}
                                >
                                    <Text style={requestRentalStyles.timeIcon}>🕐</Text>
                                    <Text style={requestRentalStyles.timeValue}>{returnTime}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                {/* Resumo do Aluguel */}
                <View style={requestRentalStyles.summaryCard}>
                    <Text style={requestRentalStyles.summaryTitle}>Resumen</Text>

                    <View style={requestRentalStyles.summaryRow}>
                        <Text style={requestRentalStyles.summaryLabel}>Fecha de inicio:</Text>
                        <Text style={requestRentalStyles.summaryValue}>{formatDate(startDate)} {pickupTime}</Text>
                    </View>

                    <View style={requestRentalStyles.summaryRow}>
                        <Text style={requestRentalStyles.summaryLabel}>Fecha de término:</Text>
                        <Text style={requestRentalStyles.summaryValue}>{formatDate(endDate)} {returnTime}</Text>
                    </View>

                    <View style={requestRentalStyles.summaryRow}>
                        <Text style={requestRentalStyles.summaryLabel}>Precio por día (con tasa incluida):</Text>
                        <Text style={requestRentalStyles.summaryValue}>€{(parseFloat(item.price_per_day) * 1.18).toFixed(2)}</Text>
                    </View>

                    <View style={requestRentalStyles.summaryRow}>
                        <Text style={requestRentalStyles.summaryLabel}>Días de alquiler:</Text>
                        <Text style={requestRentalStyles.summaryValue}>{calculateDays()} {calculateDays() === 1 ? 'día' : 'días'}</Text>
                    </View>

                    {/* Mostrar desconto aplicado */}
                    {calculateDays() >= 7 && calculateDays() < 30 && item.discount_week && parseFloat(item.discount_week) > 0 && (
                        <View style={requestRentalStyles.summaryRow}>
                            <Text style={requestRentalStyles.discountLabel}>🎉 Descuento Semanal ({parseFloat(item.discount_week)}%):</Text>
                            <Text style={requestRentalStyles.discountValue}>-€{((parseFloat(item.price_per_day) * 1.18 * calculateDays()) * (parseFloat(item.discount_week) / 100)).toFixed(2)}</Text>
                        </View>
                    )}

                    {calculateDays() >= 30 && item.discount_month && parseFloat(item.discount_month) > 0 && (
                        <View style={requestRentalStyles.summaryRow}>
                            <Text style={requestRentalStyles.discountLabel}>🎉 Descuento Mensual ({parseFloat(item.discount_month)}%):</Text>
                            <Text style={requestRentalStyles.discountValue}>-€{((parseFloat(item.price_per_day) * 1.18 * calculateDays()) * (parseFloat(item.discount_month) / 100)).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={requestRentalStyles.divider} />

                    {/* Taxa de Entrega (se aplicável) */}
                    {deliveryMethod === 'delivery' && item?.delivery_fee && !item?.is_free_delivery && (
                        <View style={requestRentalStyles.summaryRow}>
                            <Text style={requestRentalStyles.summaryLabel}>🚚 Entrega a domicilio:</Text>
                            <Text style={requestRentalStyles.summaryValue}>€{parseFloat(item.delivery_fee).toFixed(2)}</Text>
                        </View>
                    )}

                    {deliveryMethod === 'delivery' && item?.is_free_delivery && (
                        <View style={requestRentalStyles.summaryRow}>
                            <Text style={requestRentalStyles.freeDeliveryLabel}>🎁 Entrega a domicilio:</Text>
                            <Text style={requestRentalStyles.freeDeliveryValue}>GRATIS</Text>
                        </View>
                    )}

                    <View style={requestRentalStyles.summaryRow}>
                        <Text style={requestRentalStyles.totalLabel}>Valor Total:</Text>
                        <Text style={requestRentalStyles.totalValue}>€{calculateTotal()}</Text>
                    </View>

                    <View style={requestRentalStyles.taxIncludedNote}>
                        <Text style={requestRentalStyles.taxIncludedText}>✓ Tasa de servicio ya incluida en el precio</Text>
                    </View>

                    {/* Depósito */}
                    {item?.deposit_value && item.deposit_value > 0 && (
                        <View>
                            <View style={requestRentalStyles.divider} />
                            <View style={requestRentalStyles.depositContainer}>
                                <Text style={requestRentalStyles.depositLabel}>Depósito de Garantía:</Text>
                                <Text style={requestRentalStyles.depositValue}>€{parseFloat(item.deposit_value).toFixed(2)}</Text>
                            </View>
                            <Text style={requestRentalStyles.depositNote}>
                                💳 Este valor no saldrá de tu cuenta. Quedará bloqueado en tu tarjeta y será devuelto después de la devolución del artículo al propietario en perfecto estado.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Botão de Confirmação */}
                <TouchableOpacity 
                    style={requestRentalStyles.confirmButton}
                    onPress={handleConfirmRental}
                >
                    <Text style={requestRentalStyles.confirmButtonText}>
                        🔑 Solicitar Alquiler
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={requestRentalStyles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={requestRentalStyles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

            <View style={{ height: 30 }} />
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}


