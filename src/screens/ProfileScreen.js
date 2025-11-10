import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { Rating } from 'react-native-ratings';

export default function ProfileScreen({ session, navigation }) {
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
        return new Date(dateString).toLocaleDateString('es-ES', options);
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
                <Text>Perfil no encontrado. Inténtalo de nuevo.</Text>
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
                <Text style={styles.ratingLabel}>Promedio de Estrellas</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header com Botão Voltar */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.infoCard}>
                    <Text style={styles.name}>{profile.username}</Text>
                    <Text style={styles.email}>{session.user.email}</Text>
                    <Text style={styles.memberSince}>Miembro desde: {formatDate(profile.created_at)}</Text>

                    {/* Botão Editar Perfil */}
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => navigation.navigate('EditProfile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.editProfileIcon}>✏️</Text>
                        <Text style={styles.editProfileText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* --- SEÇÃO DE AVALIAÇÕES --- */}
                <Text style={styles.sectionHeader}>Mis Valoraciones</Text>

                <View style={styles.ratingsContainer}>
                    <View style={styles.ratingSection}>
                        <Text style={styles.roleTitle}>Como Arrendador (Dueño del Artículo)</Text>
                        {renderRating(profile.rating_avg_locador)}
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.roleTitle}>Como Arrendatario (Cliente)</Text>
                        {renderRating(profile.rating_avg_locatario)}
                    </View>
                </View>

                {/* --- SEÇÃO MIS ANUNCIOS --- */}
                <Text style={styles.sectionHeader}>Mis Anuncios</Text>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionIcon}>📦</Text>
                        <Text style={styles.actionText}>Ver Mis Artículos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => navigation.navigate('AddItem')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionIcon}>➕</Text>
                        <Text style={[styles.actionText, styles.actionTextWhite]}>Anunciar Artículo</Text>
                    </TouchableOpacity>
                </View>

                {/* Espaço para um futuro botão de edição ou listagem de itens */}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    backArrow: {
        fontSize: 22,
        color: '#333',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
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
        color: '#333',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
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
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2c4455',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 15,
        gap: 8,
    },
    editProfileIcon: {
        fontSize: 16,
    },
    editProfileText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
        color: '#333',
        textAlign: 'center',
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
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    actionButtonPrimary: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c4455',
        textAlign: 'center',
    },
    actionTextWhite: {
        color: '#fff',
    },
});