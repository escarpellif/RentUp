import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Button, Alert } from 'react-native';
import { supabase } from '../../supabase';
import { Rating } from 'react-native-ratings'; // Se você instalou 'react-native-ratings'
// import { StarRating } from 'expo-star-rating'; // Alternativa

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
    const targetName = isLocadorRating ? 'o Locatário' : 'o Locador';

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    // ----------------------------------------------------
    // LÓGICA DE SUBMISSÃO DA AVALIAÇÃO CEGA
    // ----------------------------------------------------
    async function submitRating() {
        if (rating === 0) {
            Alert.alert('Erro', 'Por favor, selecione uma nota.');
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
            Alert.alert('Erro no Envio da Nota', ratingError.message);
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
                'Atenção',
                'Sua nota foi salva, mas houve um erro ao finalizar a transação. Nossa equipe verificará.'
            );
        } else {
            Alert.alert('Obrigado!', `Você avaliou ${targetName}. Sua nota será revelada quando a outra parte avaliar.`);
            navigation.goBack(); // Volta para a tela anterior
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Avalie a Transação</Text>

            <Text style={styles.prompt}>
                Como foi sua experiência com **{targetName}**?
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
            <Text style={styles.label}>Seu Comentário Público (Opcional)</Text>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                onChangeText={setComment}
                value={comment}
                placeholder={`Conte-nos sobre sua experiência com ${targetName}...`}
                multiline
                numberOfLines={4}
            />

            <Button
                title={loading ? 'Enviando...' : 'Finalizar Avaliação'}
                onPress={submitRating}
                disabled={loading}
            />

            <View style={{height: 50}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    prompt: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
});