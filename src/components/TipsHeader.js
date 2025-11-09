import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tipsHeaderStyles as styles } from '../styles/tipsHeaderStyles';

export default function TipsHeader({ onBack }) {
    return (
        <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
            >
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.headerIcon}>💡</Text>
                <Text style={styles.headerTitle}>Antes de Anunciar</Text>
                <Text style={styles.headerSubtitle}>Consejos importantes para ti</Text>
            </View>
        </LinearGradient>
    );
}


