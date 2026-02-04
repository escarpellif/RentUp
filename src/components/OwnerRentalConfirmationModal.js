import React, {useState, useEffect} from 'react';
import {View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {supabase} from '../../supabase';
import { ownerRentalConfirmationStyles } from '../styles/components/ownerRentalConfirmationStyles';


const OwnerRentalConfirmationModal = ({session, navigation}) => {
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

    const fetchActiveRentals = async () => {
        try {
            // Verificar se session existe antes de acessar user
            if (!session?.user?.id) {
                return;
            }

            const {data, error} = await supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                    renter:profiles!rentals_renter_id_fkey(full_name)
                `)
                .eq('owner_id', session.user.id) // Locador (dono do item)
                .in('status', ['approved', 'active']) // Busca aprovadas E em locação
                .gte('start_date', new Date().toISOString().split('T')[0])
                .order('start_date', {ascending: true});

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar locações ativas:', error);
                return;
            }

            if (data && data.length > 0) {
                setActiveRentals(data);
                setVisible(true);
                updateTimeRemaining(data[0]);
            } else {
                setVisible(false);
            }
        } catch (error) {
            console.error('Erro ao buscar locações ativas:', error);
        }
    };

    const updateTimeRemaining = (rental = activeRentals[currentIndex]) => {
        if (!rental || !rental.start_date || !rental.end_date) {
            setTimeRemaining('Calculando...');
            return;
        }

        const now = new Date();

        if (rental.status === 'approved') {
            // ✅ Tempo até a retirada
            const startDateOnly = rental.start_date.split('T')[0];
            const [pickupHour, pickupMinute] = (rental.pickup_time || '10:00').split(':');

            const [startYear, startMonth, startDay] = startDateOnly.split('-');

            const pickupDateTime = new Date(
                parseInt(startYear),
                parseInt(startMonth) - 1,
                parseInt(startDay),
                parseInt(pickupHour),
                parseInt(pickupMinute),
                0
            );

            // Verificar se a data é válida
            if (isNaN(pickupDateTime.getTime())) {
                setTimeRemaining('Fecha inválida');
                return;
            }

            const diff = pickupDateTime - now;

            if (diff <= 0) {
                setTimeRemaining('Hora de entregar el artículo al locatario');
                return;
            }

            // ✅ Cálculo mais preciso
            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / (60 * 60 * 24));
            const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
            const seconds = totalSeconds % 60;

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            }
        } else if (rental.status === 'active') {
            // ✅ Tempo até a devolução
            const endDateOnly = rental.end_date.split('T')[0];
            const [returnHour, returnMinute] = (rental.return_time || '18:00').split(':');

            const [endYear, endMonth, endDay] = endDateOnly.split('-');

            const returnDateTime = new Date(
                parseInt(endYear),
                parseInt(endMonth) - 1,
                parseInt(endDay),
                parseInt(returnHour),
                parseInt(returnMinute),
                0
            );

            // Verificar se a data é válida
            if (isNaN(returnDateTime.getTime())) {
                setTimeRemaining('Fecha inválida');
                return;
            }

            const diffReturn = returnDateTime - now;

            if (diffReturn <= 0) {
                setTimeRemaining('Hora de recibir la devolución');
                return;
            }

            // ✅ Cálculo mais preciso
            const totalSeconds = Math.floor(diffReturn / 1000);
            const daysReturn = Math.floor(totalSeconds / (60 * 60 * 24));
            const hoursReturn = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
            const minutesReturn = Math.floor((totalSeconds % (60 * 60)) / 60);

            if (daysReturn > 0) {
                setTimeRemaining(`${daysReturn} días ${hoursReturn}h`);
            } else if (hoursReturn > 0) {
                setTimeRemaining(`${hoursReturn}h ${minutesReturn}m`);
            } else {
                setTimeRemaining(`${minutesReturn}m`);
            }
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
                                'Entrega confirmada. Guarda tu código de devolución para cuando el locatario devuelva el artículo.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            setCodeInput('');
                                            // Refetch para atualizar status (approved → active)
                                            fetchActiveRentals();
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
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} de ${month} de ${year}`;
    };

    const handleOpenChat = () => {
        const activeRental = activeRentals[currentIndex];

        // Fechar o modal e navegar para o chat
        setVisible(false);

        if (navigation) {
            // Criar objeto otherUser com estrutura correta
            const otherUser = {
                id: activeRental.renter_id,
                full_name: activeRental.renter?.full_name || 'Usuario',
            };

            // Criar conversation_id único incluindo ITEM_ID
            const conversationId = [session.user.id, activeRental.renter_id].sort().join('_') + '_' + activeRental.item_id;

            navigation.navigate('ChatConversation', {
                itemId: activeRental.item_id,
                item: activeRental.item,
                otherUser: otherUser,
                conversationId: conversationId,
            });
        }
    };

    const handleCancelRental = () => {
        const activeRental = activeRentals[currentIndex];

        Alert.alert(
            'Cancelar Locación',
            '¿Estás seguro de que deseas cancelar esta locación? El locatario será notificado.',
            [
                {text: 'No', style: 'cancel'},
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const {error} = await supabase
                                .from('rentals')
                                .update({status: 'cancelled'})
                                .eq('id', activeRental.id);

                            if (error) throw error;

                            // Remover bloqueios de data
                            await supabase
                                .from('item_availability')
                                .delete()
                                .eq('rental_id', activeRental.id);

                            // Enviar notificação ao locatário
                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: activeRental.renter_id,
                                    type: 'rental_cancelled',
                                    title: 'Locación Cancelada',
                                    message: `El propietario ha cancelado la locación de "${activeRental.item.title}".`,
                                    related_id: activeRental.id,
                                    read: false,
                                });

                            Alert.alert('Éxito', 'Locación cancelada correctamente');
                            fetchActiveRentals();
                        } catch (error) {
                            console.error('Error al cancelar locación:', error);
                            Alert.alert('Error', 'No se pudo cancelar la locación');
                        }
                    }
                }
            ]
        );
    };

    if (activeRentals.length === 0 || !visible) {
        return null;
    }

    const activeRental = activeRentals[currentIndex];

    // Verificação adicional de segurança
    if (!activeRental) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setVisible(false)}
        >
            <View style={ownerRentalConfirmationStyles.modalOverlay}>
                <ScrollView
                    contentContainerStyle={ownerRentalConfirmationStyles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={ownerRentalConfirmationStyles.modalContent}>
                        {/* Header */}
                        <View style={ownerRentalConfirmationStyles.header}>
                            <Text style={ownerRentalConfirmationStyles.headerTitle}>
                                {activeRental.status === 'approved' ? '📦 Entrega Pendiente' : '⏳ Aguardando Devolución'}
                            </Text>
                            <TouchableOpacity
                                style={ownerRentalConfirmationStyles.closeButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={ownerRentalConfirmationStyles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de Página */}
                        {activeRentals.length > 1 && (
                            <View style={ownerRentalConfirmationStyles.paginationContainer}>
                                <TouchableOpacity
                                    style={ownerRentalConfirmationStyles.arrowButton}
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
                                        style={[ownerRentalConfirmationStyles.arrowText, currentIndex === 0 && ownerRentalConfirmationStyles.arrowDisabled]}>←</Text>
                                </TouchableOpacity>

                                <View style={ownerRentalConfirmationStyles.dotsContainer}>
                                    {activeRentals.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                ownerRentalConfirmationStyles.dot,
                                                index === currentIndex && ownerRentalConfirmationStyles.dotActive
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Text style={ownerRentalConfirmationStyles.pageIndicator}>
                                    {currentIndex + 1} / {activeRentals.length}
                                </Text>

                                <TouchableOpacity
                                    style={ownerRentalConfirmationStyles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex < activeRentals.length - 1) {
                                            const newIndex = currentIndex + 1;
                                            setCurrentIndex(newIndex);
                                            setCodeInput('');
                                        }
                                    }}
                                    disabled={currentIndex === activeRentals.length - 1}
                                >
                                    <Text
                                        style={[ownerRentalConfirmationStyles.arrowText, currentIndex === activeRentals.length - 1 && ownerRentalConfirmationStyles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Cronômetro */}
                        <View style={ownerRentalConfirmationStyles.timerContainer}>
                            <Text style={ownerRentalConfirmationStyles.timerLabel}>
                                {activeRental.status === 'approved' ? 'Tiempo para entrega:' : 'Tiempo para devolución:'}
                            </Text>
                            <Text
                                style={ownerRentalConfirmationStyles.timerValue}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {timeRemaining}
                            </Text>
                        </View>

                        {/* Dados da Locação */}
                        <View style={ownerRentalConfirmationStyles.detailsContainer}>
                            <Text style={ownerRentalConfirmationStyles.itemTitle}>{activeRental.item?.title || 'Item'}</Text>

                            <View style={ownerRentalConfirmationStyles.detailRow}>
                                <Text style={ownerRentalConfirmationStyles.detailLabel}>📅 Recogida:</Text>
                                <Text style={ownerRentalConfirmationStyles.detailValue}>
                                    {formatDate(activeRental.start_date)} - {activeRental.pickup_time || '10:00'}
                                </Text>
                            </View>

                            <View style={ownerRentalConfirmationStyles.detailRow}>
                                <Text style={ownerRentalConfirmationStyles.detailLabel}>📅 Devolución:</Text>
                                <Text style={ownerRentalConfirmationStyles.detailValue}>
                                    {formatDate(activeRental.end_date)} - {activeRental.return_time || '18:00'}
                                </Text>
                            </View>

                            <View style={ownerRentalConfirmationStyles.detailRow}>
                                <Text style={ownerRentalConfirmationStyles.detailLabel}>👤 Locatario:</Text>
                                <Text style={ownerRentalConfirmationStyles.detailValue}>
                                    {activeRental.renter?.full_name || 'Usuario'}
                                </Text>
                            </View>

                            <View style={ownerRentalConfirmationStyles.detailRow}>
                                <Text style={ownerRentalConfirmationStyles.detailLabel}>📍 Dirección de Entrega:</Text>
                                <Text style={ownerRentalConfirmationStyles.detailValue}>
                                    {activeRental.item?.street ? (
                                        `${activeRental.item.street}${activeRental.item.number ? `, ${activeRental.item.number}` : ''}${activeRental.item.complement ? `, ${activeRental.item.complement}` : ''}\n${activeRental.item.postal_code} ${activeRental.item.city}${activeRental.item.province ? `, ${activeRental.item.province}` : ''}`
                                    ) : (
                                        'Dirección no disponible'
                                    )}
                                </Text>
                            </View>

                            <View style={ownerRentalConfirmationStyles.detailRow}>
                                <Text style={ownerRentalConfirmationStyles.detailLabel}>💰 Total a Recibir:</Text>
                                <Text style={[ownerRentalConfirmationStyles.detailValue, ownerRentalConfirmationStyles.priceText]}>
                                    €{calculateOwnerAmount(activeRental).toFixed(2)}
                                </Text>
                            </View>

                            {/* SE STATUS É 'APPROVED': Mostra instruções e campo de código */}
                            {activeRental.status === 'approved' && (
                                <>
                                    {/* Instrucciones */}
                                    <View style={ownerRentalConfirmationStyles.instructionsContainer}>
                                        <Text style={ownerRentalConfirmationStyles.instructionsTitle}>📋 Instrucciones:</Text>
                                        <Text style={ownerRentalConfirmationStyles.instructionsText}>
                                            1. Entrega el artículo al locatario{'\n'}
                                            2. Verifica que ambos estén de acuerdo con el estado{'\n'}
                                            3. Solicita el código de recogida al locatario{'\n'}
                                            4. Ingresa el código abajo para confirmar la entrega
                                        </Text>
                                    </View>

                                    {/* Campo de Código */}
                                    <View style={ownerRentalConfirmationStyles.codeInputContainer}>
                                        <Text style={ownerRentalConfirmationStyles.codeInputLabel}>Código del Locatario:</Text>
                                        <TextInput
                                            style={ownerRentalConfirmationStyles.codeInput}
                                            value={codeInput}
                                            onChangeText={setCodeInput}
                                            placeholder="000000"
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            placeholderTextColor="#999"
                                        />
                                        <Text style={ownerRentalConfirmationStyles.codeInputHint}>
                                            El locatario debe mostrarte su código de 6 dígitos después de confirmar que el
                                            artículo está de acuerdo con lo anunciado.
                                        </Text>
                                    </View>

                                    {/* Código do Owner (Referência) */}
                                    <View style={ownerRentalConfirmationStyles.ownerCodeContainer}>
                                        <Text style={ownerRentalConfirmationStyles.ownerCodeLabel}>Tu Código de Devolución:</Text>
                                        <View style={ownerRentalConfirmationStyles.ownerCodeBadge}>
                                            <Text style={ownerRentalConfirmationStyles.ownerCodeValue}>
                                                {activeRental.owner_code || '------'}
                                            </Text>
                                        </View>
                                        <Text style={ownerRentalConfirmationStyles.ownerCodeHint}>
                                            Guarda este código. El locatario deberá ingresarlo al devolver el artículo.
                                        </Text>
                                    </View>
                                </>
                            )}

                            {/* SE STATUS É 'ACTIVE': Mostra apenas owner_code destacado */}
                            {activeRental.status === 'active' && (
                                <>
                                    {/* Mensagem de aguardo */}
                                    <View style={ownerRentalConfirmationStyles.activeWarning}>
                                        <Text style={ownerRentalConfirmationStyles.activeWarningIcon}>✅</Text>
                                        <View style={{flex: 1}}>
                                            <Text style={ownerRentalConfirmationStyles.activeWarningTitle}>Artículo Entregado</Text>
                                            <Text style={ownerRentalConfirmationStyles.activeWarningText}>
                                                El locatario tiene el artículo. Aguarda la devolución en la fecha acordada.
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Código do Owner DESTACADO */}
                                    <View style={ownerRentalConfirmationStyles.ownerCodeContainerActive}>
                                        <Text style={ownerRentalConfirmationStyles.ownerCodeLabelActive}>🔑 Tu Código de Devolución:</Text>
                                        <View style={ownerRentalConfirmationStyles.ownerCodeBadgeActive}>
                                            <Text style={ownerRentalConfirmationStyles.ownerCodeValueActive}>
                                                {activeRental.owner_code || '------'}
                                            </Text>
                                        </View>
                                        <Text style={ownerRentalConfirmationStyles.ownerCodeHintActive}>
                                            📌 Cuando el locatario devuelva el artículo:{'\n'}
                                            1. Verifica que esté en buenas condiciones{'\n'}
                                            2. Muestra este código al locatario{'\n'}
                                            3. El locatario ingresará el código para confirmar la devolución{'\n'}
                                            4. El pago será liberado automáticamente
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Botões */}
                        <View style={ownerRentalConfirmationStyles.buttonsContainer}>
                            {activeRental.status === 'approved' && (
                                <TouchableOpacity
                                    style={[ownerRentalConfirmationStyles.confirmButton, confirming && ownerRentalConfirmationStyles.confirmButtonDisabled]}
                                    onPress={handleConfirmPickup}
                                    disabled={confirming}
                                >
                                    <Text style={ownerRentalConfirmationStyles.confirmButtonText}>
                                        {confirming ? 'Confirmando...' : '✓ Confirmar Entrega'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Botão de Chat - Sempre visível */}
                            <TouchableOpacity
                                style={ownerRentalConfirmationStyles.chatButton}
                                onPress={handleOpenChat}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{marginRight: 8}} />
                                <Text style={ownerRentalConfirmationStyles.chatButtonText}>
                                    Chatear con {activeRental.renter?.full_name || 'Locatario'}
                                </Text>
                            </TouchableOpacity>

                            {/* Botão de Cancelar - Sempre visível */}
                            <TouchableOpacity
                                style={ownerRentalConfirmationStyles.cancelButton}
                                onPress={handleCancelRental}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
                                <Text style={ownerRentalConfirmationStyles.cancelButtonText}>Cancelar Locación</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={ownerRentalConfirmationStyles.closeModalButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={ownerRentalConfirmationStyles.closeModalButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Espaço adicional para garantir scroll */}
                        <View style={{ height: 20 }} />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};



export default OwnerRentalConfirmationModal;

