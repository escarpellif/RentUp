import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { supabase } from '../../supabase';

export default function RentalCalendar({
    visible,
    onClose,
    existingBookings = [],
    onSelectDates,
    // Novas props para uso inline (sem modal)
    itemId,
    onDateRangeChange,
    initialStartDate,
    initialEndDate,
    excludeRentalId  // ✅ NOVO: ID do rental a excluir dos bloqueios (para edição)
}) {
    // Se não for modal (sem visible prop), renderiza inline
    const isModal = visible !== undefined;

    const [blockedDates, setBlockedDates] = useState([]);
    const [selectedStart, setSelectedStart] = useState(
        initialStartDate ? moment(initialStartDate).format('YYYY-MM-DD') : null
    );
    const [selectedEnd, setSelectedEnd] = useState(
        initialEndDate ? moment(initialEndDate).format('YYYY-MM-DD') : null
    );

    // Buscar datas bloqueadas do Supabase - usando useCallback
    const fetchBlockedDates = useCallback(async () => {
        if (!itemId) return;

        try {
            let query = supabase
                .from('item_availability')
                .select('start_date, end_date, rental_id')
                .eq('item_id', itemId)
                .eq('status', 'blocked');

            // ✅ Se estiver editando, excluir o rental atual dos bloqueios
            if (excludeRentalId) {
                query = query.neq('rental_id', excludeRentalId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setBlockedDates(data || []);
        } catch (error) {
            console.error('Erro ao buscar datas bloqueadas:', error);
        }
    }, [itemId, excludeRentalId]);

    useEffect(() => {
        fetchBlockedDates();
    }, [fetchBlockedDates]);

    // Usar useMemo ao invés de useEffect para calcular markedDates
    const markedDates = useMemo(() => {
        const marked = {};

        // Marca as datas bloqueadas do Supabase
        blockedDates.forEach(block => {
            const start = moment(block.start_date);
            const end = moment(block.end_date);
            for (let m = moment(start); m.isSameOrBefore(end); m.add(1, 'days')) {
                const dateStr = m.format('YYYY-MM-DD');
                marked[dateStr] = {
                    disabled: true,
                    disableTouchEvent: true,
                    color: '#ff4444',
                    textColor: '#ffffff',
                };
            }
        });

        // Marca as datas já reservadas (fallback)
        existingBookings.forEach(booking => {
            const start = moment(booking.startDate);
            const end = moment(booking.endDate);
            for (let m = moment(start); m.isSameOrBefore(end); m.add(1, 'days')) {
                const dateStr = m.format('YYYY-MM-DD');
                marked[dateStr] = {
                    disabled: true,
                    disableTouchEvent: true,
                    color: '#ff4444',
                    textColor: '#ffffff',
                };
            }
        });

        // Marca seleção atual
        if (selectedStart && selectedEnd) {
            const start = moment(selectedStart);
            const end = moment(selectedEnd);
            for (let m = moment(start); m.isSameOrBefore(end); m.add(1, 'days')) {
                const dateStr = m.format('YYYY-MM-DD');
                if (marked[dateStr]?.disabled) continue;
                if (dateStr === selectedStart) {
                    marked[dateStr] = { startingDay: true, color: '#007bff', textColor: '#ffffff' };
                } else if (dateStr === selectedEnd) {
                    marked[dateStr] = { endingDay: true, color: '#007bff', textColor: '#ffffff' };
                } else {
                    marked[dateStr] = { color: '#70b9ff', textColor: '#ffffff' };
                }
            }
        } else if (selectedStart) {
            marked[selectedStart] = { selected: true, color: '#007bff', textColor: '#ffffff' };
        }

        return marked;
    }, [blockedDates, existingBookings, selectedStart, selectedEnd]);

    const handleDayPress = (day) => {
        const dateStr = day.dateString;
        if (markedDates[dateStr]?.disabled) {
            Alert.alert('Data Indisponível', 'Esta data já está reservada.');
            return;
        }

        if (!selectedStart || (selectedStart && selectedEnd)) {
            setSelectedStart(dateStr);
            setSelectedEnd(null);
        } else {
            const start = moment(selectedStart);
            const end = moment(dateStr);
            if (end.isBefore(start)) {
                setSelectedStart(dateStr);
                setSelectedEnd(selectedStart);
            } else {
                // verifica conflito
                let hasConflict = false;
                for (let m = moment(start); m.isSameOrBefore(end); m.add(1, 'days')) {
                    if (markedDates[m.format('YYYY-MM-DD')]?.disabled) { hasConflict = true; break; }
                }
                if (hasConflict) {
                    Alert.alert('Período inválido', 'Há datas reservadas no período selecionado.');
                    return;
                }
                setSelectedEnd(dateStr);
            }
        }
    };

    const handleConfirm = () => {
        if (!selectedStart || !selectedEnd) {
            Alert.alert('Selecione as Datas', 'Por favor, selecione as datas de início e fim.');
            return;
        }
        const days = moment(selectedEnd).diff(moment(selectedStart), 'days') + 1;

        // Callback para modal
        if (onSelectDates) {
            onSelectDates({ startDate: selectedStart, endDate: selectedEnd, totalDays: days });
        }

        // Callback para inline - SEMPRE chama quando confirma
        if (onDateRangeChange) {
            const startDate = new Date(selectedStart);
            const endDate = new Date(selectedEnd);
            onDateRangeChange(startDate, endDate);
        }

        // reset and close apenas se for modal
        if (isModal) {
            setSelectedStart(null);
            setSelectedEnd(null);
            onClose && onClose();
        }
    };

    const handleClose = () => {
        setSelectedStart(null);
        setSelectedEnd(null);
        onClose && onClose();
    };

    // Renderização inline (sem modal)
    const renderCalendar = () => (
        <>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: '#007bff' }]} />
                    <Text style={styles.legendText}>Selecionado</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: '#ff4444' }]} />
                    <Text style={styles.legendText}>Reservado</Text>
                </View>
            </View>

            <Calendar
                minDate={moment().format('YYYY-MM-DD')}
                markingType={'period'}
                markedDates={markedDates}
                onDayPress={handleDayPress}
                theme={{
                    todayTextColor: '#007bff',
                    arrowColor: '#007bff',
                    monthTextColor: '#1a3a52',
                    textMonthFontWeight: 'bold',
                }}
            />

            {selectedStart && selectedEnd && (
                <View style={styles.summary}>
                    <Text>Check-in: {moment(selectedStart).format('DD/MM/YYYY')}</Text>
                    <Text>Check-out: {moment(selectedEnd).format('DD/MM/YYYY')}</Text>
                </View>
            )}

            {/* Botão confirmar para modo inline */}
            {!isModal && (
                <TouchableOpacity
                    style={[styles.button, styles.confirm, { marginTop: 12 }]}
                    onPress={handleConfirm}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar Fechas</Text>
                </TouchableOpacity>
            )}
        </>
    );

    // Se não for modal, renderiza inline
    if (!isModal) {
        return (
            <View style={styles.inlineContainer}>
                {renderCalendar()}
            </View>
        );
    }

    // Renderização modal (original)
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Selecione as Datas</Text>
                        <TouchableOpacity onPress={handleClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
                    </View>

                    {renderCalendar()}

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.button, styles.cancel]} onPress={handleClose}><Text>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirm]} onPress={handleConfirm}><Text style={{ color: '#fff' }}>Confirmar</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '90%' },
    inlineContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 18, fontWeight: '700' },
    close: { fontSize: 22, color: '#666' },
    legend: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, marginBottom: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
    legendBox: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
    legendText: { fontSize: 12, color: '#666' },
    summary: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginTop: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancel: { backgroundColor: '#f0f0f0', marginRight: 8 },
    confirm: { backgroundColor: '#007bff' },
});
