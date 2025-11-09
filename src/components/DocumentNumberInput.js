import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { verificationCardStyles as cardStyles } from '../styles/verificationCardStyles';
import { uploadPhotoStyles as styles } from '../styles/uploadPhotoStyles';

export default function DocumentNumberInput({ value, onChangeText }) {
    return (
        <View style={cardStyles.card}>
            <Text style={cardStyles.cardTitle}>🔢 Número de Documento</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: 12345678A"
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                maxLength={20}
            />
        </View>
    );
}

