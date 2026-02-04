import React, {useState, useEffect} from 'react';
import {View,
    Text,
    Modal,
    TouchableOpacity,
    Linking,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {supabase} from '../../supabase';
import { activeRentalStyles } from '../styles/components/activeRentalStyles';

const ActiveRentalModal = ({session, navigation}) => {
    const [activeRentals, setActiveRentals] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');

    // TEMPORÁRIO: Valor fixo para debug
    const SCREEN_WIDTH = 375;

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
                .eq('renter_id', session.user.id)
                .in('status', ['approved', 'active'])  // ✅ Buscar approved E active
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
        if (!rental || !rental.start_date || !rental.pickup_time) {
            setTimeRemaining('Calculando...');
            return;
        }

        const now = new Date();

        // ✅ Extrair apenas a data (YYYY-MM-DD)
        const startDateOnly = rental.start_date.split('T')[0];

        // ✅ Dividir o tempo em horas e minutos
        const [pickupHour, pickupMinute] = (rental.pickup_time || '10:00').split(':');

        // ✅ Criar data usando construtor com parâmetros separados (evita problemas de timezone)
        const [startYear, startMonth, startDay] = startDateOnly.split('-');

        const pickupDateTime = new Date(
            parseInt(startYear),
            parseInt(startMonth) - 1, // Mês é 0-indexed
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
            setTimeRemaining('Hora de recoger el artículo y garantizar que está de acuerdo con lo anunciado');
            return;
        }

        // ✅ Cálculo mais preciso usando totalSeconds
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
    };

    const openMaps = () => {
        const activeRental = activeRentals[currentIndex];

        if (!activeRental?.owner) {
            Alert.alert('Error', 'No se pudo obtener la dirección');
            return;
        }

        const {address, city, postal_code} = activeRental.owner;
        const fullAddress = `${address}, ${postal_code} ${city}, España`;
        const encodedAddress = encodeURIComponent(fullAddress);

        // Forçar abertura do Google Maps em todas as plataformas
        const googleMapsUrl = Platform.select({
            ios: `comgooglemaps://?q=${encodedAddress}`,
            android: `google.navigation:q=${encodedAddress}`
        });

        Linking.canOpenURL(googleMapsUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(googleMapsUrl);
                } else {
                    // Fallback para Google Maps no navegador
                    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                    return Linking.openURL(webUrl);
                }
            })
            .catch((err) => {
                console.error('Erro ao abrir Google Maps:', err);
                // Tentar abrir no navegador como último recurso
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
        const activeRental = activeRentals[currentIndex];

        // Fechar o modal e navegar para o chat
        setVisible(false);

        if (navigation) {
            // Criar objeto otherUser com estrutura correta
            const otherUser = {
                id: activeRental.owner_id,
                full_name: activeRental.owner?.full_name || 'Propietario',
            };

            // Criar conversation_id único incluindo ITEM_ID
            const conversationId = [session.user.id, activeRental.owner_id].sort().join('_') + '_' + activeRental.item_id;

            navigation.navigate('ChatConversation', {
                itemId: activeRental.item_id,
                item: activeRental.item,
                otherUser: otherUser,
                conversationId: conversationId,
            });
        }
    };

    const handleEditRental = () => {
        const activeRental = activeRentals[currentIndex];

        Alert.alert(
            'Editar Locación',
            'Para editar las fechas, tu solicitud volverá al estado "pendiente" y el propietario deberá aprobarla nuevamente.',
            [
                {text: 'Cancelar', style: 'cancel'},
                {
                    text: 'Continuar',
                    onPress: () => {
                        setVisible(false);
                        navigation.navigate('RequestRental', {
                            itemId: activeRental.item_id,
                            rentalId: activeRental.id,
                            editMode: true
                        });
                    }
                }
            ]
        );
    };

    const handleCancelRental = () => {
        const activeRental = activeRentals[currentIndex];

        Alert.alert(
            'Cancelar Locación',
            '¿Estás seguro de que deseas cancelar esta locación?',
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

                            // Enviar notificação ao proprietário
                            await supabase
                                .from('user_notifications')
                                .insert({
                                    user_id: activeRental.owner_id,
                                    type: 'rental_cancelled',
                                    title: 'Locación Cancelada',
                                    message: `${session.user.email} ha cancelado la locación de "${activeRental.item.title}".`,
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
            <View style={activeRentalStyles.modalOverlay}>
                <ScrollView
                    contentContainerStyle={activeRentalStyles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={activeRentalStyles.modalContent}>
                        {/* Header */}
                        <View style={activeRentalStyles.header}>
                            <Text style={activeRentalStyles.headerTitle}>🎉 Locación Activa</Text>
                            <TouchableOpacity
                                style={activeRentalStyles.closeButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={activeRentalStyles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de Página */}
                        {activeRentals.length > 1 && (
                            <View style={activeRentalStyles.paginationContainer}>
                                <TouchableOpacity
                                    style={activeRentalStyles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex > 0) {
                                            const newIndex = currentIndex - 1;
                                            console.log('⬅️ Navegando para locação', newIndex + 1);
                                            setCurrentIndex(newIndex);
                                        }
                                    }}
                                    disabled={currentIndex === 0}
                                >
                                    <Text style={[activeRentalStyles.arrowText, currentIndex === 0 && activeRentalStyles.arrowDisabled]}>←</Text>
                                </TouchableOpacity>

                                <View style={activeRentalStyles.dotsContainer}>
                                    {activeRentals.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                activeRentalStyles.dot,
                                                index === currentIndex && activeRentalStyles.dotActive
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Text style={activeRentalStyles.pageIndicator}>
                                    {currentIndex + 1} / {activeRentals.length}
                                </Text>

                                <TouchableOpacity
                                    style={activeRentalStyles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex < activeRentals.length - 1) {
                                            const newIndex = currentIndex + 1;
                                            console.log('➡️ Navegando para locação', newIndex + 1);
                                            setCurrentIndex(newIndex);
                                        }
                                    }}
                                    disabled={currentIndex === activeRentals.length - 1}
                                >
                                    <Text style={[activeRentalStyles.arrowText, currentIndex === activeRentals.length - 1 && activeRentalStyles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Cronômetro */}
                        <View style={activeRentalStyles.timerContainer}>
                        <Text style={activeRentalStyles.timerLabel}>Tiempo para recogida:</Text>
                        <Text
                            style={activeRentalStyles.timerValue}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                        >
                            {timeRemaining}
                        </Text>
                    </View>

                    {/* Dados da Locação */}
                    <View style={activeRentalStyles.detailsContainer}>
                        <Text style={activeRentalStyles.itemTitle}>{activeRental.item?.title || 'Item'}</Text>

                        <View style={activeRentalStyles.detailRow}>
                            <Text style={activeRentalStyles.detailLabel}>📅 Recogida:</Text>
                            <Text style={activeRentalStyles.detailValue}>
                                {formatDate(activeRental.start_date)} - {activeRental.pickup_time || '10:00'}
                            </Text>
                        </View>

                        <View style={activeRentalStyles.detailRow}>
                            <Text style={activeRentalStyles.detailLabel}>📅 Devolución:</Text>
                            <Text style={activeRentalStyles.detailValue}>
                                {formatDate(activeRental.end_date)} - {activeRental.return_time || '18:00'}
                            </Text>
                        </View>

                        <View style={activeRentalStyles.detailRow}>
                            <Text style={activeRentalStyles.detailLabel}>👤 Propietario:</Text>
                            <Text style={activeRentalStyles.detailValue}>
                                {activeRental.owner?.full_name || 'Usuario'}
                            </Text>
                        </View>

                        <View style={activeRentalStyles.detailRow}>
                            <Text style={activeRentalStyles.detailLabel}>📍 Dirección:</Text>
                            <Text style={activeRentalStyles.detailValue}>
                                {activeRental.item?.street ? (
                                    `${activeRental.item.street}${activeRental.item.number ? `, ${activeRental.item.number}` : ''}${activeRental.item.complement ? `, ${activeRental.item.complement}` : ''}\n${activeRental.item.postal_code} ${activeRental.item.city}${activeRental.item.province ? `, ${activeRental.item.province}` : ''}`
                                ) : (
                                    activeRental.owner?.address ? `${activeRental.owner.address}, ${activeRental.owner.city}` : 'Dirección no disponible'
                                )}
                            </Text>
                        </View>

                        {/* Código de Recogida */}
                        <View style={activeRentalStyles.codeContainer}>
                            <Text style={activeRentalStyles.codeLabel}>Código de Recogida:</Text>
                            <View style={activeRentalStyles.codeBadge}>
                                <Text style={activeRentalStyles.codeValue}>{activeRental.renter_code || '------'}</Text>
                            </View>
                            <Text style={activeRentalStyles.codeHint}>
                                Entrega este código al propietario del artículo después de confirmar que el artículo
                                está de acuerdo con lo anunciado.
                            </Text>
                        </View>
                    </View>

                    {/* Botões */}
                    <View style={activeRentalStyles.buttonsContainer}>
                        {/* Botão de Editar */}
                        <TouchableOpacity
                            style={activeRentalStyles.editButton}
                            onPress={handleEditRental}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" style={{marginRight: 8}} />
                            <Text style={activeRentalStyles.editButtonText}>Editar Locación</Text>
                        </TouchableOpacity>

                        {/* Botão de Cancelar */}
                        <TouchableOpacity
                            style={activeRentalStyles.cancelButton}
                            onPress={handleCancelRental}
                        >
                            <Ionicons name="close-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
                            <Text style={activeRentalStyles.cancelButtonText}>Cancelar Locación</Text>
                        </TouchableOpacity>

                        {/* Botão de Chat */}
                        <TouchableOpacity
                            style={activeRentalStyles.chatButton}
                            onPress={handleOpenChat}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{marginRight: 8}} />
                            <Text style={activeRentalStyles.chatButtonText}>
                                Chatear con {activeRental.owner?.full_name || 'Propietario'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={activeRentalStyles.mapsButton}
                            onPress={openMaps}
                        >
                            <Text style={activeRentalStyles.mapsButtonIcon}>📍</Text>
                            <Text style={activeRentalStyles.mapsButtonText}>Iniciar Pick Up</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={activeRentalStyles.closeModalButton}
                            onPress={() => setVisible(false)}
                        >
                            <Text style={activeRentalStyles.closeModalButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                </ScrollView>
            </View>
        </Modal>
    );
};



export default ActiveRentalModal;

