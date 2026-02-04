import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { getApproximateLocation, getCoordinatesFromAddress, addRandomOffset } from '../utils/locationHelper';
import CategorySubcategoryPicker from '../components/CategorySubcategoryPicker';
import { addItemFormStyles } from '../styles/screens/addItemFormStyles';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function AddItemFormScreen({ session, navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [category, setCategory] = useState('Electrónicos');
    const [subcategory, setSubcategory] = useState('');
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
    const [depositValue, setDepositValue] = useState('');

    // Novos estados para desconto
    const [discountWeek, setDiscountWeek] = useState('');
    const [discountMonth, setDiscountMonth] = useState('');

    // Estados para endereço completo
    const [street, setStreet] = useState('');
    const [complement, setComplement] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('España');

    // Estados para disponibilidade de horários
    const [flexibleHours, setFlexibleHours] = useState(true);
    const [pickupDays, setPickupDays] = useState({
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
    });
    const [pickupTimeStart, setPickupTimeStart] = useState('08:00');
    const [pickupTimeEnd, setPickupTimeEnd] = useState('20:00');

    // Estados para horários manhã/tarde/noite
    const [pickupMorning, setPickupMorning] = useState(false);
    const [pickupMorningStart, setPickupMorningStart] = useState('07:00');
    const [pickupMorningEnd, setPickupMorningEnd] = useState('12:00');
    const [pickupAfternoon, setPickupAfternoon] = useState(false);
    const [pickupAfternoonStart, setPickupAfternoonStart] = useState('12:00');
    const [pickupAfternoonEnd, setPickupAfternoonEnd] = useState('18:00');
    const [pickupEvening, setPickupEvening] = useState(false);
    const [pickupEveningStart, setPickupEveningStart] = useState('18:00');
    const [pickupEveningEnd, setPickupEveningEnd] = useState('23:00');

    // Estados para entrega
    const [deliveryDistance, setDeliveryDistance] = useState('');
    const [isFreeDelivery, setIsFreeDelivery] = useState(true);
    const [deliveryFee, setDeliveryFee] = useState('');

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

    // Função para formatar valor em Euro (adicionar vírgula e pontos automaticamente)
    const formatEuroValue = (value) => {
        // Remove tudo que não é número
        const onlyNumbers = value.replace(/\D/g, '');

        if (onlyNumbers === '') return '';

        // Converte para número e divide por 100 para adicionar os centavos
        const numberValue = parseInt(onlyNumbers, 10) / 100;

        // Formata como moeda europeia (vírgula para centavos, ponto para milhares)
        return numberValue.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Função para converter valor formatado de volta para número
    const parseEuroValue = (formattedValue) => {
        if (!formattedValue) return 0;
        // Remove pontos de milhar e substitui vírgula por ponto
        return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
    };

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
                // Preencher campos separados
                setStreet(userProfile.address || '');
                setCity(userProfile.city || '');
                setCountry('España');
                setComplement('');
                setPostalCode(userProfile.postal_code || '');

                // Criar endereço completo formatado
                const fullAddress = `${userProfile.address}, ${userProfile.city}, ${userProfile.postal_code}, España`;

                // Preencher location e locationFull
                setLocation(userProfile.address);
                setLocationFull(fullAddress);
                setLocationApprox(`${userProfile.city} - ${userProfile.postal_code}`);

                // Buscar coordenadas do endereço
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
            setStreet('');
            setCity('');
            setComplement('');
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
                        'User-Agent': 'ALUKOApp/1.0'
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
        // Array para armazenar campos vazios
        const missingFields = [];

        // Validar campos obrigatórios e coletar os que estão faltando
        if (!title || title.trim() === '') missingFields.push('Título');
        if (!description || description.trim() === '') missingFields.push('Descripción');
        if (!pricePerDay || pricePerDay.trim() === '') missingFields.push('Precio por día');

        const hasAtLeastOnePhoto = photos.some(photo => photo !== null);
        if (!hasAtLeastOnePhoto) missingFields.push('Al menos una foto');

        if (!fullName || fullName.trim() === '') missingFields.push('Nombre completo');
        if (!phone || phone.trim() === '') missingFields.push('Teléfono de contacto');

        if (!street || street.trim() === '') missingFields.push('Calle/Avenida');
        if (!city || city.trim() === '') missingFields.push('Ciudad');
        if (!postalCode || postalCode.trim() === '') missingFields.push('Código postal');
        if (!coordinates) missingFields.push('Coordenadas (seleccione el código postal primero)');

        // Se houver campos faltando, mostrar mensagem específica
        if (missingFields.length > 0) {
            Alert.alert(
                'Campos Incompletos',
                `Por favor, completa los siguientes campos:\n\n• ${missingFields.join('\n• ')}`,
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);

        try {
            // Criar endereço completo
            const fullAddress = `${street}${complement ? ', ' + complement : ''}, ${city}, ${postalCode}, ${country}`;

            // Atualizar perfil do usuário
            const profileUpdateData = {
                full_name: fullName,
                phone: phone,
                updated_at: new Date().toISOString()
            };

            // Apenas atualizar endereço no perfil se marcou "Usar mi dirección de cadastro"
            if (useProfileAddress) {
                profileUpdateData.address = street;
                profileUpdateData.postal_code = postalCode;
                profileUpdateData.city = city;
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('id', session.user.id);

            if (profileError) {
                console.error('Erro ao atualizar perfil:', profileError);
                Alert.alert('Aviso', 'Houve um problema ao salvar seus dados pessoais, pero continuaremos con el anuncio.');
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
                    price_per_day: parseEuroValue(pricePerDay),
                    deposit_value: depositValue ? parseEuroValue(depositValue) : 0,
                    discount_week: discountWeek ? parseFloat(discountWeek) : 0,
                    discount_month: discountMonth ? parseFloat(discountMonth) : 0,
                    category,
                    subcategory: subcategory || null,
                    location: street,
                    location_full: fullAddress,
                    location_approx: `${city} - ${postalCode}`,
                    coordinates: coordinates,
                    coordinates_approx: coordinates ? addRandomOffset(coordinates) : null,
                    street: street,
                    complement: complement,
                    city: city,
                    country: country,
                    postal_code: postalCode,
                    photo_url: uploadedPaths[0],
                    photos: uploadedPaths,
                    delivery_type: deliveryType,
                    delivery_distance: deliveryDistance ? parseFloat(deliveryDistance) : null,
                    is_free_delivery: isFreeDelivery,
                    delivery_fee: deliveryFee ? parseEuroValue(deliveryFee) : 0,
                    flexible_hours: flexibleHours,
                    pickup_days: Object.keys(pickupDays).filter(day => pickupDays[day]),
                    pickup_time_start: flexibleHours ? '06:00' : pickupTimeStart,
                    pickup_time_end: flexibleHours ? '23:00' : pickupTimeEnd,
                    pickup_morning: pickupMorning,
                    pickup_morning_start: pickupMorningStart,
                    pickup_morning_end: pickupMorningEnd,
                    pickup_afternoon: pickupAfternoon,
                    pickup_afternoon_start: pickupAfternoonStart,
                    pickup_afternoon_end: pickupAfternoonEnd,
                    pickup_evening: pickupEvening,
                    pickup_evening_start: pickupEveningStart,
                    pickup_evening_end: pickupEveningEnd,
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
        } catch (error) {
            setLoading(false);
            console.error('Error en handleSubmit:', error);
            Alert.alert('Error', 'Ocurrió un error al publicar el anuncio');
        }
    }

    return (
        <SafeAreaView style={addItemFormStyles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header Verde - Mesmo layout do Marketplace */}
            <View style={addItemFormStyles.headerContainer}>
                <View style={addItemFormStyles.headerTopRow}>
                    {/* Botão Voltar + Título */}
                    <View style={addItemFormStyles.leftHeader}>
                        <TouchableOpacity
                            style={addItemFormStyles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={addItemFormStyles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={addItemFormStyles.headerTitle}>Anunciar Artículo</Text>
                    </View>

                    {/* ALUKO à Direita */}
                    <View style={addItemFormStyles.logoContainer}>
                        <Image
                            source={require('../../assets/images/app-icon.png')}
                            style={addItemFormStyles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={addItemFormStyles.logoText}>ALUKO</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={addItemFormStyles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Card: Información Básica */}
                <View style={addItemFormStyles.card}>
                    <Text style={addItemFormStyles.cardTitle}>📝 Información Básica</Text>

                    <Text style={addItemFormStyles.label}>Título del Anuncio</Text>
                    <TextInput
                        style={addItemFormStyles.input}
                        onChangeText={setTitle}
                        value={title}
                        placeholder="Ej: Taladro Bosch 18V"
                        placeholderTextColor="#999"
                        maxLength={80}
                    />

                    <Text style={addItemFormStyles.label}>Descripción Completa</Text>
                    <TextInput
                        style={[addItemFormStyles.input, addItemFormStyles.multilineInput]}
                        onChangeText={setDescription}
                        value={description}
                        placeholder="Describe el estado, accesorios incluidos y condiciones de alquiler..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                    />

                    {/* Seleção de Categoria e Subcategoria */}
                    <CategorySubcategoryPicker
                        selectedCategory={category}
                        selectedSubcategory={subcategory}
                        onCategoryChange={setCategory}
                        onSubcategoryChange={setSubcategory}
                    />
                </View>

                {/* Card: Precio */}
                <View style={addItemFormStyles.card}>
                    <Text style={addItemFormStyles.cardTitle}>💰 Precio</Text>

                    <Text style={addItemFormStyles.label}>Precio por Día</Text>
                    <View style={addItemFormStyles.priceInputContainer}>
                        <Text style={addItemFormStyles.currencySymbol}>€</Text>
                        <TextInput
                            style={addItemFormStyles.priceInput}
                            onChangeText={(text) => {
                                const formatted = formatEuroValue(text);
                                setPricePerDay(formatted);
                            }}
                            value={pricePerDay}
                            placeholder="0,00"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                        <Text style={addItemFormStyles.perDay}>/día</Text>
                    </View>

                    <Text style={addItemFormStyles.label}>Descuento Alquiler 1 Semana (%)</Text>
                    <TextInput
                        style={addItemFormStyles.input}
                        onChangeText={setDiscountWeek}
                        value={discountWeek}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={addItemFormStyles.label}>Descuento Alquiler 1 Mes (%)</Text>
                    <TextInput
                        style={addItemFormStyles.input}
                        onChangeText={setDiscountMonth}
                        value={discountMonth}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={addItemFormStyles.label}>Valor del Depósito (Daño o Pérdida)</Text>
                    <Text style={addItemFormStyles.depositWarning}>💡 Coloca un valor justo. Si lo exageras, las personas no querrán alquilar tu producto.</Text>
                    <View style={addItemFormStyles.priceInputContainer}>
                        <Text style={addItemFormStyles.currencySymbol}>€</Text>
                        <TextInput
                            style={addItemFormStyles.priceInput}
                            onChangeText={(text) => {
                                const formatted = formatEuroValue(text);
                                setDepositValue(formatted);
                            }}
                            value={depositValue}
                            placeholder="0,00"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Card: Ubicación y Disponibilidad */}
                <View style={addItemFormStyles.card}>
                    <Text style={addItemFormStyles.cardTitle}>📍 Ubicación y Disponibilidad</Text>

                    <Text style={addItemFormStyles.label}>Ubicación de Recogida *</Text>

                    {/* Checkbox para usar endereço de cadastro */}
                    <TouchableOpacity
                        style={addItemFormStyles.checkboxContainer}
                        onPress={() => setUseProfileAddress(!useProfileAddress)}
                        activeOpacity={0.7}
                    >
                        <View style={[addItemFormStyles.checkbox, useProfileAddress && addItemFormStyles.checkboxChecked]}>
                            {useProfileAddress && <Text style={addItemFormStyles.checkboxIcon}>✓</Text>}
                        </View>
                        <Text style={addItemFormStyles.checkboxLabel}>Usar mi dirección de cadastro</Text>
                    </TouchableOpacity>

                    {!useProfileAddress && (
                        <>
                            <Text style={addItemFormStyles.sublabel}>Introduce el código postal para buscar la dirección</Text>

                            <TextInput
                                style={addItemFormStyles.input}
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
                                <View style={addItemFormStyles.loadingAddressContainer}>
                                    <ActivityIndicator size="small" color="#2c4455" />
                                    <Text style={addItemFormStyles.loadingAddressText}>Buscando direcciones...</Text>
                                </View>
                            )}

                            {addressSuggestions.length > 0 && (
                                <View style={addItemFormStyles.suggestionsContainer}>
                                    <Text style={addItemFormStyles.suggestionsTitle}>Selecciona una dirección:</Text>
                                    {addressSuggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={addItemFormStyles.suggestionItem}
                                            onPress={() => {
                                                setLocation(suggestion.display);
                                                setLocationFull(suggestion.full);
                                                setLocationApprox(`${suggestion.city} - ${suggestion.postalCode}`);
                                                setCoordinates({
                                                    latitude: suggestion.lat,
                                                    longitude: suggestion.lon
                                                });
                                                // Preencher campos separados
                                                setStreet(''); // ← Deixar vazio para usuário preencher
                                                setCity(suggestion.city || '');
                                                setCountry('España');
                                                setAddressSuggestions([]);
                                                setPostalCode(suggestion.postalCode || '');
                                            }}
                                        >
                                            <Text style={addItemFormStyles.suggestionIcon}>📍</Text>
                                            <Text style={addItemFormStyles.suggestionText}>{suggestion.display}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {/* Campos de endereço completo */}
                    {(location !== '' || useProfileAddress) && (
                        <>
                            <Text style={addItemFormStyles.label}>Calle/Avenida *</Text>
                            <TextInput
                                style={addItemFormStyles.input}
                                onChangeText={setStreet}
                                value={street}
                                placeholder="Ej: Calle Gran Vía, 123"
                                placeholderTextColor="#999"
                            />

                            <Text style={addItemFormStyles.label}>Complemento</Text>
                            <TextInput
                                style={addItemFormStyles.input}
                                onChangeText={setComplement}
                                value={complement}
                                placeholder="Ej: Piso 3, Puerta B"
                                placeholderTextColor="#999"
                            />

                            <Text style={addItemFormStyles.label}>Ciudad *</Text>
                            <TextInput
                                style={addItemFormStyles.input}
                                onChangeText={setCity}
                                value={city}
                                placeholder="Ej: Madrid"
                                placeholderTextColor="#999"
                            />

                            <Text style={addItemFormStyles.label}>Código Postal *</Text>
                            <TextInput
                                style={addItemFormStyles.input}
                                onChangeText={setPostalCode}
                                value={postalCode}
                                placeholder="Ej: 28001"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            <Text style={addItemFormStyles.label}>País *</Text>
                            <TextInput
                                style={addItemFormStyles.input}
                                onChangeText={setCountry}
                                value={country}
                                placeholder="España"
                                placeholderTextColor="#999"
                            />
                        </>
                    )}

                    {/* Tipo de Entrega */}
                    <Text style={addItemFormStyles.label}>🚚 Tipo de Entrega</Text>
                    <View style={addItemFormStyles.deliveryTypeContainer}>
                        <TouchableOpacity
                            style={[addItemFormStyles.deliveryOption, deliveryType === 'pickup' && addItemFormStyles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('pickup')}
                            activeOpacity={0.7}
                        >
                            <Text style={addItemFormStyles.deliveryOptionIcon}>📍</Text>
                            <Text style={[addItemFormStyles.deliveryOptionText, deliveryType === 'pickup' && addItemFormStyles.deliveryOptionTextActive]}>
                                Retira en Lugar
                            </Text>
                            {deliveryType === 'pickup' && (
                                <View style={addItemFormStyles.deliveryCheckmark}>
                                    <Text style={addItemFormStyles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[addItemFormStyles.deliveryOption, deliveryType === 'delivery' && addItemFormStyles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('delivery')}
                            activeOpacity={0.7}
                        >
                            <Text style={addItemFormStyles.deliveryOptionIcon}>🚚</Text>
                            <Text style={[addItemFormStyles.deliveryOptionText, deliveryType === 'delivery' && addItemFormStyles.deliveryOptionTextActive]}>
                                Entrego en Casa
                            </Text>
                            {deliveryType === 'delivery' && (
                                <View style={addItemFormStyles.deliveryCheckmark}>
                                    <Text style={addItemFormStyles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Campos de Entrega (mostrar apenas se delivery) */}
                    {deliveryType === 'delivery' && (
                        <View style={addItemFormStyles.deliveryDetailsContainer}>
                            <Text style={addItemFormStyles.deliveryDetailsTitle}>📦 Detalles de Entrega</Text>

                            <Text style={addItemFormStyles.label}>Distancia Máxima de Entrega (km)</Text>
                            <TextInput
                                style={addItemFormStyles.input}
                                onChangeText={setDeliveryDistance}
                                value={deliveryDistance}
                                placeholder="Ej: 5"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            {/* Toggle Entrega Gratuita */}
                            <Text style={addItemFormStyles.label}>Tipo de Entrega</Text>
                            <View style={addItemFormStyles.deliveryFeeTypeContainer}>
                                <TouchableOpacity
                                    style={[addItemFormStyles.deliveryFeeOption, isFreeDelivery && addItemFormStyles.deliveryFeeOptionActive]}
                                    onPress={() => {
                                        setIsFreeDelivery(true);
                                        setDeliveryFee('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={addItemFormStyles.deliveryFeeIcon}>🎁</Text>
                                    <Text style={[addItemFormStyles.deliveryFeeText, isFreeDelivery && addItemFormStyles.deliveryFeeTextActive]}>
                                        Entrega Gratis
                                    </Text>
                                    {isFreeDelivery && (
                                        <View style={addItemFormStyles.smallCheckmark}>
                                            <Text style={addItemFormStyles.smallCheckmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[addItemFormStyles.deliveryFeeOption, !isFreeDelivery && addItemFormStyles.deliveryFeeOptionActive]}
                                    onPress={() => setIsFreeDelivery(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={addItemFormStyles.deliveryFeeIcon}>💰</Text>
                                    <Text style={[addItemFormStyles.deliveryFeeText, !isFreeDelivery && addItemFormStyles.deliveryFeeTextActive]}>
                                        Cobro por Entrega
                                    </Text>
                                    {!isFreeDelivery && (
                                        <View style={addItemFormStyles.smallCheckmark}>
                                            <Text style={addItemFormStyles.smallCheckmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Campo de valor da entrega (só mostra se não for grátis) */}
                            {!isFreeDelivery && (
                                <>
                                    <Text style={addItemFormStyles.label}>Valor de la Entrega</Text>
                                    <View style={addItemFormStyles.priceInputContainer}>
                                        <Text style={addItemFormStyles.currencySymbol}>€</Text>
                                        <TextInput
                                            style={addItemFormStyles.priceInput}
                                            onChangeText={(text) => {
                                                const formatted = formatEuroValue(text);
                                                setDeliveryFee(formatted);
                                            }}
                                            value={deliveryFee}
                                            placeholder="0,00"
                                            placeholderTextColor="#999"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Disponibilidad de Recogida */}
                    <Text style={addItemFormStyles.label}>⏰ Disponibilidad de Recogida</Text>

                    {/* Toggle Horarios Flexibles */}
                    <TouchableOpacity
                        style={addItemFormStyles.checkboxContainer}
                        onPress={() => setFlexibleHours(!flexibleHours)}
                        activeOpacity={0.7}
                    >
                        <View style={[addItemFormStyles.checkbox, flexibleHours && addItemFormStyles.checkboxChecked]}>
                            {flexibleHours && <Text style={addItemFormStyles.checkboxIcon}>✓</Text>}
                        </View>
                        <Text style={addItemFormStyles.checkboxLabel}>Horario flexible (06:00 - 23:00, todos los días)</Text>
                    </TouchableOpacity>

                    {!flexibleHours && (
                        <>
                            {/* Seletor de Días */}
                            <Text style={addItemFormStyles.subLabel}>Días disponibles:</Text>
                            <View style={addItemFormStyles.daysContainer}>
                                {[
                                    { key: 'monday', label: 'L' },
                                    { key: 'tuesday', label: 'M' },
                                    { key: 'wednesday', label: 'X' },
                                    { key: 'thursday', label: 'J' },
                                    { key: 'friday', label: 'V' },
                                    { key: 'saturday', label: 'S' },
                                    { key: 'sunday', label: 'D' }
                                ].map(day => (
                                    <TouchableOpacity
                                        key={day.key}
                                        style={[addItemFormStyles.dayButton, pickupDays[day.key] && addItemFormStyles.dayButtonActive]}
                                        onPress={() => setPickupDays({...pickupDays, [day.key]: !pickupDays[day.key]})}
                                    >
                                        <Text style={[addItemFormStyles.dayButtonText, pickupDays[day.key] && addItemFormStyles.dayButtonTextActive]}>
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Horarios Manhã/Tarde/Noite */}
                            <Text style={addItemFormStyles.subLabel}>Horarios de recogida:</Text>

                            {/* Mañana */}
                            <TouchableOpacity
                                style={addItemFormStyles.checkboxContainer}
                                onPress={() => setPickupMorning(!pickupMorning)}
                                activeOpacity={0.7}
                            >
                                <View style={[addItemFormStyles.checkbox, pickupMorning && addItemFormStyles.checkboxChecked]}>
                                    {pickupMorning && <Text style={addItemFormStyles.checkboxCheck}>✓</Text>}
                                </View>
                                <Text style={addItemFormStyles.checkboxLabel}>🌅 Mañana</Text>
                            </TouchableOpacity>
                            {pickupMorning && (
                                <View style={addItemFormStyles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={addItemFormStyles.timePickerButton}
                                        onPress={() => {
                                            const hours = Array.from({length: 18}, (_, i) => {
                                                const hour = (i + 6).toString().padStart(2, '0');
                                                return `${hour}:00`;
                                            });
                                            Alert.alert(
                                                'Hora de inicio',
                                                'Selecciona la hora de inicio',
                                                hours.map(hour => ({
                                                    text: hour,
                                                    onPress: () => setPickupMorningStart(hour)
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={addItemFormStyles.timePickerLabel}>Desde:</Text>
                                        <Text style={addItemFormStyles.timePickerValue}>{pickupMorningStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={addItemFormStyles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={addItemFormStyles.timePickerButton}
                                        onPress={() => {
                                            const hours = Array.from({length: 18}, (_, i) => {
                                                const hour = (i + 6).toString().padStart(2, '0');
                                                return `${hour}:00`;
                                            });
                                            Alert.alert(
                                                'Hora de fin',
                                                'Selecciona la hora de fin',
                                                hours.map(hour => ({
                                                    text: hour,
                                                    onPress: () => setPickupMorningEnd(hour)
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={addItemFormStyles.timePickerLabel}>Hasta:</Text>
                                        <Text style={addItemFormStyles.timePickerValue}>{pickupMorningEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Tarde */}
                            <TouchableOpacity
                                style={addItemFormStyles.checkboxContainer}
                                onPress={() => setPickupAfternoon(!pickupAfternoon)}
                                activeOpacity={0.7}
                            >
                                <View style={[addItemFormStyles.checkbox, pickupAfternoon && addItemFormStyles.checkboxChecked]}>
                                    {pickupAfternoon && <Text style={addItemFormStyles.checkboxCheck}>✓</Text>}
                                </View>
                                <Text style={addItemFormStyles.checkboxLabel}>☀️ Tarde</Text>
                            </TouchableOpacity>
                            {pickupAfternoon && (
                                <View style={addItemFormStyles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={addItemFormStyles.timePickerButton}
                                        onPress={() => {
                                            const hours = Array.from({length: 18}, (_, i) => {
                                                const hour = (i + 6).toString().padStart(2, '0');
                                                return `${hour}:00`;
                                            });
                                            Alert.alert(
                                                'Hora de inicio',
                                                'Selecciona la hora de inicio',
                                                hours.map(hour => ({
                                                    text: hour,
                                                    onPress: () => setPickupAfternoonStart(hour)
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={addItemFormStyles.timePickerLabel}>Desde:</Text>
                                        <Text style={addItemFormStyles.timePickerValue}>{pickupAfternoonStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={addItemFormStyles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={addItemFormStyles.timePickerButton}
                                        onPress={() => {
                                            const hours = Array.from({length: 18}, (_, i) => {
                                                const hour = (i + 6).toString().padStart(2, '0');
                                                return `${hour}:00`;
                                            });
                                            Alert.alert(
                                                'Hora de fin',
                                                'Selecciona la hora de fin',
                                                hours.map(hour => ({
                                                    text: hour,
                                                    onPress: () => setPickupAfternoonEnd(hour)
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={addItemFormStyles.timePickerLabel}>Hasta:</Text>
                                        <Text style={addItemFormStyles.timePickerValue}>{pickupAfternoonEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Noche */}
                            <TouchableOpacity
                                style={addItemFormStyles.checkboxContainer}
                                onPress={() => setPickupEvening(!pickupEvening)}
                                activeOpacity={0.7}
                            >
                                <View style={[addItemFormStyles.checkbox, pickupEvening && addItemFormStyles.checkboxChecked]}>
                                    {pickupEvening && <Text style={addItemFormStyles.checkboxCheck}>✓</Text>}
                                </View>
                                <Text style={addItemFormStyles.checkboxLabel}>🌙 Noche</Text>
                            </TouchableOpacity>
                            {pickupEvening && (
                                <View style={addItemFormStyles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={addItemFormStyles.timePickerButton}
                                        onPress={() => {
                                            const hours = Array.from({length: 18}, (_, i) => {
                                                const hour = (i + 6).toString().padStart(2, '0');
                                                return `${hour}:00`;
                                            });
                                            Alert.alert(
                                                'Hora de inicio',
                                                'Selecciona la hora de inicio',
                                                hours.map(hour => ({
                                                    text: hour,
                                                    onPress: () => setPickupEveningStart(hour)
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={addItemFormStyles.timePickerLabel}>Desde:</Text>
                                        <Text style={addItemFormStyles.timePickerValue}>{pickupEveningStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={addItemFormStyles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={addItemFormStyles.timePickerButton}
                                        onPress={() => {
                                            const hours = Array.from({length: 18}, (_, i) => {
                                                const hour = (i + 6).toString().padStart(2, '0');
                                                return `${hour}:00`;
                                            });
                                            Alert.alert(
                                                'Hora de fin',
                                                'Selecciona la hora de fin',
                                                hours.map(hour => ({
                                                    text: hour,
                                                    onPress: () => setPickupEveningEnd(hour)
                                                }))
                                            );
                                        }}
                                    >
                                        <Text style={addItemFormStyles.timePickerLabel}>Hasta:</Text>
                                        <Text style={addItemFormStyles.timePickerValue}>{pickupEveningEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Card: Fotos */}
                <View style={addItemFormStyles.card}>
                    <Text style={addItemFormStyles.cardTitle}>📸 Fotos del Artículo</Text>
                    <Text style={addItemFormStyles.cardSubtitle}>Sube hasta 3 fotos - La primera será la principal</Text>

                    <View style={addItemFormStyles.photosGrid}>
                        {photos.map((photo, index) => (
                            <View key={index} style={addItemFormStyles.photoContainer}>
                                <TouchableOpacity
                                    onPress={() => pickImage(index)}
                                    style={[addItemFormStyles.photoPlaceholder, index === 0 && addItemFormStyles.photoPlaceholderPrimary]}
                                >
                                    {photo ? (
                                        <>
                                            <Image source={{ uri: photo }} style={addItemFormStyles.previewImage} />
                                            <TouchableOpacity style={addItemFormStyles.removePhotoButton} onPress={() => removePhoto(index)}>
                                                <Text style={addItemFormStyles.removePhotoText}>✕</Text>
                                            </TouchableOpacity>
                                            {index === 0 && (
                                                <View style={addItemFormStyles.primaryBadge}>
                                                    <Text style={addItemFormStyles.primaryBadgeText}>Principal</Text>
                                                </View>
                                            )}
                                        </>
                                    ) : (
                                        <View style={addItemFormStyles.addPhotoContent}>
                                            <Text style={addItemFormStyles.addPhotoIcon}>📷</Text>
                                            <Text style={addItemFormStyles.addPhotoText}>
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
                    style={[addItemFormStyles.publishButton, loading && addItemFormStyles.publishButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={addItemFormStyles.publishButtonGradient}
                    >
                        {loading ? (
                            <View style={addItemFormStyles.publishButtonContent}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={addItemFormStyles.publishButtonText}>Procesando...</Text>
                            </View>
                        ) : (
                            <View style={addItemFormStyles.publishButtonContent}>
                                <Text style={addItemFormStyles.publishButtonIcon}>🚀</Text>
                                <Text style={addItemFormStyles.publishButtonText}>Anunciar Artículo</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{height: 30}} />
            </ScrollView>
        </SafeAreaView>
    );
}





