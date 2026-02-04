import React, { useState, useEffect } from 'react';
import {View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { adminSettingsStyles } from '../styles/screens/adminSettingsStyles';

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
        <View style={adminSettingsStyles.section}>
            <Text style={adminSettingsStyles.sectionTitle}>{title}</Text>
            <View style={adminSettingsStyles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const SettingRow = ({ icon, label, description, value, onValueChange, type = 'switch' }) => (
        <View style={adminSettingsStyles.settingRow}>
            <View style={adminSettingsStyles.settingLeft}>
                <View style={adminSettingsStyles.iconContainer}>
                    <Ionicons name={icon} size={20} color="#3B82F6" />
                </View>
                <View style={adminSettingsStyles.settingText}>
                    <Text style={adminSettingsStyles.settingLabel}>{label}</Text>
                    {description && <Text style={adminSettingsStyles.settingDescription}>{description}</Text>}
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
                    style={adminSettingsStyles.input}
                    value={String(value)}
                    onChangeText={onValueChange}
                    keyboardType="numeric"
                    onBlur={() => saveSetting(label, value)}
                />
            )}
        </View>
    );

    return (
        <SafeAreaView style={adminSettingsStyles.container}>
            {/* Header */}
            <View style={adminSettingsStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={adminSettingsStyles.headerTitle}>Configuraciones</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={adminSettingsStyles.content}>
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
                <View style={adminSettingsStyles.saveButtonContainer}>
                    <TouchableOpacity
                        style={adminSettingsStyles.saveButton}
                        onPress={() => Alert.alert('Éxito', 'Todas las configuraciones guardadas')}
                    >
                        <Ionicons name="save" size={20} color="#fff" />
                        <Text style={adminSettingsStyles.saveButtonText}>Guardar Todas las Configuraciones</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}



