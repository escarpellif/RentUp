import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { getApproximateLocation, getCoordinatesFromAddress, addRandomOffset } from '../utils/locationHelper';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function AddItemFormScreen({ session, navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [category, setCategory] = useState('Electrónicos');
    const [location, setLocation] = useState(''); // Endereço completo
    const [locationFull, setLocationFull] = useState(''); // Endereço completo detalhado
    const [locationApprox, setLocationApprox] = useState(''); // Localização aproximada para mostrar
    const [coordinates, setCoordinates] = useState(null); // Coordenadas exatas
    const [postalCode, setPostalCode] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [deliveryType, setDeliveryType] = useState('pickup');
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([null, null, null]);
    const [photoPaths, setPhotoPaths] = useState([null, null, null]);

    // Novos estados para dados pessoais
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [useProfileAddress, setUseProfileAddress] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const categories = [
        'Electrónicos',
        'Deportes',
        'Accesorios de Vehículos',
        'Muebles',
        'Herramientas',
        'Fiestas',
        'Jardín',
        'Ropa',
        'Otros'
    ];

    // Carregar perfil do usuário ao montar o componente
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Função para buscar o perfil do usuário
    const fetchUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, phone, address, postal_code, city')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Erro ao buscar perfil:', error);
            } else {
                setUserProfile(data);
                // Preencher campos se já existirem no perfil
                if (data.full_name) setFullName(data.full_name);
                if (data.phone) setPhone(data.phone);
            }
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    // Efeito para usar endereço do perfil quando checkbox for marcado
    useEffect(() => {
        if (useProfileAddress && userProfile) {
            if (userProfile.address && userProfile.postal_code && userProfile.city) {
                setLocation(userProfile.address);
                setLocationFull(userProfile.address);
                setLocationApprox(`${userProfile.city} - ${userProfile.postal_code}`);
                setPostalCode(userProfile.postal_code);

                // Buscar coordenadas do endereço
                const fullAddress = `${userProfile.address}, ${userProfile.city}, ${userProfile.postal_code}, España`;
                getCoordinatesFromAddress(fullAddress).then(coords => {
                    if (coords) {
                        setCoordinates(coords);
                    }
                });
            } else {
                Alert.alert(
                    'Endereço Incompleto',
                    'Seu perfil não possui endereço completo cadastrado. Por favor, preencha manualmente.',
                    [{ text: 'OK', onPress: () => setUseProfileAddress(false) }]
                );
            }
        } else if (!useProfileAddress) {
            // Limpar campos de endereço quando desmarcar
            setLocation('');
            setLocationFull('');
            setLocationApprox('');
            setCoordinates(null);
            setPostalCode('');
        }
    }, [useProfileAddress]);


    // Função para buscar endereços por código postal
    const searchAddressByPostalCode = async (code) => {
        if (code.length < 4) {
            setAddressSuggestions([]);
            return;
        }

        setLoadingAddress(true);
        try {
            // Usando Nominatim API (OpenStreetMap) para buscar endereços na Espanha
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?postalcode=${code}&country=Spain&format=json&addressdetails=1&limit=5`,
                {
                    headers: {
                        'User-Agent': 'RentUpApp/1.0'
                    }
                }
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const suggestions = data.map(item => {
                    const address = item.address;
                    const street = address.road || address.pedestrian || address.suburb || '';
                    const city = address.city || address.town || address.village || address.municipality || '';
                    const postalCode = address.postcode || code;

                    return {
                        display: `${street}${street && city ? ', ' : ''}${city}${postalCode ? ' - ' + postalCode : ''}`,
                        full: item.display_name,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                        city: city,
                        postalCode: postalCode
                    };
                });
                setAddressSuggestions(suggestions);
            } else {
                setAddressSuggestions([]);
            }
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
            setAddressSuggestions([]);
        }
        setLoadingAddress(false);
    };

    const pickImage = async (index) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const newPhotos = [...photos];
            newPhotos[index] = result.assets[0].uri;
            setPhotos(newPhotos);
        }
    };

    const removePhoto = (index) => {
        const newPhotos = [...photos];
        newPhotos[index] = null;
        setPhotos(newPhotos);
    };

    const uploadImage = async (uri) => {
        const user = session.user;
        if (!user) {
            Alert.alert('Error de Sesión', 'El usuario no está conectado.');
            return null;
        }

        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const filePath = `${user.id}/${Date.now()}.jpg`;
            
            const { data, error } = await supabase.storage
                .from('item_photos')
                .upload(filePath, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (error) {
                Alert.alert('Error en la Carga', 'Error al subir la imagen: ' + error.message);
                return null;
            }

            return data.path;
        } catch (err) {
            Alert.alert('Error', 'Error inesperado durante la carga: ' + err.message);
            return null;
        }
    };

    async function handleSubmit() {
        const hasAtLeastOnePhoto = photos.some(photo => photo !== null);
        
        // Validação completa de todos os campos obrigatórios
        if (!title || !description || !pricePerDay || !hasAtLeastOnePhoto) {
            Alert.alert('Campos Incompletos', 'Por favor, preencha título, descrição, preço e adicione pelo menos uma foto.');
            return;
        }

        if (!fullName || fullName.trim() === '') {
            Alert.alert('Nome Completo Obrigatório', 'Por favor, preencha seu nome completo.');
            return;
        }

        if (!phone || phone.trim() === '') {
            Alert.alert('Telefone Obrigatório', 'Por favor, preencha seu telefone de contato.');
            return;
        }

        if (!location || !locationFull || !coordinates) {
            Alert.alert('Endereço Obrigatório', 'Por favor, selecione o endereço completo de retirada do item.');
            return;
        }

        setLoading(true);

        // Atualizar perfil do usuário com nome completo, telefone e endereço
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone,
                address: location,
                postal_code: postalCode || locationApprox.split(' - ')[1],
                city: locationApprox.split(' - ')[0],
                updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);

        if (profileError) {
            console.error('Erro ao atualizar perfil:', profileError);
            Alert.alert('Aviso', 'Houve um problema ao salvar seus dados pessoais, mas continuaremos com o anúncio.');
        }

        const uploadedPaths = [];

        for (let i = 0; i < photos.length; i++) {
            if (photos[i]) {
                const uploadedPath = await uploadImage(photos[i]);
                if (uploadedPath) {
                    uploadedPaths.push(uploadedPath);
                }
            }
        }

        if (uploadedPaths.length === 0) {
            Alert.alert('Error', 'No se pudo subir ninguna foto');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('items')
            .insert({
                owner_id: session.user.id,
                title,
                description,
                price_per_day: parseFloat(pricePerDay),
                category,
                location,
                location_full: locationFull,
                location_approx: locationApprox,
                coordinates: coordinates,
                coordinates_approx: coordinates ? addRandomOffset(coordinates) : null,
                photo_url: uploadedPaths[0],
                photos: uploadedPaths,
                delivery_type: deliveryType,
            });

        setLoading(false);

        if (error) {
            Alert.alert('Error al Anunciar', error.message);
        } else {
            Alert.alert(
                '¡Éxito!',
                '¡Tu artículo ha sido anunciado en el marketplace!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Home')
                    }
                ]
            );
            // Limpar os campos após o sucesso
            setTitle('');
            setDescription('');
            setPricePerDay('');
            setLocation('');
            setLocationFull('');
            setLocationApprox('');
            setCoordinates(null);
            setPhotos([null, null, null]);
            setPhotoPaths([null, null, null]);
        }
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header Moderno */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Anunciar Artículo</Text>
                    <Text style={styles.headerSubtitle}>Comparte lo que no usas</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Card: Información Básica */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📝 Información Básica</Text>

                    <Text style={styles.label}>Título del Anuncio</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setTitle}
                        value={title}
                        placeholder="Ej: Taladro Bosch 18V"
                        placeholderTextColor="#999"
                        maxLength={80}
                    />

                    <Text style={styles.label}>Descripción Completa</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        onChangeText={setDescription}
                        value={description}
                        placeholder="Describe el estado, accesorios incluidos y condiciones de alquiler..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={styles.label}>Categoría</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={category}
                            onValueChange={(itemValue) => setCategory(itemValue)}
                        >
                            {categories.map((cat, index) => (
                                <Picker.Item key={index} label={cat} value={cat} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Card: Datos Personales */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👤 Datos de Contacto</Text>
                    <Text style={styles.cardSubtitle}>Información necesaria para el alquiler</Text>

                    <Text style={styles.label}>Nombre Completo *</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setFullName}
                        value={fullName}
                        placeholder="Ej: Juan Pérez García"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Teléfono de Contacto *</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setPhone}
                        value={phone}
                        placeholder="Ej: +34 600 123 456"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Card: Precio y Ubicación */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💰 Precio y Ubicación</Text>

                    <Text style={styles.label}>Precio por Día</Text>
                    <View style={styles.priceInputContainer}>
                        <Text style={styles.currencySymbol}>€</Text>
                        <TextInput
                            style={styles.priceInput}
                            onChangeText={setPricePerDay}
                            value={pricePerDay}
                            placeholder="0.00"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                        <Text style={styles.perDay}>/día</Text>
                    </View>

                    <Text style={styles.label}>Ubicación de Recogida *</Text>

                    {/* Checkbox para usar endereço de cadastro */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setUseProfileAddress(!useProfileAddress)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, useProfileAddress && styles.checkboxChecked]}>
                            {useProfileAddress && <Text style={styles.checkboxIcon}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Usar mi dirección de cadastro</Text>
                    </TouchableOpacity>

                    {!useProfileAddress && (
                        <>
                            <Text style={styles.sublabel}>Introduce el código postal para buscar la dirección</Text>

                            <TextInput
                                style={styles.input}
                                onChangeText={(text) => {
                                    setPostalCode(text);
                                    searchAddressByPostalCode(text);
                                }}
                                value={postalCode}
                                placeholder="Ej: 28001"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            {loadingAddress && (
                                <View style={styles.loadingAddressContainer}>
                                    <ActivityIndicator size="small" color="#2c4455" />
                                    <Text style={styles.loadingAddressText}>Buscando direcciones...</Text>
                                </View>
                            )}

                            {addressSuggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <Text style={styles.suggestionsTitle}>Selecciona una dirección:</Text>
                                    {addressSuggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionItem}
                                            onPress={() => {
                                                setLocation(suggestion.display);
                                                setLocationFull(suggestion.full);
                                                setLocationApprox(`${suggestion.city} - ${suggestion.postalCode}`);
                                                setCoordinates({
                                                    latitude: suggestion.lat,
                                                    longitude: suggestion.lon
                                                });
                                                setAddressSuggestions([]);
                                                setPostalCode('');
                                            }}
                                        >
                                            <Text style={styles.suggestionIcon}>📍</Text>
                                            <Text style={styles.suggestionText}>{suggestion.display}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {location !== '' && (
                        <View style={styles.selectedLocationContainer}>
                            <Text style={styles.selectedLocationLabel}>Dirección seleccionada:</Text>
                            <View style={styles.selectedLocationBox}>
                                <Text style={styles.selectedLocationIcon}>📍</Text>
                                <Text style={styles.selectedLocationText}>{location}</Text>
                                {!useProfileAddress && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setLocation('');
                                            setLocationFull('');
                                            setLocationApprox('');
                                            setCoordinates(null);
                                        }}
                                        style={styles.clearLocationButton}
                                    >
                                        <Text style={styles.clearLocationText}>✕</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* Card: Tipo de Entrega */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🚚 Tipo de Entrega</Text>
                    <View style={styles.deliveryTypeContainer}>
                        <TouchableOpacity
                            style={[styles.deliveryOption, deliveryType === 'pickup' && styles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('pickup')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.deliveryOptionIcon}>📍</Text>
                            <Text style={[styles.deliveryOptionText, deliveryType === 'pickup' && styles.deliveryOptionTextActive]}>
                                Retira en Lugar
                            </Text>
                            {deliveryType === 'pickup' && (
                                <View style={styles.deliveryCheckmark}>
                                    <Text style={styles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deliveryOption, deliveryType === 'delivery' && styles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('delivery')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.deliveryOptionIcon}>🚚</Text>
                            <Text style={[styles.deliveryOptionText, deliveryType === 'delivery' && styles.deliveryOptionTextActive]}>
                                Entrego en Casa
                            </Text>
                            {deliveryType === 'delivery' && (
                                <View style={styles.deliveryCheckmark}>
                                    <Text style={styles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deliveryOption, deliveryType === 'both' && styles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('both')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.deliveryOptionIcon}>🔄</Text>
                            <Text style={[styles.deliveryOptionText, deliveryType === 'both' && styles.deliveryOptionTextActive]}>
                                Ambas Opciones
                            </Text>
                            {deliveryType === 'both' && (
                                <View style={styles.deliveryCheckmark}>
                                    <Text style={styles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Card: Fotos */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📸 Fotos del Artículo</Text>
                    <Text style={styles.cardSubtitle}>Sube hasta 3 fotos - La primera será la principal</Text>

                    <View style={styles.photosGrid}>
                        {photos.map((photo, index) => (
                            <View key={index} style={styles.photoContainer}>
                                <TouchableOpacity
                                    onPress={() => pickImage(index)}
                                    style={[styles.photoPlaceholder, index === 0 && styles.photoPlaceholderPrimary]}
                                >
                                    {photo ? (
                                        <>
                                            <Image source={{ uri: photo }} style={styles.previewImage} />
                                            <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(index)}>
                                                <Text style={styles.removePhotoText}>✕</Text>
                                            </TouchableOpacity>
                                            {index === 0 && (
                                                <View style={styles.primaryBadge}>
                                                    <Text style={styles.primaryBadgeText}>Principal</Text>
                                                </View>
                                            )}
                                        </>
                                    ) : (
                                        <View style={styles.addPhotoContent}>
                                            <Text style={styles.addPhotoIcon}>📷</Text>
                                            <Text style={styles.addPhotoText}>
                                                {index === 0 ? 'Foto Principal' : `Foto ${index + 1}`}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Botão Publicar */}
                <TouchableOpacity
                    style={[styles.publishButton, loading && styles.publishButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.publishButtonGradient}
                    >
                        {loading ? (
                            <View style={styles.publishButtonContent}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.publishButtonText}>Procesando...</Text>
                            </View>
                        ) : (
                            <View style={styles.publishButtonContent}>
                                <Text style={styles.publishButtonIcon}>🚀</Text>
                                <Text style={styles.publishButtonText}>Anunciar Artículo</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{height: 30}} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    headerSpacer: {
        width: 40,
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
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
        marginBottom: 8,
    },
    sublabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        fontStyle: 'italic',
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
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        overflow: 'hidden',
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#333',
    },
    perDay: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
        paddingVertical: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#2c4455',
        backgroundColor: '#fff',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#2c4455',
    },
    checkboxIcon: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    deliveryTypeContainer: {
        marginTop: 12,
        gap: 10,
    },
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E8E8',
    },
    deliveryOptionActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2c4455',
    },
    deliveryOptionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    deliveryOptionText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
        flex: 1,
    },
    deliveryOptionTextActive: {
        color: '#2c4455',
        fontWeight: '700',
    },
    deliveryCheckmark: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#2c4455',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliveryCheckmarkText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 10,
    },
    photoContainer: {
        width: '31%',
        aspectRatio: 1,
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        overflow: 'hidden',
    },
    photoPlaceholderPrimary: {
        borderColor: '#2c4455',
        borderStyle: 'solid',
        borderWidth: 2,
    },
    addPhotoContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPhotoIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    addPhotoText: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        fontWeight: '600',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    removePhotoButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removePhotoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    primaryBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(44, 68, 85, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    primaryBadgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    publishButton: {
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    publishButtonDisabled: {
        opacity: 0.7,
    },
    publishButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    publishButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    publishButtonIcon: {
        fontSize: 24,
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loadingAddressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginTop: 8,
        gap: 10,
    },
    loadingAddressText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        marginTop: 12,
        padding: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c4455',
        marginBottom: 10,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    suggestionIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    selectedLocationContainer: {
        marginTop: 12,
    },
    selectedLocationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c4455',
        marginBottom: 8,
    },
    selectedLocationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    selectedLocationIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    selectedLocationText: {
        fontSize: 15,
        color: '#2c4455',
        fontWeight: '500',
        flex: 1,
    },
    clearLocationButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#dc3545',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearLocationText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

