import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

export default function AdminSettingsScreen({ navigation }) {
    const [settings, setSettings] = useState({
        // Plataforma
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: true,

        // Financeiro
        platformFeePercentage: 18,
        minimumRentalPrice: 5,
        depositPercentage: 100,

        // Limites
        maxPhotosPerItem: 5,
        maxItemsPerUser: 50,
        maxActiveRentalsPerUser: 10,

        // Notificações
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,

        // Segurança
        autoBlockAfterDisputes: 3,
        verificationRequired: false,
    });

    const [loading, setLoading] = useState(false);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSetting = async (key, value) => {
        try {
            setLoading(true);
            // Aqui você salvaria no Supabase
            // Por enquanto, apenas atualiza localmente
            updateSetting(key, value);
            Alert.alert('Éxito', 'Configuración actualizada');
        } catch (error) {
            console.error('Error saving setting:', error);
            Alert.alert('Error', 'No se pudo guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const SettingSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const SettingRow = ({ icon, label, description, value, onValueChange, type = 'switch' }) => (
        <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>{label}</Text>
                    {description && <Text style={styles.settingDescription}>{description}</Text>}
                </View>
            </View>

            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={value ? '#3B82F6' : '#F3F4F6'}
                />
            ) : (
                <TextInput
                    style={styles.input}
                    value={String(value)}
                    onChangeText={onValueChange}
                    keyboardType="numeric"
                    onBlur={() => saveSetting(label, value)}
                />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuraciones</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Plataforma */}
                <SettingSection title="⚙️ Plataforma">
                    <SettingRow
                        icon="construct"
                        label="Modo Mantenimiento"
                        description="Desactiva el acceso de usuarios (solo admin)"
                        value={settings.maintenanceMode}
                        onValueChange={(val) => saveSetting('maintenanceMode', val)}
                    />
                    <SettingRow
                        icon="person-add"
                        label="Permitir Nuevos Registros"
                        description="Permite que nuevos usuarios se registren"
                        value={settings.allowNewRegistrations}
                        onValueChange={(val) => saveSetting('allowNewRegistrations', val)}
                    />
                    <SettingRow
                        icon="mail"
                        label="Verificación de Email Obligatoria"
                        description="Los usuarios deben verificar el email"
                        value={settings.requireEmailVerification}
                        onValueChange={(val) => saveSetting('requireEmailVerification', val)}
                    />
                </SettingSection>

                {/* Financiero */}
                <SettingSection title="💰 Financiero">
                    <SettingRow
                        icon="cash"
                        label="Tasa de Plataforma (%)"
                        description={`Actualmente: ${settings.platformFeePercentage}%`}
                        value={settings.platformFeePercentage}
                        onValueChange={(val) => updateSetting('platformFeePercentage', parseInt(val) || 0)}
                        type="input"
                    />
                    <SettingRow
                        icon="pricetag"
                        label="Precio Mínimo de Alquiler (€)"
                        description={`Mínimo: €${settings.minimumRentalPrice}`}
                        value={settings.minimumRentalPrice}
                        onValueChange={(val) => updateSetting('minimumRentalPrice', parseInt(val) || 0)}
                        type="input"
                    />
                    <SettingRow
                        icon="shield"
                        label="Depósito (%)"
                        description={`% del valor del artículo: ${settings.depositPercentage}%`}
                        value={settings.depositPercentage}
                        onValueChange={(val) => updateSetting('depositPercentage', parseInt(val) || 0)}
                        type="input"
                    />
                </SettingSection>

                {/* Limites */}
                <SettingSection title="📊 Límites y Restricciones">
                    <SettingRow
                        icon="image"
                        label="Máx. Fotos por Artículo"
                        description={`Límite actual: ${settings.maxPhotosPerItem}`}
                        value={settings.maxPhotosPerItem}
                        onValueChange={(val) => updateSetting('maxPhotosPerItem', parseInt(val) || 0)}
                        type="input"
                    />
                    <SettingRow
                        icon="cube"
                        label="Máx. Artículos por Usuario"
                        description={`Límite: ${settings.maxItemsPerUser}`}
                        value={settings.maxItemsPerUser}
                        onValueChange={(val) => updateSetting('maxItemsPerUser', parseInt(val) || 0)}
                        type="input"
                    />
                    <SettingRow
                        icon="repeat"
                        label="Máx. Locaciones Activas"
                        description={`Por usuario: ${settings.maxActiveRentalsPerUser}`}
                        value={settings.maxActiveRentalsPerUser}
                        onValueChange={(val) => updateSetting('maxActiveRentalsPerUser', parseInt(val) || 0)}
                        type="input"
                    />
                </SettingSection>

                {/* Notificaciones */}
                <SettingSection title="🔔 Notificaciones">
                    <SettingRow
                        icon="mail-outline"
                        label="Notificaciones por Email"
                        description="Enviar emails a los usuarios"
                        value={settings.emailNotificationsEnabled}
                        onValueChange={(val) => saveSetting('emailNotificationsEnabled', val)}
                    />
                    <SettingRow
                        icon="notifications"
                        label="Notificaciones Push"
                        description="Enviar notificaciones push"
                        value={settings.pushNotificationsEnabled}
                        onValueChange={(val) => saveSetting('pushNotificationsEnabled', val)}
                    />
                </SettingSection>

                {/* Seguridad */}
                <SettingSection title="🔒 Seguridad y Moderación">
                    <SettingRow
                        icon="ban"
                        label="Bloqueo Automático"
                        description={`Tras ${settings.autoBlockAfterDisputes} disputas`}
                        value={settings.autoBlockAfterDisputes}
                        onValueChange={(val) => updateSetting('autoBlockAfterDisputes', parseInt(val) || 0)}
                        type="input"
                    />
                    <SettingRow
                        icon="checkmark-circle"
                        label="Verificación Obligatoria"
                        description="Requiere verificación para publicar"
                        value={settings.verificationRequired}
                        onValueChange={(val) => saveSetting('verificationRequired', val)}
                    />
                </SettingSection>

                {/* Botão de Salvar Tudo */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => Alert.alert('Éxito', 'Todas las configuraciones guardadas')}
                    >
                        <Ionicons name="save" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Guardar Todas las Configuraciones</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    input: {
        width: 80,
        height: 40,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#1F2937',
        textAlign: 'center',
    },
    saveButtonContainer: {
        padding: 16,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

