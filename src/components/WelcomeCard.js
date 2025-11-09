import React from 'react';
import { View, Text } from 'react-native';
import { welcomeCardStyles as styles } from '../styles/welcomeCardStyles';

export default function WelcomeCard() {
    return (
        <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>¡Un momento! ✋</Text>
            <Text style={styles.welcomeText}>
                Para mantener una comunidad segura y confiable, por favor revisa estas recomendaciones antes de publicar tu artículo.
            </Text>
        </View>
    );
}


