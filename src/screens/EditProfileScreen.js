import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2c4455" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Editar Perfil</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Card: Información Personal */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👤 Información Personal</Text>

                    <Text style={styles.label}>Nombre de Usuario *</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setUsername}
                        value={username}
                        placeholder="Ej: juanperez"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Nombre Completo *</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setFullName}
                        value={fullName}
                        placeholder="Ej: Juan Pérez García"
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                    />
                </View>

                {/* Card: Datos de Contacto */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📞 Datos de Contacto</Text>

                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setPhone}
                        value={phone}
                        placeholder="Ej: +34 600 123 456"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Card: Dirección */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📍 Dirección</Text>
                    <Text style={styles.cardSubtitle}>
                        Esta dirección se usará por defecto al anunciar artículos
                    </Text>

                    <Text style={styles.label}>Dirección Completa</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setAddress}
                        value={address}
                        placeholder="Ej: Calle Mayor, 1, 2ºA"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Código Postal</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setPostalCode}
                        value={postalCode}
                        placeholder="Ej: 28001"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Ciudad</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setCity}
                        value={city}
                        placeholder="Ej: Madrid"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    backArrow: {
        fontSize: 22,
        color: '#333',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c4455',
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        backgroundColor: '#F8F9FA',
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonDisabled: {
        backgroundColor: '#95a5a6',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

