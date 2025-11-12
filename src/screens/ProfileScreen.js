import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { Rating } from 'react-native-ratings';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { profileScreenStyles as styles } from '../styles/screens/profileScreenStyles';

export default function ProfileScreen({ session, navigation }) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = session.user.id;

    useEffect(() => {
        fetchProfile();
    }, []);

    // Função para buscar o perfil na tabela 'profiles'
    async function fetchProfile() {
        setLoading(true);
        // Busca o perfil que corresponde ao ID do usuário logado
        const { data, error } = await supabase
            .from('profiles')
            .select('username, full_name, created_at, rating_avg_locador, rating_avg_locatario, is_admin')
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
                <Text style={styles.ratingLabel}>{t('profile.stars')}</Text>
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
                    <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.infoCard}>
                    <Text style={styles.name}>{profile.username}</Text>
                    <Text style={styles.email}>{session.user.email}</Text>
                    <Text style={styles.memberSince}>{t('profile.memberSince')} {formatDate(profile.created_at)}</Text>

                    {/* Botão Editar Perfil */}
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => navigation.navigate('EditProfile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.editProfileIcon}>✏️</Text>
                        <Text style={styles.editProfileText}>{t('profile.editProfile')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Seletor de Idioma */}
                <View style={styles.languageSwitcherSection}>
                    <Text style={styles.sectionHeader}>{t('settings.language')}</Text>
                    <View style={styles.languageSwitcherContainer}>
                        <LanguageSwitcher />
                    </View>
                </View>

                {/* --- SEÇÃO DE AVALIAÇÕES --- */}
                <Text style={styles.sectionHeader}>{t('profile.myRatings')}</Text>

                <View style={styles.ratingsContainer}>
                    <View style={styles.ratingSection}>
                        <Text style={styles.roleTitle}>{t('profile.asOwner')}</Text>
                        {renderRating(profile.rating_avg_locador)}
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.roleTitle}>{t('profile.asRenter')}</Text>
                        {renderRating(profile.rating_avg_locatario)}
                    </View>
                </View>


            </ScrollView>
        </SafeAreaView>
    );
}

