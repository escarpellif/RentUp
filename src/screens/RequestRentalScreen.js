import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RequestRentalScreen({ route, navigation }) {
    const { item, ownerProfile, bookingDates } = route.params || {};

    // Se vierem bookingDates (do calendário), usamos como datas iniciais
    const initialStart = bookingDates && bookingDates.startDate ? new Date(bookingDates.startDate) : new Date();
    const initialEnd = bookingDates && bookingDates.endDate ? new Date(bookingDates.endDate) : new Date(Date.now() + 86400000);

    const [startDate, setStartDate] = useState(initialStart);
    const [endDate, setEndDate] = useState(initialEnd); // +1 dia padrão
    const [tempStartDate, setTempStartDate] = useState(initialStart);
    const [tempEndDate, setTempEndDate] = useState(initialEnd);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const calculateDays = () => {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };

    const calculateTotal = () => {
        const days = calculateDays();
        return (parseFloat(item.price_per_day) * days).toFixed(2);
    };

    const handleConfirmRental = () => {
        const days = calculateDays();
        const total = calculateTotal();
        
        if (days < 1) {
            Alert.alert('Atenção', 'O período de aluguel deve ser de pelo menos 1 dia.');
            return;
        }

        Alert.alert(
            'Confirmar Solicitação',
            `Deseja confirmar o aluguel?\n\nItem: ${item.title}\nPeríodo: ${days} ${days === 1 ? 'dia' : 'dias'}\nValor Total: €${total}\n\nO anunciante receberá sua solicitação.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: () => {
                        // Aqui você vai salvar a solicitação no banco de dados
                        Alert.alert(
                            'Sucesso!',
                            'Sua solicitação foi enviada ao anunciante.',
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

    const onChangeStartDate = (event, selectedDate) => {
        if (Platform.OS === 'android' && event.type === 'dismissed') {
            setShowStartPicker(false);
            return;
        }
        if (selectedDate) {
            setTempStartDate(selectedDate);
            if (Platform.OS === 'android') {
                setStartDate(selectedDate);
                setShowStartPicker(false);
                // Se a data final for anterior à nova data inicial, ajusta
                if (selectedDate >= endDate) {
                    setEndDate(new Date(selectedDate.getTime() + 86400000));
                }
            }
        }
    };

    const onChangeEndDate = (event, selectedDate) => {
        if (Platform.OS === 'android' && event.type === 'dismissed') {
            setShowEndPicker(false);
            return;
        }
        if (selectedDate) {
            setTempEndDate(selectedDate);
            if (Platform.OS === 'android') {
                if (selectedDate > startDate) {
                    setEndDate(selectedDate);
                    setShowEndPicker(false);
                } else {
                    Alert.alert('Atenção', 'A data final deve ser posterior à data inicial.');
                    setShowEndPicker(false);
                }
            }
        }
    };

    const handleConfirmStartDate = () => {
        setStartDate(tempStartDate);
        setShowStartPicker(false);
        // Se a data final for anterior à nova data inicial, ajusta
        if (tempStartDate >= endDate) {
            setEndDate(new Date(tempStartDate.getTime() + 86400000));
        }
    };

    const handleConfirmEndDate = () => {
        if (tempEndDate > startDate) {
            setEndDate(tempEndDate);
            setShowEndPicker(false);
        } else {
            Alert.alert('Atenção', 'A data final deve ser posterior à data inicial.');
            setShowEndPicker(false);
        }
    };

    const handleCancelStartDate = () => {
        setTempStartDate(startDate);
        setShowStartPicker(false);
    };

    const handleCancelEndDate = () => {
        setTempEndDate(endDate);
        setShowEndPicker(false);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Informações do Item */}
                <View style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemPrice}>€{parseFloat(item.price_per_day).toFixed(2)} / dia</Text>
                    <Text style={styles.ownerName}>Anunciante: {ownerProfile?.full_name || 'Usuário'}</Text>
                </View>

                {/* Seleção de Período */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Período do Aluguel</Text>
                    
                    {/* Data Inicial */}
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateLabel}>Data de Início</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => {
                                setTempStartDate(startDate);
                                setShowStartPicker(true);
                            }}
                        >
                            <Text style={styles.dateIcon}>📅</Text>
                            <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Data Final */}
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateLabel}>Data de Término</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => {
                                setTempEndDate(endDate);
                                setShowEndPicker(true);
                            }}
                        >
                            <Text style={styles.dateIcon}>📅</Text>
                            <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Resumo do Aluguel */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumo</Text>
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Data de início:</Text>
                        <Text style={styles.summaryValue}>{formatDate(startDate)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Data de término:</Text>
                        <Text style={styles.summaryValue}>{formatDate(endDate)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Período:</Text>
                        <Text style={styles.summaryValue}>{calculateDays()} {calculateDays() === 1 ? 'dia' : 'dias'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Preço por dia:</Text>
                        <Text style={styles.summaryValue}>€{parseFloat(item.price_per_day).toFixed(2)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Valor Total:</Text>
                        <Text style={styles.totalValue}>€{calculateTotal()}</Text>
                    </View>
                </View>

                {/* Botão de Confirmação */}
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleConfirmRental}
                >
                    <Text style={styles.confirmButtonText}>
                        🔑 Solicitar Aluguel
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>

            {/* Modal para Data Inicial */}
            <Modal
                visible={showStartPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCancelStartDate}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecione a Data de Início</Text>

                        <DateTimePicker
                            value={tempStartDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeStartDate}
                            minimumDate={new Date()}
                            style={styles.datePicker}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={handleCancelStartDate}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalButtonOk}
                                onPress={handleConfirmStartDate}
                            >
                                <Text style={styles.modalButtonOkText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal para Data Final */}
            <Modal
                visible={showEndPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCancelEndDate}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecione a Data de Término</Text>

                        <DateTimePicker
                            value={tempEndDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeEndDate}
                            minimumDate={new Date(startDate.getTime() + 86400000)}
                            style={styles.datePicker}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={handleCancelEndDate}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalButtonOk}
                                onPress={handleConfirmEndDate}
                            >
                                <Text style={styles.modalButtonOkText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
    dateContainer: {
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#007bff',
        borderRadius: 10,
        padding: 15,
        gap: 10,
    },
    dateIcon: {
        fontSize: 24,
    },
    dateButtonText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    datePicker: {
        width: '100%',
        height: 200,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    modalButtonCancel: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#dc3545',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonCancelText: {
        color: '#dc3545',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonOk: {
        flex: 1,
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonOkText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
