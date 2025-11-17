import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RentalCalendar from '../components/RentalCalendar';
import { supabase } from '../../supabase';

export default function RequestRentalScreen({ route, navigation, session }) {
    const { item, ownerProfile, bookingDates } = route.params || {};

    // Se vierem bookingDates (do calendário), usamos como datas iniciais
    const initialStart = bookingDates && bookingDates.startDate ? new Date(bookingDates.startDate) : new Date();
    const initialEnd = bookingDates && bookingDates.endDate ? new Date(bookingDates.endDate) : new Date(Date.now() + 86400000);

    const [startDate, setStartDate] = useState(initialStart);
    const [endDate, setEndDate] = useState(initialEnd);
    const [showCalendar, setShowCalendar] = useState(false);
    const [pickupTime, setPickupTime] = useState('10:00');
    const [returnTime, setReturnTime] = useState('18:00');

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
        // Não adiciona taxa pois já está incluída
        return subtotal.toFixed(2);
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

        Alert.alert(
            'Confirmar Solicitud',
            `¿Deseas confirmar el alquiler?\n\nArtículo: ${item?.title || 'Sin título'}\nPeríodo: ${days} ${days === 1 ? 'día' : 'días'}\nRecogida: ${formatDate(startDate)} a las ${pickupTime}\nDevolución: ${formatDate(endDate)} a las ${returnTime}\n\n💰 Valor Total: €${total}\n(Tasa de servicio ya incluida)${depositMessage}\n\nEl anunciante recibirá tu solicitud.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            // Salvar solicitação de aluguel no banco de dados
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
                                        onPress: () => navigation.goBack()
                                    }
                                ]
                            );
                        } catch (error) {
                            console.error('Error al enviar solicitud:', error);
                            Alert.alert(
                                'Error',
                                'No se pudo enviar la solicitud. Por favor, inténtalo de nuevo.',
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
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header com Botão Voltar */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Solicitar Alquiler</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Informações do Item */}
                <View style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item?.title || 'Sin título'}</Text>
                    <Text style={styles.itemPrice}>€{(parseFloat(item?.price_per_day || 0) * 1.18).toFixed(2)} / día</Text>
                    <Text style={styles.ownerName}>Anunciante: {ownerProfile?.full_name || 'Usuario'}</Text>
                </View>

                {/* Seleção de Período */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Período del Alquiler</Text>

                    {/* Botão para mostrar o calendário */}
                    {!showCalendar && (
                        <TouchableOpacity
                            style={styles.selectDatesButton}
                            onPress={() => setShowCalendar(true)}
                        >
                            <Text style={styles.selectDatesIcon}>📅</Text>
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
                            />
                        </View>
                    )}
                </View>

                {/* Horários de Retirada e Devolución */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Horarios</Text>

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
                                                // Se é 1 dia de aluguel, ajustar returnTime
                                                if (calculateDays() === 1) {
                                                    setReturnTime(hour);
                                                }
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

                                    // Limitar horários até o pickupTime para evitar dia extra
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
                        <Text style={styles.summaryLabel}>Período:</Text>
                        <Text style={styles.summaryValue}>{calculateDays()} {calculateDays() === 1 ? 'día' : 'días'}</Text>
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
            </View>

            <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    headerContainer: {
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
    },
    itemCard: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    itemTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    itemPrice: {
        fontSize: 18,
        color: '#28a745',
        fontWeight: '600',
        marginBottom: 5,
    },
    ownerName: {
        fontSize: 14,
        color: '#6c757d',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    selectDatesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    selectDatesIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    selectDatesText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    calendarContainer: {
        marginBottom: 15,
    },
    hideCalendarButton: {
        backgroundColor: '#10B981',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    hideCalendarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    timeContainer: {
        marginBottom: 20,
    },
    timeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    timeSelector: {
        marginTop: 5,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007bff',
        gap: 12,
    },
    timeIcon: {
        fontSize: 24,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
    },
    summaryCard: {
        backgroundColor: '#e7f5ff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
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
});
