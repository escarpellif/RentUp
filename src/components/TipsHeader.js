import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tipsHeaderStyles as styles } from '../styles/tipsHeaderStyles';

export default function TipsHeader({ onBack }) {
    return (
        <View style={styles.headerGradient}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
            >
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.headerIcon}>💡</Text>
                <Text style={styles.headerTitle}>  Antes de Anunciar</Text>
                <Text style={styles.headerSubtitle}>Consejos importantes para ti</Text>
            </View>
        </View>
    );
}


