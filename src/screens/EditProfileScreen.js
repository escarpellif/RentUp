import React, { useState, useEffect } from 'react';
import {
    View,
    Text, 
    TextInput, 
    ScrollView, 
    Alert, 
    TouchableOpacity, 
    ActivityIndicator,
    Platform,
    StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { handleApiError } from '../utils/errorHandler';
import { withTimeout } from '../utils/apiHelpers';
import Logger from '../services/LoggerService';
import { editProfileStyles } from '../styles/screens/editProfileStyles';

export default function EditProfileScreen({ navigation, session }) {
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    
    // Estados dos campos
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    // Buscar dados atuais do perfil
    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, full_name, phone, address, postal_code, city')
                .eq('id', session.user.id)
                .single();

            if (error) {
                Logger.error('Erro ao carregar perfil', { screen: 'EditProfile' }, error);
                Alert.alert(
                    '⚠️ Error al Cargar',
                    'No pudimos cargar tu perfil. Por favor, verifica tu conexión e intenta nuevamente.',
                    [
                        { text: 'Cancelar', onPress: () => navigation.goBack(), style: 'cancel' },
                        { text: 'Reintentar', onPress: () => fetchProfile() }
                    ]
                );
            } else if (data) {
                setUsername(data.username || '');
                setFullName(data.full_name || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setPostalCode(data.postal_code || '');
                setCity(data.city || '');
            }
        } catch (error) {
            Logger.error('Erro inesperado ao buscar perfil', { screen: 'EditProfile' }, error);
        } finally {
            setLoadingProfile(false);
        }
    };

    // Salvar alterações
    const handleSave = async () => {
        if (!username || username.trim() === '') {
            Alert.alert('Nombre de Usuario Obligatorio', 'Por favor, ingresa un nombre de usuario');
            return;
        }

        if (!fullName || fullName.trim() === '') {
            Alert.alert('Nombre Completo Obligatorio', 'Por favor, ingresa tu nombre completo');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: username.trim(),
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    postal_code: postalCode.trim(),
                    city: city.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);

            if (error) {
                Logger.error('Erro ao atualizar perfil', { screen: 'EditProfile' }, error);
                Alert.alert(
                    '👤 Error al Guardar',
                    'No se pudieron guardar los cambios en tu perfil. Tus datos anteriores están seguros.\n\n¿Deseas intentar nuevamente?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Guardar Nuevamente', onPress: () => handleSave() }
                    ]
                );
            } else {
                Alert.alert(
                    '¡Éxito!', 
                    'Tu perfil ha sido actualizado',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            Logger.error('Erro inesperado ao salvar perfil', { screen: 'EditProfile' }, error);
            handleApiError(error, () => handleSave());
        } finally {
            setLoading(false);
        }
    };

    if (loadingProfile) {
        return (
            <View style={editProfileStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#2c4455" />
                <Text style={editProfileStyles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={editProfileStyles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={editProfileStyles.headerContainer}>
                <TouchableOpacity
                    style={editProfileStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={editProfileStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={editProfileStyles.headerTitleContainer}>
                    <Text style={editProfileStyles.headerTitle}>Editar Perfil</Text>
                </View>
                <View style={editProfileStyles.headerSpacer} />
            </View>

            <ScrollView style={editProfileStyles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Card: Información Personal */}
                <View style={editProfileStyles.card}>
                    <Text style={editProfileStyles.cardTitle}>👤 Información Personal</Text>

                    <Text style={editProfileStyles.label}>Nombre de Usuario *</Text>
                    <TextInput
                        style={editProfileStyles.input}
                        onChangeText={setUsername}
                        value={username}
                        placeholder="Ej: juanperez"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                    />

                    <Text style={editProfileStyles.label}>Nombre Completo *</Text>
                    <TextInput
                        style={editProfileStyles.input}
                        onChangeText={setFullName}
                        value={fullName}
                        placeholder="Ej: Juan Pérez García"
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                    />
                </View>

                {/* Card: Datos de Contacto */}
                <View style={editProfileStyles.card}>
                    <Text style={editProfileStyles.cardTitle}>📞 Datos de Contacto</Text>

                    <Text style={editProfileStyles.label}>Teléfono</Text>
                    <TextInput
                        style={editProfileStyles.input}
                        onChangeText={setPhone}
                        value={phone}
                        placeholder="Ej: +34 600 123 456"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Card: Dirección */}
                <View style={editProfileStyles.card}>
                    <Text style={editProfileStyles.cardTitle}>📍 Dirección</Text>
                    <Text style={editProfileStyles.cardSubtitle}>
                        Esta dirección se usará por defecto al anunciar artículos
                    </Text>

                    <Text style={editProfileStyles.label}>Dirección Completa</Text>
                    <TextInput
                        style={editProfileStyles.input}
                        onChangeText={setAddress}
                        value={address}
                        placeholder="Ej: Calle Mayor, 1, 2ºA"
                        placeholderTextColor="#999"
                    />

                    <Text style={editProfileStyles.label}>Código Postal</Text>
                    <TextInput
                        style={editProfileStyles.input}
                        onChangeText={setPostalCode}
                        value={postalCode}
                        placeholder="Ej: 28001"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={editProfileStyles.label}>Ciudad</Text>
                    <TextInput
                        style={editProfileStyles.input}
                        onChangeText={setCity}
                        value={city}
                        placeholder="Ej: Madrid"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity
                    style={[editProfileStyles.saveButton, loading && editProfileStyles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={editProfileStyles.saveButtonText}>Guardar Cambios</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}



