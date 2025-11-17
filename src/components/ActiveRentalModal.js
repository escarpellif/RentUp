import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Platform,
    Alert,
    ScrollView,
    Dimensions
} from 'react-native';
import {supabase} from '../../supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ActiveRentalModal = ({session}) => {
    const [activeRentals, setActiveRentals] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');

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
                    renter:profiles!rentals_renter_id_fkey(full_name)
                `)
                .eq('renter_id', session.user.id)
                .eq('status', 'approved')
                .gte('start_date', new Date().toISOString().split('T')[0])
                .order('start_date', {ascending: true});

            console.log('🟢 ActiveRentalModal - Locações encontradas:', data?.length || 0);

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
                console.log('⚠️ Nenhuma locação ativa encontrada para renter');
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
            setTimeRemaining('Hora de recoger el artículo y garantizar que está de acuerdo con lo anunciado');
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

    const openMaps = () => {
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
                            <Text style={styles.headerTitle}>🎉 Locación Activa</Text>
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
                                        }
                                    }}
                                    disabled={currentIndex === 0}
                                >
                                    <Text style={[styles.arrowText, currentIndex === 0 && styles.arrowDisabled]}>←</Text>
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
                                        }
                                    }}
                                    disabled={currentIndex === activeRentals.length - 1}
                                >
                                    <Text style={[styles.arrowText, currentIndex === activeRentals.length - 1 && styles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Cronômetro */}
                        <View style={styles.timerContainer}>
                        <Text style={styles.timerLabel}>Tiempo para recogida:</Text>
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
                            <Text style={styles.detailLabel}>👤 Propietario:</Text>
                            <Text style={styles.detailValue}>
                                {activeRental.owner?.full_name || 'Usuario'}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>📍 Dirección:</Text>
                            <Text style={styles.detailValue}>
                                {activeRental.owner?.address}, {activeRental.owner?.city}
                            </Text>
                        </View>

                        {/* Código de Recogida */}
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>Código de Recogida:</Text>
                            <View style={styles.codeBadge}>
                                <Text style={styles.codeValue}>{activeRental.renter_code || '------'}</Text>
                            </View>
                            <Text style={styles.codeHint}>
                                Entrega este código al propietario del artículo después de confirmar que el artículo
                                está de acuerdo con lo anunciado.
                            </Text>
                        </View>
                    </View>

                    {/* Botões */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={styles.mapsButton}
                            onPress={openMaps}
                        >
                            <Text style={styles.mapsButtonIcon}>📍</Text>
                            <Text style={styles.mapsButtonText}>Iniciar Pick Up</Text>
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
        backgroundColor: '#10B981',
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
        backgroundColor: '#F0FDF4',
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
        color: '#10B981',
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
    codeContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F59E0B',
        borderStyle: 'dashed',
    },
    codeLabel: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    codeBadge: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    codeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F59E0B',
        letterSpacing: 4,
        fontVariant: ['tabular-nums'],
    },
    codeHint: {
        fontSize: 12,
        color: '#92400E',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    buttonsContainer: {
        padding: 20,
        gap: 12,
    },
    mapsButton: {
        flexDirection: 'row',
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mapsButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    mapsButtonText: {
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
        backgroundColor: '#F0FDF4',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 15,
    },
    arrowButton: {
        padding: 8,
    },
    arrowText: {
        fontSize: 24,
        color: '#10B981',
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
        backgroundColor: '#10B981',
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

export default ActiveRentalModal;

