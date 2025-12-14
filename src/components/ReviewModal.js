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
    Animated
} from 'react-native';
import {supabase} from '../../supabase';

const ReviewModal = ({session}) => {
    const [visible, setVisible] = useState(false);
    const [pendingReview, setPendingReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reasonLowRating, setReasonLowRating] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [starAnimations] = useState([...Array(5)].map(() => new Animated.Value(1)));

    useEffect(() => {
        if (session?.user?.id) {
            checkPendingReviews();
        }
    }, [session]);

    const checkPendingReviews = async () => {
        try {
            // Verificar se session existe antes de acessar user
            if (!session?.user?.id) {
                return;
            }

            const {data, error} = await supabase
                .from('rentals')
                .select(`
                    id,
                    status,
                    return_confirmed_at,
                    reviewed_by_renter,
                    reviewed_by_owner,
                    renter_id,
                    owner_id,
                    item:items(title),
                    owner:profiles!rentals_owner_id_fkey(id, full_name, rating_average),
                    renter:profiles!rentals_renter_id_fkey(id, full_name, rating_average)
                `)
                .eq('status', 'completed')
                .not('return_confirmed_at', 'is', null)
                .or(`and(renter_id.eq.${session.user.id},reviewed_by_renter.eq.false),and(owner_id.eq.${session.user.id},reviewed_by_owner.eq.false)`)
                .order('return_confirmed_at', {ascending: false})
                .limit(1);

            if (error) {
                console.error('Erro ao buscar reviews pendentes:', error);
                return;
            }

            if (data && data.length > 0) {
                const rental = data[0];
                const isRenter = rental.renter_id === session.user.id;

                setPendingReview({
                    rental_id: rental.id,
                    item_title: rental.item.title,
                    other_user_id: isRenter ? rental.owner.id : rental.renter.id,
                    other_user_name: isRenter ? rental.owner.full_name : rental.renter.full_name,
                    other_user_rating: isRenter ? rental.owner.rating_average : rental.renter.rating_average,
                    is_renter: isRenter
                });

                setVisible(true);
            }
        } catch (error) {
            console.error('Erro ao verificar reviews pendentes:', error);
        }
    };

    const animateStar = (index) => {
        Animated.sequence([
            Animated.timing(starAnimations[index], {
                toValue: 1.3,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(starAnimations[index], {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleStarPress = (value) => {
        setRating(value);
        animateStar(value - 1);

        // Limpar campos se mudou para >= 5
        if (value === 5) {
            setReasonLowRating('');
        }
    };

    const handleSubmit = async () => {
        // Validações
        if (rating === 0) {
            Alert.alert('Error', 'Por favor, selecciona una calificación');
            return;
        }

        if (rating < 5 && (!reasonLowRating || reasonLowRating.trim() === '')) {
            Alert.alert(
                'Motivo Requerido',
                'Por favor, indica el motivo de no haber dado 5 estrellas. Esto nos ayuda a mejorar el servicio.'
            );
            return;
        }

        setSubmitting(true);

        try {
            // Inserir review
            const {error: reviewError} = await supabase
                .from('reviews')
                .insert({
                    rental_id: pendingReview.rental_id,
                    reviewer_id: session.user.id,
                    reviewee_id: pendingReview.other_user_id,
                    rating: rating,
                    comment: comment.trim() || null,
                    reason_low_rating: rating < 5 ? reasonLowRating.trim() : null
                });

            if (reviewError) throw reviewError;

            // Enviar notificação ao usuário avaliado
            await supabase
                .from('user_notifications')
                .insert({
                    user_id: pendingReview.other_user_id,
                    type: 'new_review',
                    title: 'Nueva Evaluación Recibida',
                    message: `Has recibido una evaluación de ${rating} estrella${rating > 1 ? 's' : ''} por el alquiler de "${pendingReview.item_title}".`,
                    related_id: pendingReview.rental_id,
                    read: false,
                });

            Alert.alert(
                '¡Gracias!',
                'Tu evaluación ha sido enviada. Ayuda a mejorar la comunidad RentUp.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            resetForm();
                            setVisible(false);
                            // Verificar se há mais reviews pendentes
                            setTimeout(() => checkPendingReviews(), 1000);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao enviar review:', error);
            Alert.alert('Error', 'No se pudo enviar la evaluación. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        Alert.alert(
            'Omitir Evaluación',
            '¿Seguro que deseas omitir esta evaluación? Las evaluaciones ayudan a mejorar la comunidad.',
            [
                {text: 'Cancelar', style: 'cancel'},
                {
                    text: 'Omitir',
                    style: 'destructive',
                    onPress: () => {
                        resetForm();
                        setVisible(false);
                        // Verificar se há mais reviews pendentes
                        setTimeout(() => checkPendingReviews(), 1000);
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setRating(0);
        setComment('');
        setReasonLowRating('');
        setPendingReview(null);
    };

    if (!visible || !pendingReview) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleSkip}
        >
            <View style={styles.modalOverlay}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>¿Cómo fue tu experiencia?</Text>
                        </View>

                        {/* User Info */}
                        <View style={styles.userInfoContainer}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>
                                    {pendingReview.other_user_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.userName}>{pendingReview.other_user_name}</Text>
                            {pendingReview.other_user_rating > 0 && (
                                <View style={styles.currentRatingContainer}>
                                    <Text style={styles.currentRatingText}>⭐</Text>
                                    <Text style={styles.currentRatingValue}>
                                        {parseFloat(pendingReview.other_user_rating).toFixed(1)}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.itemTitle}>{pendingReview.item_title}</Text>
                        </View>

                        {/* Rating Stars */}
                        <View style={styles.starsContainer}>
                            <Text style={styles.starsLabel}>Califica tu experiencia:</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => handleStarPress(star)}
                                        activeOpacity={0.7}
                                    >
                                        <Animated.Text
                                            style={[
                                                styles.star,
                                                {transform: [{scale: starAnimations[star - 1]}]}
                                            ]}
                                        >
                                            {star <= rating ? '⭐' : '☆'}
                                        </Animated.Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {rating > 0 && (
                                <Text style={styles.ratingText}>
                                    {rating === 1 && 'Muy mala experiencia'}
                                    {rating === 2 && 'Mala experiencia'}
                                    {rating === 3 && 'Experiencia regular'}
                                    {rating === 4 && 'Buena experiencia'}
                                    {rating === 5 && '¡Excelente experiencia!'}
                                </Text>
                            )}
                        </View>

                        {/* Reason for Low Rating (obrigatório se < 5) */}
                        {rating > 0 && rating < 5 && (
                            <View style={styles.reasonContainer}>
                                <Text style={styles.reasonLabel}>
                                    ¿Por qué no 5 estrellas? * (Requerido)
                                </Text>
                                <TextInput
                                    style={[styles.reasonInput, styles.inputRequired]}
                                    value={reasonLowRating}
                                    onChangeText={setReasonLowRating}
                                    placeholder="Ayúdanos a entender qué salió mal..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                    maxLength={300}
                                />
                                <Text style={styles.charCount}>
                                    {reasonLowRating.length}/300
                                </Text>
                            </View>
                        )}

                        {/* Comment (opcional) */}
                        {rating > 0 && (
                            <View style={styles.commentContainer}>
                                <Text style={styles.commentLabel}>
                                    Comentario adicional (opcional)
                                </Text>
                                <TextInput
                                    style={styles.commentInput}
                                    value={comment}
                                    onChangeText={setComment}
                                    placeholder="Comparte más detalles sobre tu experiencia..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                />
                                <Text style={styles.charCount}>
                                    {comment.length}/500
                                </Text>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonsContainer}>
                            {rating > 0 ? (
                                <TouchableOpacity
                                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {submitting ? 'Enviando...' : 'Enviar Evaluación'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.selectStarsHint}>
                                    <Text style={styles.selectStarsText}>
                                        👆 Selecciona las estrellas arriba
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={handleSkip}
                            >
                                <Text style={styles.skipButtonText}>Omitir por ahora</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Info */}
                        <Text style={styles.infoText}>
                            💡 Las evaluaciones son públicas y ayudan a otros usuarios a tomar mejores decisiones.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 500,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    header: {
        backgroundColor: '#10B981',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    userInfoContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    userAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    userAvatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    currentRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    currentRatingText: {
        fontSize: 16,
    },
    currentRatingValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    itemTitle: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    starsContainer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    starsLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 20,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    star: {
        fontSize: 48,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
        marginTop: 8,
    },
    reasonContainer: {
        padding: 20,
        backgroundColor: '#FEF3C7',
        borderTopWidth: 3,
        borderTopColor: '#F59E0B',
    },
    reasonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 12,
    },
    reasonInput: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    inputRequired: {
        borderColor: '#F59E0B',
    },
    commentContainer: {
        padding: 20,
    },
    commentLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    commentInput: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 6,
    },
    buttonsContainer: {
        padding: 20,
        gap: 12,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    selectStarsHint: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    selectStarsText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    skipButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        fontStyle: 'italic',
    },
});

export default ReviewModal;
