import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { verificationHeaderStyles as styles } from '../styles/verificationHeaderStyles';

export default function VerificationHeader({ onBack }) {
    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
            >
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Verificación de Identidad</Text>
            </View>
            <View style={styles.headerSpacer} />
        </View>
    );
}

