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
    Linking,
    Platform
} from 'react-native';
import {supabase} from '../../supabase';

const UnifiedRentalModal = ({session}) => {
    const [allRentals, setAllRentals] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchAllRentals();
        }
    }, [session]);

    useEffect(() => {
        if (visible && session?.user?.id) {
            fetchAllRentals();
        }
    }, [visible]);

    useEffect(() => {
        if (allRentals.length > 0 && visible) {
            const interval = setInterval(() => {
                updateTimeRemaining();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [allRentals, visible, currentIndex]);

    const fetchAllRentals = async () => {
        try {
            // Buscar locações onde usuário é LOCATÁRIO (renter)
            // Busca 'approved' (aguardando retirada) E 'active' (em locação, aguardando devolução)
            const {data: renterRentals, error: renterError} = await supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                    renter:profiles!rentals_renter_id_fkey(full_name)
                `)
                .eq('renter_id', session.user.id)
                .in('status', ['approved', 'active'])
                .gte('start_date', new Date().toISOString().split('T')[0]);

            // Buscar locações onde usuário é LOCADOR (owner)
            // Apenas 'approved' (aguardando entrega) - active não aparece para owner
            const {data: ownerRentals, error: ownerError} = await supabase
                .from('rentals')
                .select(`
                    *,
                    item:items(*),
                    owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                    renter:profiles!rentals_renter_id_fkey(full_name)
                `)
                .eq('owner_id', session.user.id)
                .eq('status', 'approved')
                .gte('start_date', new Date().toISOString().split('T')[0]);

            if (renterError && renterError.code !== 'PGRST116') {
                console.error('Erro ao buscar locações como renter:', renterError);
            }

            if (ownerError && ownerError.code !== 'PGRST116') {
                console.error('Erro ao buscar locações como owner:', ownerError);
            }

            // Combinar e adicionar flag de tipo
            const combinedRentals = [
                ...(renterRentals || []).map(r => ({...r, userRole: 'renter'})),
                ...(ownerRentals || []).map(r => ({...r, userRole: 'owner'}))
            ];

            // Ordenar por data
            combinedRentals.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            console.log('🔵 TOTAL de locações encontradas:', combinedRentals.length);
            console.log('  - Como locatário (renter):', renterRentals?.length || 0);
            console.log('  - Como locador (owner):', ownerRentals?.length || 0);

            if (combinedRentals.length > 0) {
                setAllRentals(combinedRentals);
                setVisible(true);
                updateTimeRemaining(combinedRentals[0]);
            } else {
                console.log('⚠️ Nenhuma locação ativa encontrada');
                setVisible(false);
            }
        } catch (error) {
            console.error('Erro ao buscar locações:', error);
        }
    };

    const updateTimeRemaining = (rental = allRentals[currentIndex]) => {
        if (!rental) return;

        const now = new Date();
        const pickupDateTime = new Date(`${rental.start_date}T${rental.pickup_time || '10:00'}:00`);
        const diff = pickupDateTime - now;

        if (diff <= 0) {
            if (rental.userRole === 'renter') {
                setTimeRemaining('Hora de recoger el artículo');
            } else {
                setTimeRemaining('Hora de entregar el artículo');
            }
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

    const handleConfirmAction = async () => {
        const currentRental = allRentals[currentIndex];

        if (currentRental.userRole === 'owner') {
            // LOCADOR: Confirmar entrega (precisa validar código do locatário)
            if (!codeInput || codeInput.trim() === '') {
                Alert.alert('Error', 'Por favor, ingresa el código del locatario');
                return;
            }

            if (codeInput.trim() !== currentRental.renter_code) {
                Alert.alert(
                    'Código Incorrecto',
                    'El código ingresado no coincide. Por favor, solicita el código correcto al locatario.',
                    [{text: 'OK'}]
                );
                setCodeInput('');
                return;
            }

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
                                const {error} = await supabase
                                    .from('rentals')
                                    .update({
                                        status: 'active',
                                        pickup_confirmed_at: new Date().toISOString()
                                    })
                                    .eq('id', currentRental.id);

                                if (error) throw error;

                                await supabase
                                    .from('user_notifications')
                                    .insert({
                                        user_id: currentRental.renter_id,
                                        type: 'rental_active',
                                        title: 'Locación Confirmada',
                                        message: `La entrega de "${currentRental.item.title}" fue confirmada. No olvides devolverlo en la fecha acordada.`,
                                        related_id: currentRental.id,
                                        read: false,
                                    });

                                Alert.alert('Éxito', 'Entrega confirmada. El artículo ahora está en locación.', [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // Remove da lista (owner não vê mais 'active')
                                            const updatedRentals = allRentals.filter((_, index) => index !== currentIndex);
                                            setAllRentals(updatedRentals);
                                            setCodeInput('');

                                            if (updatedRentals.length === 0) {
                                                setVisible(false);
                                            } else if (currentIndex >= updatedRentals.length) {
                                                setCurrentIndex(updatedRentals.length - 1);
                                            }
                                        }
                                    }
                                ]);
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
        } else {
            // LOCATÁRIO
            if (currentRental.status === 'approved') {
                // Se ainda não foi retirado: Ação de maps
                openMaps(currentRental);
            } else if (currentRental.status === 'active') {
                // Se já foi retirado: Confirmar devolução
                if (!codeInput || codeInput.trim() === '') {
                    Alert.alert('Error', 'Por favor, ingresa el código del propietario');
                    return;
                }

                if (codeInput.trim() !== currentRental.owner_code) {
                    Alert.alert(
                        'Código Incorrecto',
                        'El código ingresado no coincide. Por favor, solicita el código correcto al propietario.',
                        [{text: 'OK'}]
                    );
                    setCodeInput('');
                    return;
                }

                Alert.alert(
                    'Confirmar Devolución',
                    '¿Confirmas que el artículo fue devuelto al propietario en buenas condiciones?',
                    [
                        {text: 'Cancelar', style: 'cancel'},
                        {
                            text: 'Confirmar',
                            onPress: async () => {
                                setConfirming(true);
                                try {
                                    const {error} = await supabase
                                        .from('rentals')
                                        .update({
                                            status: 'completed',
                                            return_confirmed_at: new Date().toISOString()
                                        })
                                        .eq('id', currentRental.id);

                                    if (error) throw error;

                                    // Notificar owner
                                    await supabase
                                        .from('user_notifications')
                                        .insert({
                                            user_id: currentRental.owner_id,
                                            type: 'rental_completed',
                                            title: 'Devolución Confirmada',
                                            message: `La devolución de "${currentRental.item.title}" fue confirmada. El pago será procesado.`,
                                            related_id: currentRental.id,
                                            read: false,
                                        });

                                    Alert.alert('¡Éxito!', 'Devolución confirmada. Gracias por usar RentUp!', [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                const updatedRentals = allRentals.filter((_, index) => index !== currentIndex);
                                                setAllRentals(updatedRentals);
                                                setCodeInput('');

                                                if (updatedRentals.length === 0) {
                                                    setVisible(false);
                                                } else if (currentIndex >= updatedRentals.length) {
                                                    setCurrentIndex(updatedRentals.length - 1);
                                                }
                                            }
                                        }
                                    ]);
                                } catch (error) {
                                    console.error('Erro ao confirmar devolução:', error);
                                    Alert.alert('Error', 'No se pudo confirmar la devolución');
                                } finally {
                                    setConfirming(false);
                                }
                            }
                        }
                    ]
                );
            }
        }
    };

    const openMaps = (rental) => {
        if (!rental?.owner) {
            Alert.alert('Error', 'No se pudo obtener la dirección');
            return;
        }

        const {address, city, postal_code} = rental.owner;
        const fullAddress = `${address}, ${postal_code} ${city}, España`;
        const encodedAddress = encodeURIComponent(fullAddress);

        const googleMapsUrl = Platform.select({
            ios: `comgooglemaps://?q=${encodedAddress}`,
            android: `google.navigation:q=${encodedAddress}`
        });

        Linking.canOpenURL(googleMapsUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(googleMapsUrl);
                } else {
                    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                    return Linking.openURL(webUrl);
                }
            })
            .catch((err) => {
                console.error('Erro ao abrir Google Maps:', err);
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

    if (allRentals.length === 0 || !visible) {
        return null;
    }

    const currentRental = allRentals[currentIndex];
    const isOwner = currentRental.userRole === 'owner';

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
                        <View style={[styles.header, isOwner ? styles.headerOwner : styles.headerRenter]}>
                            <Text style={styles.headerTitle}>
                                {isOwner ? '📦 Entrega Pendiente' : '🎉 Locación Activa'}
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de Página */}
                        {allRentals.length > 1 && (
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
                                    {allRentals.map((rental, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                index === currentIndex && styles.dotActive,
                                                rental.userRole === 'owner' ? styles.dotOwner : styles.dotRenter
                                            ]}
                                        />
                                    ))}
                                </View>

                                <Text style={styles.pageIndicator}>
                                    {currentIndex + 1} / {allRentals.length}
                                </Text>

                                <TouchableOpacity
                                    style={styles.arrowButton}
                                    onPress={() => {
                                        if (currentIndex < allRentals.length - 1) {
                                            const newIndex = currentIndex + 1;
                                            console.log('➡️ Navegando para locação', newIndex + 1);
                                            setCurrentIndex(newIndex);
                                            setCodeInput('');
                                        }
                                    }}
                                    disabled={currentIndex === allRentals.length - 1}
                                >
                                    <Text
                                        style={[styles.arrowText, currentIndex === allRentals.length - 1 && styles.arrowDisabled]}>→</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Badge de Tipo */}
                        <View style={styles.roleContainer}>
                            <View style={[styles.roleBadge, isOwner ? styles.roleBadgeOwner : styles.roleBadgeRenter]}>
                                <Text style={styles.roleBadgeText}>
                                    {isOwner ? '👤 Tú eres el PROPIETARIO' : '🎒 Tú eres el LOCATARIO'}
                                </Text>
                            </View>
                        </View>

                        {/* Cronômetro */}
                        <View style={[styles.timerContainer, isOwner ? styles.timerOwner : styles.timerRenter]}>
                            <Text style={styles.timerLabel}>
                                {isOwner ? 'Tiempo para entrega:' : 'Tiempo para recogida:'}
                            </Text>
                            <Text
                                style={[styles.timerValue, isOwner ? styles.timerValueOwner : styles.timerValueRenter]}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                            >
                                {timeRemaining}
                            </Text>
                        </View>

                        {/* Dados da Locação */}
                        <View style={styles.detailsContainer}>
                            <Text style={styles.itemTitle}>{currentRental.item?.title || 'Item'}</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Recogida:</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(currentRental.start_date)} - {currentRental.pickup_time || '10:00'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>📅 Devolución:</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(currentRental.end_date)} - {currentRental.return_time || '18:00'}
                                </Text>
                            </View>

                            {isOwner ? (
                                <>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>👤 Locatario:</Text>
                                        <Text style={styles.detailValue}>
                                            {currentRental.renter?.full_name || 'Usuario'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>💰 Total a Recibir:</Text>
                                        <Text style={[styles.detailValue, styles.priceText]}>
                                            €{parseFloat(currentRental.owner_amount || currentRental.subtotal || 0).toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Campo de Código para Owner */}
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
                                            El locatario debe mostrarte su código de 6 dígitos
                                        </Text>
                                    </View>

                                    {/* Owner Code */}
                                    <View style={styles.ownerCodeContainer}>
                                        <Text style={styles.ownerCodeLabel}>Tu Código de Devolución:</Text>
                                        <View style={styles.ownerCodeBadge}>
                                            <Text style={styles.ownerCodeValue}>
                                                {currentRental.owner_code || '------'}
                                            </Text>
                                        </View>
                                        <Text style={styles.ownerCodeHint}>
                                            Debes proporcionar este código al locatario después de garantizar que el artículo ha sido
                                            devuelto en las mismas condiciones en que fue retirado.
                                            (Según el tipo de artículo, se deben considerar los desgastes naturales de uso.)
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>👤 Propietario:</Text>
                                        <Text style={styles.detailValue}>
                                            {currentRental.owner?.full_name || 'Usuario'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>📍 Dirección:</Text>
                                        <Text style={styles.detailValue}>
                                            {currentRental.owner?.address}, {currentRental.owner?.city}
                                        </Text>
                                    </View>

                                    {/* Se status é 'approved': Mostra código para retirada */}
                                    {currentRental.status === 'approved' && (
                                        <View style={styles.renterCodeContainer}>
                                            <Text style={styles.renterCodeLabel}>Código de Recogida:</Text>
                                            <View style={styles.renterCodeBadge}>
                                                <Text style={styles.renterCodeValue}>
                                                    {currentRental.renter_code || '------'}
                                                </Text>
                                            </View>
                                            <Text style={styles.renterCodeHint}>
                                                Entrega este código al propietario del artículo después de confirmar que el
                                                artículo está de acuerdo con lo anunciado.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Se status é 'active': Mostra campo para digitar código de devolução */}
                                    {currentRental.status === 'active' && (
                                        <>
                                            <View style={styles.returnWarning}>
                                                <Text style={styles.returnWarningIcon}>⏰</Text>
                                                <Text style={styles.returnWarningText}>
                                                    Artículo en locación. Debes devolverlo hasta el {formatDate(currentRental.end_date)} a las {currentRental.return_time || '18:00'}.
                                                </Text>
                                            </View>

                                            <View style={styles.codeInputContainer}>
                                                <Text style={styles.codeInputLabel}>Código de Devolución del Propietario:</Text>
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
                                                    El propietario debe mostrarte su código de 6 dígitos después de verificar que el artículo está en buenas condiciones
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Botões */}
                        <View style={styles.buttonsContainer}>
                            {isOwner ? (
                                <TouchableOpacity
                                    style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                                    onPress={handleConfirmAction}
                                    disabled={confirming}
                                >
                                    <Text style={styles.confirmButtonText}>
                                        {confirming ? 'Confirmando...' : '✓ Confirmar Entrega'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    {currentRental.status === 'approved' ? (
                                        <TouchableOpacity
                                            style={styles.mapsButton}
                                            onPress={() => openMaps(currentRental)}
                                        >
                                            <Text style={styles.mapsButtonIcon}>📍</Text>
                                            <Text style={styles.mapsButtonText}>Iniciar Pick Up</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                                            onPress={handleConfirmAction}
                                            disabled={confirming}
                                        >
                                            <Text style={styles.confirmButtonText}>
                                                {confirming ? 'Confirmando...' : '✓ Confirmar Devolución'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerRenter: {
        backgroundColor: '#10B981',
    },
    headerOwner: {
        backgroundColor: '#2c4455',
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
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotRenter: {
        backgroundColor: '#10B981',
    },
    dotOwner: {
        backgroundColor: '#2c4455',
    },
    pageIndicator: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    roleContainer: {
        padding: 15,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    roleBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    roleBadgeRenter: {
        backgroundColor: '#D1FAE5',
    },
    roleBadgeOwner: {
        backgroundColor: '#DBEAFE',
    },
    roleBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    timerContainer: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    timerRenter: {
        backgroundColor: '#EFF6FF',
    },
    timerOwner: {
        backgroundColor: '#F0F9FF',
    },
    timerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    timerValue: {
        fontSize: 32,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
    },
    timerValueRenter: {
        color: '#10B981',
    },
    timerValueOwner: {
        color: '#2c4455',
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
    renterCodeContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#D1FAE5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    renterCodeLabel: {
        fontSize: 14,
        color: '#065F46',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    renterCodeBadge: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    renterCodeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
        letterSpacing: 4,
        fontVariant: ['tabular-nums'],
    },
    renterCodeHint: {
        fontSize: 12,
        color: '#065F46',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    returnWarning: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    returnWarningIcon: {
        fontSize: 24,
    },
    returnWarningText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        fontWeight: '600',
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
    mapsButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
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
});

export default UnifiedRentalModal;

