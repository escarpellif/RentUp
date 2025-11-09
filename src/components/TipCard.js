import React from 'react';
import { View, Text } from 'react-native';
import { tipCardStyles as styles } from '../styles/tipCardStyles';

export default function TipCard({ tip }) {
    return (
        <View style={[styles.tipCard, { borderLeftColor: tip.color }]}>
            <View style={[styles.iconContainer, { backgroundColor: tip.color + '20' }]}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
            </View>
            <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
            </View>
        </View>
    );
}


