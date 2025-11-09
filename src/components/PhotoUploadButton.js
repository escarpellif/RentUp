import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { verificationCardStyles as cardStyles } from '../styles/verificationCardStyles';
import { uploadPhotoStyles as styles } from '../styles/uploadPhotoStyles';

export default function PhotoUploadButton({ title, subtitle, icon, hasPhoto, onPress }) {
    return (
        <View style={cardStyles.card}>
            <Text style={cardStyles.cardTitle}>{title}</Text>
            <Text style={cardStyles.cardSubtitle}>{subtitle}</Text>
            
            <TouchableOpacity
                style={styles.uploadButton}
                onPress={onPress}
            >
                <Text style={styles.uploadIcon}>
                    {hasPhoto ? '✅' : icon}
                </Text>
                <Text style={styles.uploadText}>
                    {hasPhoto ? 'Foto cargada' : subtitle}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

