import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RentalCalendar from '../components/RentalCalendar';
import { supabase } from '../../supabase';

export default function RequestRentalScreen({ route, navigation, session }) {
    const { item, ownerProfile, bookingDates, editingRental } = route.params || {};

    // Se estiver editando, usar dados do rental existente
    const initialStart = editingRental
        ? new Date(editingRental.start_date)
        : (bookingDates && bookingDates.startDate ? new Date(bookingDates.startDate) : new Date());
    const initialEnd = editingRental
        ? new Date(editingRental.end_date)
        : (bookingDates && bookingDates.endDate ? new Date(bookingDates.endDate) : new Date(Date.now() + 86400000));
    const initialPickupTime = editingRental?.pickup_time || '10:00';
    const initialReturnTime = editingRental?.return_time || '10:00';
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
            // Não fecha mais automaticamente - usuário deve clicar em OK
        }
    };

    const calculateDays = () => {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };

    const getAvailableHours = () => {
        // Se horário flexível, retorna 06:00 - 23:00
        if (item?.flexible_hours) {
            return Array.from({length: 18}, (_, i) => {
                const hour = (i + 6).toString().padStart(2, '0');
                return `${hour}:00`;
            });
        }

        // Caso contrário, retorna horários específicos configurados
        const availableHours = [];

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
            return Array.from({length: 18}, (_, i) => {
                const hour = (i + 6).toString().padStart(2, '0');
                return `${hour}:00`;
            });
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
                                    start_date: startDate.toISOString(),
                                    end_date: endDate.toISOString(),
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
                                        start_date: startDate.toISOString(),
                                        end_date: endDate.toISOString(),
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
                            Alert.alert(
                                'Error',
                                'No se pudo ${editingRental ? "guardar los cambios" : "enviar la solicitud"}. Por favor, inténtalo de nuevo.',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde - Mesmo layout do ItemDetailsScreen */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    {/* Botão Voltar + Título */}
                    <View style={styles.leftHeader}>
                        <TouchableOpacity
                            style={styles.backButtonCircle}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{editingRental ? 'Editar Alquiler' : 'Solicitar Alquiler'}</Text>
                    </View>

                    {/* ALUKO à Direita */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/app-icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.logoText}>ALUKO</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Card: Informações do Item */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📦 Artículo</Text>
                    <Text style={styles.itemTitle}>{item?.title || 'Sin título'}</Text>
                    <Text style={styles.itemPrice}>€{(parseFloat(item?.price_per_day || 0) * 1.18).toFixed(2)} / día</Text>
                    <Text style={styles.ownerName}>Anunciante: {ownerProfile?.full_name || 'Usuario'}</Text>
                </View>

                {/* Card: Seleção de Período */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📅 Período del Alquiler</Text>

                    {/* Botão para mostrar o calendário */}
                    {!showCalendar && (
                        <TouchableOpacity
                            style={styles.selectDatesButton}
                            onPress={() => setShowCalendar(true)}
                        >
                            <Text style={styles.selectDatesText}>Seleccionar Fechas en el Calendario</Text>
                        </TouchableOpacity>
                    )}

                    {/* Calendário (mostra apenas quando showCalendar = true) */}
                    {showCalendar && (
                        <View style={styles.calendarContainer}>
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
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🚚 Método de Entrega</Text>

                        <View style={styles.deliveryMethodContainer}>
                            {/* Opção: Retirar */}
                            <TouchableOpacity
                                style={[styles.deliveryMethodOption, deliveryMethod === 'pickup' && styles.deliveryMethodActive]}
                                onPress={() => setDeliveryMethod('pickup')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.deliveryMethodIcon}>📍</Text>
                                <Text style={[styles.deliveryMethodText, deliveryMethod === 'pickup' && styles.deliveryMethodTextActive]}>
                                    Recogida en el local
                                </Text>
                                {deliveryMethod === 'pickup' && (
                                    <View style={styles.deliveryMethodCheck}>
                                        <Text style={styles.deliveryMethodCheckText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Opção: Entrega */}
                            <TouchableOpacity
                                style={[styles.deliveryMethodOption, deliveryMethod === 'delivery' && styles.deliveryMethodActive]}
                                onPress={() => setDeliveryMethod('delivery')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.deliveryMethodIcon}>🚚</Text>
                                <View style={styles.deliveryMethodTextContainer}>
                                    <Text style={[styles.deliveryMethodText, deliveryMethod === 'delivery' && styles.deliveryMethodTextActive]}>
                                        Recibir en casa
                                    </Text>
                                    {item?.is_free_delivery ? (
                                        <Text style={styles.deliveryMethodSubtext}>Gratis</Text>
                                    ) : (
                                        <Text style={styles.deliveryMethodSubtext}>+€{parseFloat(item?.delivery_fee || 0).toFixed(2)}</Text>
                                    )}
                                </View>
                                {deliveryMethod === 'delivery' && (
                                    <View style={styles.deliveryMethodCheck}>
                                        <Text style={styles.deliveryMethodCheckText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {deliveryMethod === 'delivery' && item?.delivery_distance && (
                            <Text style={styles.deliveryNote}>
                                📍 El anunciante entrega hasta {item.delivery_distance} km
                            </Text>
                        )}
                    </View>
                )}

                {/* Card: Horários de Retirada e Devolución - SEMPRE MOSTRA */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>⏰ Horarios</Text>

                        {/* Hora de Retirada */}
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeLabel}>Hora de Recogida:</Text>
                            <View style={styles.timeSelector}>
                                <TouchableOpacity
                                    style={styles.timeButton}
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
                                    <Text style={styles.timeIcon}>🕐</Text>
                                    <Text style={styles.timeValue}>{pickupTime}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Hora de Devolución */}
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeLabel}>Hora de Devolución:</Text>
                            <View style={styles.timeSelector}>
                                <TouchableOpacity
                                    style={styles.timeButton}
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
                                    <Text style={styles.timeIcon}>🕐</Text>
                                    <Text style={styles.timeValue}>{returnTime}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                {/* Resumo do Aluguel */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Fecha de inicio:</Text>
                        <Text style={styles.summaryValue}>{formatDate(startDate)} {pickupTime}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Fecha de término:</Text>
                        <Text style={styles.summaryValue}>{formatDate(endDate)} {returnTime}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Precio por día (con tasa incluida):</Text>
                        <Text style={styles.summaryValue}>€{(parseFloat(item.price_per_day) * 1.18).toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Días de alquiler:</Text>
                        <Text style={styles.summaryValue}>{calculateDays()} {calculateDays() === 1 ? 'día' : 'días'}</Text>
                    </View>

                    {/* Mostrar desconto aplicado */}
                    {calculateDays() >= 7 && calculateDays() < 30 && item.discount_week && parseFloat(item.discount_week) > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>🎉 Descuento Semanal ({parseFloat(item.discount_week)}%):</Text>
                            <Text style={styles.discountValue}>-€{((parseFloat(item.price_per_day) * 1.18 * calculateDays()) * (parseFloat(item.discount_week) / 100)).toFixed(2)}</Text>
                        </View>
                    )}

                    {calculateDays() >= 30 && item.discount_month && parseFloat(item.discount_month) > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>🎉 Descuento Mensual ({parseFloat(item.discount_month)}%):</Text>
                            <Text style={styles.discountValue}>-€{((parseFloat(item.price_per_day) * 1.18 * calculateDays()) * (parseFloat(item.discount_month) / 100)).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Taxa de Entrega (se aplicável) */}
                    {deliveryMethod === 'delivery' && item?.delivery_fee && !item?.is_free_delivery && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>🚚 Entrega a domicilio:</Text>
                            <Text style={styles.summaryValue}>€{parseFloat(item.delivery_fee).toFixed(2)}</Text>
                        </View>
                    )}

                    {deliveryMethod === 'delivery' && item?.is_free_delivery && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.freeDeliveryLabel}>🎁 Entrega a domicilio:</Text>
                            <Text style={styles.freeDeliveryValue}>GRATIS</Text>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Valor Total:</Text>
                        <Text style={styles.totalValue}>€{calculateTotal()}</Text>
                    </View>

                    <View style={styles.taxIncludedNote}>
                        <Text style={styles.taxIncludedText}>✓ Tasa de servicio ya incluida en el precio</Text>
                    </View>

                    {/* Depósito */}
                    {item?.deposit_value && item.deposit_value > 0 && (
                        <View>
                            <View style={styles.divider} />
                            <View style={styles.depositContainer}>
                                <Text style={styles.depositLabel}>Depósito de Garantía:</Text>
                                <Text style={styles.depositValue}>€{parseFloat(item.deposit_value).toFixed(2)}</Text>
                            </View>
                            <Text style={styles.depositNote}>
                                💳 Este valor no saldrá de tu cuenta. Quedará bloqueado en tu tarjeta y será devuelto después de la devolución del artículo al propietario en perfecto estado.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Botão de Confirmação */}
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleConfirmRental}
                >
                    <Text style={styles.confirmButtonText}>
                        🔑 Solicitar Alquiler
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

            <View style={{ height: 30 }} />
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    headerContainer: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 14,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    backButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 22,
        color: '#fff',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoImage: {
        width: 24,
        height: 24,
        borderRadius: 6,
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 16,
    },
    itemTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 8,
    },
    itemPrice: {
        fontSize: 20,
        color: '#10B981',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    ownerName: {
        fontSize: 14,
        color: '#666',
    },
    selectDatesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    selectDatesText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    calendarContainer: {
        marginTop: 8,
    },
    timeContainer: {
        marginBottom: 16,
    },
    timeLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c4455',
        marginBottom: 10,
    },
    timeSelector: {
        marginTop: 4,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#10B981',
        gap: 12,
    },
    timeIcon: {
        fontSize: 24,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#495057',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    discountLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#10B981',
        flex: 1,
    },
    discountValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    divider: {
        height: 1,
        backgroundColor: '#adb5bd',
        marginVertical: 15,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#28a745',
    },
    taxIncludedNote: {
        marginTop: 8,
        padding: 10,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    taxIncludedText: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '600',
        textAlign: 'center',
    },
    depositContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    depositLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
    },
    depositValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    depositNote: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        lineHeight: 19,
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
    },
    confirmButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#dc3545',
    },
    cancelButtonText: {
        color: '#dc3545',
        fontSize: 16,
        fontWeight: '600',
    },
    deliveryMethodContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    deliveryMethodOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        minHeight: 100,
        justifyContent: 'center',
    },
    deliveryMethodActive: {
        backgroundColor: '#E8F5E9',
        borderColor: '#10B981',
    },
    deliveryMethodIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    deliveryMethodTextContainer: {
        alignItems: 'center',
    },
    deliveryMethodText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    deliveryMethodTextActive: {
        color: '#10B981',
    },
    deliveryMethodSubtext: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    deliveryMethodCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliveryMethodCheckText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    deliveryNote: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    freeDeliveryLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#10B981',
    },
    freeDeliveryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
});
