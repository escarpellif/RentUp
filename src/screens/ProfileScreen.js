import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { supabase } from '../../supabase';
import { Rating } from 'react-native-ratings'; // Para exibir a média de estrelas

export default function ProfileScreen({ session }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = session.user.id; // O ID do usuário logado

    useEffect(() => {
        fetchProfile();
    }, []);

    // Função para buscar o perfil na tabela 'profiles'
    async function fetchProfile() {
        setLoading(true);
        // Busca o perfil que corresponde ao ID do usuário logado
        const { data, error } = await supabase
            .from('profiles')
            .select('username, full_name, created_at, rating_avg_locador, rating_avg_locatario')
            .eq('id', userId)
            .single(); // Espera apenas uma linha (o perfil do usuário)

        if (error) {
            console.error('Erro ao buscar perfil:', error.message);
            setLoading(false);
            return;
        }

        setProfile(data);
        setLoading(false);
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Perfil não encontrado. Tente novamente.</Text>
            </View>
        );
    }

    // Função auxiliar para exibir a avaliação (se houver)
    const renderRating = (average) => {
        // Converte o valor numérico para exibição (ex: 4.5)
        const ratingValue = parseFloat(average || 0);

        return (
            <View style={styles.ratingBox}>
                <Text style={styles.ratingValue}>{ratingValue.toFixed(1)}</Text>
                <Rating
                    type='star'
                    ratingCount={5}
                    imageSize={18}
                    readonly
                    startingValue={ratingValue}
                    style={{ paddingHorizontal: 10 }}
                />
                <Text style={styles.ratingLabel}>Média de Estrelas</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.header}>Meu Perfil</Text>

                <View style={styles.infoCard}>
                    <Text style={styles.name}>{profile.full_name || profile.username}</Text>
                    <Text style={styles.username}>@{profile.username}</Text>
                    <Text style={styles.memberSince}>Membro desde: {formatDate(profile.created_at)}</Text>
                </View>

                {/* --- SEÇÃO DE AVALIAÇÕES --- */}
                <Text style={styles.sectionHeader}>Minhas Avaliações</Text>

                <View style={styles.ratingsContainer}>
                    <View style={styles.ratingSection}>
                        <Text style={styles.roleTitle}>Como Locador (Dono do Item)</Text>
                        {renderRating(profile.rating_avg_locador)}
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.roleTitle}>Como Locatário (Cliente)</Text>
                        {renderRating(profile.rating_avg_locatario)}
                    </View>
                </View>

                {/* Espaço para um futuro botão de edição ou listagem de itens */}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 2,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 5,
    },
    username: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 10,
    },
    memberSince: {
        fontSize: 12,
        color: '#aaa',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
        color: '#333',
    },
    ratingsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    ratingSection: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        elevation: 1,
    },
    roleTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    ratingBox: {
        alignItems: 'center',
    },
    ratingValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007bff',
    },
    ratingLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 5,
    }
});