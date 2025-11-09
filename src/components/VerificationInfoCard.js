import React from 'react';
import { View, Text } from 'react-native';
import { verificationCardStyles as styles } from '../styles/verificationCardStyles';

export default function VerificationInfoCard() {
    return (
        <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoTitle}>¿Por qué verificamos tu identidad?</Text>
            <Text style={styles.infoText}>
                Para mantener una comunidad segura y confiable, necesitamos verificar tu identidad antes de que puedas anunciar o alquilar artículos.
            </Text>
        </View>
    );
}

