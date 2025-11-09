import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { documentVerificationStyles as styles } from '../styles/documentVerificationStyles';

export default function SubmitVerificationButton({ loading, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#28a745', '#20c997']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
            >
                {loading ? (
                    <View style={styles.buttonContent}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.buttonText}>Enviando...</Text>
                    </View>
                ) : (
                    <View style={styles.buttonContent}>
                        <Text style={styles.buttonIcon}>🚀</Text>
                        <Text style={styles.buttonText}>Enviar Verificación</Text>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

