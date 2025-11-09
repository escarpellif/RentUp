import React from 'react';
import { View, Text } from 'react-native';
import { recommendationCardStyles as styles } from '../styles/recommendationCardStyles';

export default function RecommendationCard() {
    return (
        <View style={styles.recommendationCard}>
            <Text style={styles.recommendationIcon}>✅</Text>
            <Text style={styles.recommendationTitle}>¿Qué SÍ puedes anunciar?</Text>
            <Text style={styles.recommendationText}>
                • Herramientas y equipos en buen estado{'\n'}
                • Artículos electrónicos funcionales{'\n'}
                • Equipamiento deportivo{'\n'}
                • Muebles y decoración{'\n'}
                • Vehículos con documentación{'\n'}
                • Cualquier cosa que esté bien cuidada y sea segura
            </Text>
        </View>
    );
}


