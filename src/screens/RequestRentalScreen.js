import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RentalCalendar from '../components/RentalCalendar';

export default function RequestRentalScreen({ route, navigation }) {
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

    const calculateSubtotal = () => {
        const days = calculateDays();
        return parseFloat(item.price_per_day) * days;
    };

    const calculateServiceFee = () => {
        const subtotal = calculateSubtotal();
        return subtotal * 0.18; // 18% de taxa de serviço
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const serviceFee = calculateServiceFee();
        return (subtotal + serviceFee).toFixed(2);
    };

    const handleConfirmRental = () => {
        const days = calculateDays();
        const subtotal = calculateSubtotal();
        const serviceFee = calculateServiceFee();
        const total = calculateTotal();
        
        if (days < 1) {
            Alert.alert('Atención', 'El período de alquiler debe ser de al menos 1 día.');
            return;
        }

        const depositMessage = item?.deposit_value && item.deposit_value > 0
            ? `\n\nDepósito de Garantía: €${parseFloat(item.deposit_value).toFixed(2)}\n(No saldrá de tu cuenta, solo será bloqueado)`
            : '';

        Alert.alert(
            'Confirmar Solicitud',
            `¿Deseas confirmar el alquiler?\n\nArtículo: ${item?.title || 'Sin título'}\nPeríodo: ${days} ${days === 1 ? 'día' : 'días'}\nRecogida: ${formatDate(startDate)} a las ${pickupTime}\nDevolución: ${formatDate(endDate)} a las ${returnTime}\n\nSubtotal: €${subtotal.toFixed(2)}\nTasa de servicio: €${serviceFee.toFixed(2)}\nValor Total: €${total}${depositMessage}\n\nEl anunciante recibirá tu solicitud.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: () => {
                        // Aqui você vai salvar a solicitação no banco de dados
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
                    <Text style={styles.itemPrice}>€{parseFloat(item?.price_per_day || 0).toFixed(2)} / día</Text>
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
                            <TouchableOpacity
                                style={styles.hideCalendarButton}
                                onPress={() => setShowCalendar(false)}
                            >
                                <Text style={styles.hideCalendarText}>OK</Text>
                            </TouchableOpacity>
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
                                    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
                                    Alert.alert(
                                        'Selecciona Hora de Recogida',
                                        '',
                                        hours.map(hour => ({
                                            text: hour,
                                            onPress: () => setPickupTime(hour)
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
                                    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
                                    Alert.alert(
                                        'Selecciona Hora de Devolución',
                                        '',
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
                        <Text style={styles.summaryLabel}>Precio por día:</Text>
                        <Text style={styles.summaryValue}>€{parseFloat(item.price_per_day).toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal ({calculateDays()} {calculateDays() === 1 ? 'día' : 'días'}):</Text>
                        <Text style={styles.summaryValue}>€{calculateSubtotal().toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tasa de servicio:</Text>
                        <Text style={styles.summaryValue}>€{calculateServiceFee().toFixed(2)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Valor Total:</Text>
                        <Text style={styles.totalValue}>€{calculateTotal()}</Text>
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
