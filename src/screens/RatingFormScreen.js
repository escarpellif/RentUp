import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Button, Alert } from 'react-native';
import { supabase } from '../../supabase';
import { Rating } from 'react-native-ratings';
import { ratingFormScreenStyles as styles } from '../styles/screens/ratingFormScreenStyles';

export default function RatingFormScreen({ route, navigation, session }) {
    // Dados passados da transação concluída (simulando a rota de navegação)
    const { transaction } = route.params;

    // Determina quem é o avaliador e quem será o avaliado.
    // O avaliador é o usuário logado (session.user.id).
    const isLocadorRating = session.user.id === transaction.locador_id;

    // O avaliado será a outra parte.
    const avaliadoId = isLocadorRating ? transaction.locatario_id : transaction.locador_id;

    // A função avaliada (importante para o cálculo da média no backend)
    const roleRated = isLocadorRating ? 'LOCATARIO' : 'LOCADOR';
    const targetName = isLocadorRating ? 'el Arrendatario' : 'el Arrendador';

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    // ----------------------------------------------------
    // LÓGICA DE SUBMISSÃO DA AVALIAÇÃO CEGA
    // ----------------------------------------------------
    async function submitRating() {
        if (rating === 0) {
            Alert.alert('Error', 'Por favor, selecciona una puntuación.');
            return;
        }

        setLoading(true);

        // 1. Prepara a inserção da nota na tabela 'ratings'
        const ratingData = {
            transaction_id: transaction.id,
            avaliador_id: session.user.id,
            avaliado_id: avaliadoId,
            role_rated: roleRated,
            nota_geral: rating,
            comentario: comment,
        };

        // 2. Prepara a atualização da tabela 'transactions' (marcando como avaliado)
        const updateData = {};
        if (isLocadorRating) {
            updateData.locador_rated = true;
        } else {
            updateData.locatario_rated = true;
        }

        // 3. Executa as operações (idealmente em uma única transação/Cloud Function para maior segurança)

        // a) Insere a nota
        const { error: ratingError } = await supabase
            .from('ratings')
            .insert([ratingData]);

        if (ratingError) {
            setLoading(false);
            Alert.alert('Error al Enviar la Puntuación', ratingError.message);
            return;
        }

        // b) Atualiza o status de avaliação na transação
        const { error: transactionError } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', transaction.id);

        setLoading(false);

        if (transactionError) {
            // A nota foi salva, mas o status da transação não.
            // Isso requer atenção, mas o usuário deve seguir em frente.
            Alert.alert(
                'Atención',
                'Tu puntuación fue guardada, pero hubo un error al finalizar la transacción. Nuestro equipo lo verificará.'
            );
        } else {
            Alert.alert('¡Gracias!', `Has valorado a ${targetName}. Tu puntuación será revelada cuando la otra parte valore.`);
            navigation.goBack(); // Volta para a tela anterior
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Valora la Transacción</Text>

            <Text style={styles.prompt}>
                ¿Cómo fue tu experiencia con **{targetName}**?
            </Text>

            {/* Componente de Estrelas */}
            <View style={styles.ratingContainer}>
                <Rating
                    type='star'
                    ratingCount={5}
                    imageSize={30}
                    onFinishRating={setRating}
                    startingValue={rating}
                    style={{ paddingVertical: 10 }}
                />
            </View>

            {/* Comentário */}
            <Text style={styles.label}>Tu Comentario Público (Opcional)</Text>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                onChangeText={setComment}
                value={comment}
                placeholder={`Cuéntanos sobre tu experiencia con ${targetName}...`}
                multiline
                numberOfLines={4}
            />

            <Button
                title={loading ? 'Enviando...' : 'Finalizar Valoración'}
                onPress={submitRating}
                disabled={loading}
            />

            <View style={{height: 50}} />
        </ScrollView>
    );
}

