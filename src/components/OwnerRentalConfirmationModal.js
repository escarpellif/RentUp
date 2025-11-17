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
    FlatList,
    Dimensions
} from 'react-native';
import {supabase} from '../../supabase';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const OwnerRentalConfirmationModal = ({session}) => {
    const [activeRentals, setActiveRentals] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchActiveRentals();
        }
    }, [session]);

    // Refetch quando modal abre
    useEffect(() => {
        if (visible && session?.user?.id) {
            fetchActiveRentals();
        }
    }, [visible]);

    // Atualizar cronômetro a cada segundo
    useEffect(() => {
        if (activeRentals.length > 0 && visible) {
            const interval = setInterval(() => {
                updateTimeRemaining();
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [activeRentals, visible, currentIndex]);

    const fetchActiveRentals = async () => {
        try {
            const {data, error} = await supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                    renter:profiles!rentals_renter_id_fkey(full_name, phone)
                `)
                .eq('owner_id', session.user.id) // Locador (dono do item)
                .eq('status', 'approved')
                .gte('start_date', new Date().toISOString().split('T')[0])
                .order('start_date', {ascending: true});

            console.log('🔵 OwnerRentalConfirmationModal - Locações encontradas:', data?.length || 0);

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar locações ativas:', error);
                return;
            }

            if (data && data.length > 0) {
                console.log('✅ Mostrando modal com', data.length, 'locação(ões)');
                setActiveRentals(data);
                setVisible(true);
                updateTimeRemaining(data[0]);
            } else {
                console.log('⚠️ Nenhuma locação ativa encontrada para owner');
                setVisible(false);
            }
        } catch (error) {
            console.error('Erro ao buscar locações ativas:', error);
        }
    };

    const updateTimeRemaining = (rental = activeRentals[currentIndex]) => {
        if (!rental) return;

        const now = new Date();
        const pickupDateTime = new Date(`${rental.start_date}T${rental.pickup_time || '10:00'}:00`);
        const diff = pickupDateTime - now;

        if (diff <= 0) {
            setTimeRemaining('Hora de entregar el artículo al locatario');
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
            setTimeRemaining(`${minutes}m ${seconds}s`);
        }
    };

    const handleConfirmPickup = async () => {
        const activeRental = activeRentals[currentIndex];

        if (!codeInput || codeInput.trim() === '') {
            Alert.alert('Error', 'Por favor, ingresa el código del locatario');
            return;
        }

        // Validar código
        if (codeInput.trim() !== activeRental.renter_code) {
            Alert.alert(
                'Código Incorrecto',
                'El código ingresado no coincide. Por favor, solicita el código correcto al locatario.',
                [{text: 'OK'}]
            );
            setCodeInput('');
            return;
        }

        // Confirmar entrega
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
                            // Atualizar status para 'active' (locação confirmada e em andamento)
                            const {error} = await supabase
                                .from('rentals')
                                .update({
                                    status: 'active',
                                    pickup_confirmed_at: new Date().toISOString()
                                })
                                .eq('id', activeRental.id);

                            if (error) throw error;

                            // Enviar notificação ao locatário
                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: activeRental.renter_id,
                                    type: 'rental_active',
                                    title: 'Locación Confirmada',
                                    message: `La entrega de "${activeRental.item.title}" fue confirmada. Disfruta tu alquiler y recuerda devolverlo en la fecha acordada.`,
                                    related_id: activeRental.id,
                                    read: false,
                                });

                            Alert.alert(
                                'Éxito',
                                'Entrega confirmada. El dinero será liberado después de la devolución del artículo.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // Remover item confirmado da lista
                                            const updatedRentals = activeRentals.filter((_, index) => index !== currentIndex);
                                            setActiveRentals(updatedRentals);
                                            setCodeInput('');

                                            if (updatedRentals.length === 0) {
                                                setVisible(false);
                                            } else {
                                                // Ajustar índice se necessário
                                                if (currentIndex >= updatedRentals.length) {
                                                    setCurrentIndex(updatedRentals.length - 1);
                                                }
                                            }
                                        }
                                    }
                                ]
                            );
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
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    if (activeRentals.length === 0 || !visible) {
        return null;
    }

    const activeRental = activeRentals[currentIndex];

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
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>📦 Entrega Pendiente</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de Página */}
                        {activeRentals.length > 1 && (
                            <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                    style={styles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex > 0) {
                                            const newIndex = currentIndex - 1;
                                            console.log('⬅️ Navegando para locação', newIndex + 1);
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
                                    {activeRentals.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                index === currentIndex && styles.dotActive
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Text style={styles.pageIndicator}>
                                    {currentIndex + 1} / {activeRentals.length}
                                </Text>

                                <TouchableOpacity
                                    style={styles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex < activeRentals.length - 1) {
                                            const newIndex = currentIndex + 1;
                                            console.log('➡️ Navegando para locação', newIndex + 1);
                                            setCurrentIndex(newIndex);
                                            setCodeInput('');
                                        }
                                    }}
                                    disabled={currentIndex === activeRentals.length - 1}
                                >
                                    <Text
                                        style={[styles.arrowText, currentIndex === activeRentals.length - 1 && styles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Cronômetro */}
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerLabel}>Tiempo para entrega:</Text>
                            <Text
                                style={styles.timerValue}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {timeRemaining}
                            </Text>
                        </View>

                        {/* Dados da Locação */}
                        <View style={styles.detailsContainer}>
                            <Text style={styles.itemTitle}>{activeRental.item?.title || 'Item'}</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Recogida:</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(activeRental.start_date)} - {activeRental.pickup_time || '10:00'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Devolución:</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(activeRental.end_date)} - {activeRental.return_time || '18:00'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>👤 Locatario:</Text>
                                <Text style={styles.detailValue}>
                                    {activeRental.renter?.full_name || 'Usuario'}
                                </Text>
                            </View>

                            {activeRental.renter?.phone && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>📱 Teléfono:</Text>
                                    <Text style={styles.detailValue}>
                                        {activeRental.renter.phone}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>💰 Total a Recibir:</Text>
                                <Text style={[styles.detailValue, styles.priceText]}>
                                    €{parseFloat(activeRental.owner_amount || activeRental.subtotal || 0).toFixed(2)}
                                </Text>
                            </View>

                            {/* Instrucciones */}
                            <View style={styles.instructionsContainer}>
                                <Text style={styles.instructionsTitle}>📋 Instrucciones:</Text>
                                <Text style={styles.instructionsText}>
                                    1. Entrega el artículo al locatario{'\n'}
                                    2. Verifica que ambos estén de acuerdo con el estado{'\n'}
                                    3. Solicita el código de recogida al locatario{'\n'}
                                    4. Ingresa el código abajo para confirmar la entrega
                                </Text>
                            </View>

                            {/* Campo de Código */}
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
                                    El locatario debe mostrarte su código de 6 dígitos después de confirmar que el
                                    artículo está de acuerdo con lo anunciado.
                                </Text>
                            </View>

                            {/* Código do Owner (Referência) */}
                            <View style={styles.ownerCodeContainer}>
                                <Text style={styles.ownerCodeLabel}>Tu Código de Devolución:</Text>
                                <View style={styles.ownerCodeBadge}>
                                    <Text style={styles.ownerCodeValue}>
                                        {activeRental.owner_code || '------'}
                                    </Text>
                                </View>
                                <Text style={styles.ownerCodeHint}>
                                    Guarda este código. El locatario deberá ingresarlo al devolver el artículo.
                                </Text>
                            </View>
                        </View>

                        {/* Botões */}
                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity
                                style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                                onPress={handleConfirmPickup}
                                disabled={confirming}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {confirming ? 'Confirmando...' : '✓ Confirmar Entrega'}
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
        backgroundColor: '#2c4455',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
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
    timerContainer: {
        backgroundColor: '#EFF6FF',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    timerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    timerValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c4455',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
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
    instructionsContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2c4455',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 10,
    },
    instructionsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
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
        backgroundColor: '#2c4455',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    pageIndicator: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
});

export default OwnerRentalConfirmationModal;

