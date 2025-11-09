import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { continueButtonStyles as styles } from '../styles/continueButtonStyles';

export default function ContinueButton({ onPress }) {
    return (
        <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
                style={styles.continueButton}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButtonGradient}
                >
                    <Text style={styles.continueButtonText}>Entendido, Continuar</Text>
                    <Text style={styles.continueButtonIcon}>→</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}


