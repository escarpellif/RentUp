import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { verificationCardStyles as cardStyles } from '../styles/verificationCardStyles';
import { documentTypeStyles as styles } from '../styles/documentTypeStyles';

export default function DocumentTypeSelector({ documentType, onSelect }) {
    return (
        <View style={cardStyles.card}>
            <Text style={cardStyles.cardTitle}>📄 Tipo de Documento</Text>
            
            <View style={styles.documentTypeContainer}>
                <TouchableOpacity
                    style={[styles.documentTypeOption, documentType === 'dni' && styles.documentTypeActive]}
                    onPress={() => onSelect('dni')}
                >
                    <Text style={[styles.documentTypeText, documentType === 'dni' && styles.documentTypeTextActive]}>
                        DNI / Cédula
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.documentTypeOption, documentType === 'passport' && styles.documentTypeActive]}
                    onPress={() => onSelect('passport')}
                >
                    <Text style={[styles.documentTypeText, documentType === 'passport' && styles.documentTypeTextActive]}>
                        Pasaporte
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.documentTypeOption, documentType === 'driver_license' && styles.documentTypeActive]}
                    onPress={() => onSelect('driver_license')}
                >
                    <Text style={[styles.documentTypeText, documentType === 'driver_license' && styles.documentTypeTextActive]}>
                        Licencia
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

