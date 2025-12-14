import React from 'react';
import { View, Text, ScrollView , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import TipsHeader from '../components/TipsHeader';
import WelcomeCard from '../components/WelcomeCard';
import TipCard from '../components/TipCard';
import RecommendationCard from '../components/RecommendationCard';
import ContinueButton from '../components/ContinueButton';

// Constants
import { TIPS_DATA } from '../constants/tipsData';

// Styles
import { tipsScreenStyles as styles } from '../styles/tipsScreenStyles';

// Utils
import { checkUserVerification, handleVerificationAlert } from '../utils/verificationHelper';
import { requiereAutenticacion } from '../utils/guestCheck';

export default function TipsBeforeAddingScreen({ navigation, session, isGuest }) {
    const handleContinue = async () => {
        // Check if user is guest
        if (!requiereAutenticacion(isGuest, 'Por favor, inicia sesión para anunciar un artículo')) {
            return;
        }

        // Verificar se o usuário tem verificação aprovada
        const { isVerified, status } = await checkUserVerification(session.user.id);

        if (!isVerified) {
            handleVerificationAlert(status, navigation);
            return;
        }

        // Se verificado, continuar para o formulário
        navigation.navigate('AddItemForm');
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            <TipsHeader onBack={handleGoBack} />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <WelcomeCard />

                <View style={styles.tipsContainer}>
                    <Text style={styles.sectionTitle}>❌ Evita Anunciar:</Text>
                    {TIPS_DATA.map((tip, index) => (
                        <TipCard key={index} tip={tip} />
                    ))}
                </View>

                <RecommendationCard />

                <View style={styles.spacer} />
            </ScrollView>

            <ContinueButton onPress={handleContinue} />
        </SafeAreaView>
    );
}



