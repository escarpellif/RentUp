import React, {useState, useEffect} from 'react';
import {View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Animated
} from 'react-native';
import {supabase} from '../../supabase';
import { reviewStyles } from '../styles/components/reviewStyles';

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
                'Tu evaluación ha sido enviada. Ayuda a mejorar la comunidad ALUKO.',
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
            <View style={reviewStyles.modalOverlay}>
                <ScrollView
                    contentContainerStyle={reviewStyles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={reviewStyles.modalContent}>
                        {/* Header */}
                        <View style={reviewStyles.header}>
                            <Text style={reviewStyles.headerTitle}>¿Cómo fue tu experiencia?</Text>
                        </View>

                        {/* User Info */}
                        <View style={reviewStyles.userInfoContainer}>
                            <View style={reviewStyles.userAvatar}>
                                <Text style={reviewStyles.userAvatarText}>
                                    {pendingReview.other_user_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={reviewStyles.userName}>{pendingReview.other_user_name}</Text>
                            {pendingReview.other_user_rating > 0 && (
                                <View style={reviewStyles.currentRatingContainer}>
                                    <Text style={reviewStyles.currentRatingText}>⭐</Text>
                                    <Text style={reviewStyles.currentRatingValue}>
                                        {parseFloat(pendingReview.other_user_rating).toFixed(1)}
                                    </Text>
                                </View>
                            )}
                            <Text style={reviewStyles.itemTitle}>{pendingReview.item_title}</Text>
                        </View>

                        {/* Rating Stars */}
                        <View style={reviewStyles.starsContainer}>
                            <Text style={reviewStyles.starsLabel}>Califica tu experiencia:</Text>
                            <View style={reviewStyles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => handleStarPress(star)}
                                        activeOpacity={0.7}
                                    >
                                        <Animated.Text
                                            style={[
                                                reviewStyles.star,
                                                {transform: [{scale: starAnimations[star - 1]}]}
                                            ]}
                                        >
                                            {star <= rating ? '⭐' : '☆'}
                                        </Animated.Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {rating > 0 && (
                                <Text style={reviewStyles.ratingText}>
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
                            <View style={reviewStyles.reasonContainer}>
                                <Text style={reviewStyles.reasonLabel}>
                                    ¿Por qué no 5 estrellas? * (Requerido)
                                </Text>
                                <TextInput
                                    style={[reviewStyles.reasonInput, reviewStyles.inputRequired]}
                                    value={reasonLowRating}
                                    onChangeText={setReasonLowRating}
                                    placeholder="Ayúdanos a entender qué salió mal..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                    maxLength={300}
                                />
                                <Text style={reviewStyles.charCount}>
                                    {reasonLowRating.length}/300
                                </Text>
                            </View>
                        )}

                        {/* Comment (opcional) */}
                        {rating > 0 && (
                            <View style={reviewStyles.commentContainer}>
                                <Text style={reviewStyles.commentLabel}>
                                    Comentario adicional (opcional)
                                </Text>
                                <TextInput
                                    style={reviewStyles.commentInput}
                                    value={comment}
                                    onChangeText={setComment}
                                    placeholder="Comparte más detalles sobre tu experiencia..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                />
                                <Text style={reviewStyles.charCount}>
                                    {comment.length}/500
                                </Text>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={reviewStyles.buttonsContainer}>
                            {rating > 0 ? (
                                <TouchableOpacity
                                    style={[reviewStyles.submitButton, submitting && reviewStyles.submitButtonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                >
                                    <Text style={reviewStyles.submitButtonText}>
                                        {submitting ? 'Enviando...' : 'Enviar Evaluación'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={reviewStyles.selectStarsHint}>
                                    <Text style={reviewStyles.selectStarsText}>
                                        👆 Selecciona las estrellas arriba
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={reviewStyles.skipButton}
                                onPress={handleSkip}
                            >
                                <Text style={reviewStyles.skipButtonText}>Omitir por ahora</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Info */}
                        <Text style={reviewStyles.infoText}>
                            💡 Las evaluaciones son públicas y ayudan a otros usuarios a tomar mejores decisiones.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};



export default ReviewModal;
