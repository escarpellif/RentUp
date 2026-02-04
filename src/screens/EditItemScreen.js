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
import { editItemStyles } from '../styles/screens/editItemStyles';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function EditItemScreen({ route, navigation, session }) {
    const { item } = route.params || {};

    // Validação inicial do item
    useEffect(() => {
        if (!item) {
            Alert.alert('Error', 'Item não encontrado');
            navigation.goBack();
        }
    }, [item, navigation]);

    const [title, setTitle] = useState(item?.title || '');
    const [description, setDescription] = useState(item?.description || '');
    const [pricePerDay, setPricePerDay] = useState(item?.price_per_day?.toString() || '');
    const [category, setCategory] = useState(item?.category || 'Electrónicos');
    const [subcategory, setSubcategory] = useState(item?.subcategory || '');
    const [location, setLocation] = useState(item?.location || '');
    const [locationFull, setLocationFull] = useState(item?.location_full || item?.location || '');
    const [locationApprox, setLocationApprox] = useState(item?.location_approx || getApproximateLocation(item?.location || ''));
    const [coordinates, setCoordinates] = useState(item?.coordinates || null);
    const [postalCode, setPostalCode] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [deliveryType, setDeliveryType] = useState(item?.delivery_type || 'pickup');
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([null, null, null]);
    const [photoPaths, setPhotoPaths] = useState([null, null, null]);

    // Novos estados para desconto
    const [discountWeek, setDiscountWeek] = useState(item?.discount_week?.toString() || '');
    const [discountMonth, setDiscountMonth] = useState(item?.discount_month?.toString() || '');
    const [depositValue, setDepositValue] = useState(item?.deposit_value?.toString() || '');

    // Estados para endereço completo
    const [street, setStreet] = useState(item?.street || '');
    const [complement, setComplement] = useState(item?.complement || '');
    const [city, setCity] = useState(item?.city || '');
    const [country, setCountry] = useState(item?.country || 'España');

    // Estados para usar endereço do perfil
    const [useProfileAddress, setUseProfileAddress] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    // Estados para disponibilidade de horários
    const [flexibleHours, setFlexibleHours] = useState(item?.flexible_hours !== false);
    const [pickupDays, setPickupDays] = useState({
        monday: item?.pickup_days?.includes('monday') !== false,
        tuesday: item?.pickup_days?.includes('tuesday') !== false,
        wednesday: item?.pickup_days?.includes('wednesday') !== false,
        thursday: item?.pickup_days?.includes('thursday') !== false,
        friday: item?.pickup_days?.includes('friday') !== false,
        saturday: item?.pickup_days?.includes('saturday') !== false,
        sunday: item?.pickup_days?.includes('sunday') !== false
    });
    const [pickupTimeStart, setPickupTimeStart] = useState(item?.pickup_time_start || '08:00');
    const [pickupTimeEnd, setPickupTimeEnd] = useState(item?.pickup_time_end || '20:00');

    // Estados para horários manhã/tarde/noite
    const [pickupMorning, setPickupMorning] = useState(item?.pickup_morning || false);
    const [pickupMorningStart, setPickupMorningStart] = useState(item?.pickup_morning_start || '07:00');
    const [pickupMorningEnd, setPickupMorningEnd] = useState(item?.pickup_morning_end || '12:00');
    const [pickupAfternoon, setPickupAfternoon] = useState(item?.pickup_afternoon || false);
    const [pickupAfternoonStart, setPickupAfternoonStart] = useState(item?.pickup_afternoon_start || '12:00');
    const [pickupAfternoonEnd, setPickupAfternoonEnd] = useState(item?.pickup_afternoon_end || '18:00');
    const [pickupEvening, setPickupEvening] = useState(item?.pickup_evening || false);
    const [pickupEveningStart, setPickupEveningStart] = useState(item?.pickup_evening_start || '18:00');
    const [pickupEveningEnd, setPickupEveningEnd] = useState(item?.pickup_evening_end || '23:00');

    // Estados para entrega
    const [deliveryDistance, setDeliveryDistance] = useState(item?.delivery_distance?.toString() || '');
    const [isFreeDelivery, setIsFreeDelivery] = useState(item?.is_free_delivery !== false);
    const [deliveryFee, setDeliveryFee] = useState(item?.delivery_fee?.toString() || '');

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

    // Formatar valores existentes ao carregar
    useEffect(() => {
        if (item?.price_per_day) {
            setPricePerDay(formatEuroValue(item.price_per_day.toString().replace('.', '')));
        }
        if (item?.deposit_value) {
            setDepositValue(formatEuroValue(item.deposit_value.toString().replace('.', '')));
        }
        if (item?.delivery_fee) {
            setDeliveryFee(formatEuroValue(item.delivery_fee.toString().replace('.', '')));
        }
    }, [item]);

    // Carregar fotos existentes e perfil do usuário ao montar o componente
    useEffect(() => {
        loadExistingPhotos();
        fetchUserProfile();
    }, []);

    // Função para buscar o perfil do usuário
    const fetchUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('address, postal_code, city')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Erro ao buscar perfil:', error);
            } else {
                setUserProfile(data);
            }
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
        }
    };

    // Efeito para usar endereço do perfil quando checkbox for marcado
    useEffect(() => {
        if (useProfileAddress && userProfile) {
            if (userProfile.address && userProfile.city && userProfile.postal_code) {
                // Mapear campos do profile para os campos do item
                setStreet(userProfile.address || ''); // address -> street
                setComplement(''); // profile não tem complement, deixar vazio
                setCity(userProfile.city || '');
                setCountry('España'); // profile não tem country, usar padrão
                setPostalCode(userProfile.postal_code || '');
                setLocation(userProfile.address || '');
                setLocationFull(`${userProfile.address}, ${userProfile.city}, ${userProfile.postal_code}, España`);
                setLocationApprox(`${userProfile.city} - ${userProfile.postal_code}`);

                // Buscar coordenadas do endereço
                const fullAddress = `${userProfile.address}, ${userProfile.city}, ${userProfile.postal_code}, España`;
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            setCoordinates({
                                latitude: parseFloat(data[0].lat),
                                longitude: parseFloat(data[0].lon)
                            });
                        }
                    })
                    .catch(err => console.error('Erro ao buscar coordenadas:', err));
            } else {
                Alert.alert(
                    'Endereço Incompleto',
                    'Seu perfil não possui endereço completo cadastrado. Por favor, preencha manualmente.',
                    [{ text: 'OK', onPress: () => setUseProfileAddress(false) }]
                );
            }
        }
    }, [useProfileAddress, userProfile]);

    // Função para carregar fotos existentes
    const loadExistingPhotos = () => {
        if (item) {
            const existingPhotos = (item?.photos && Array.isArray(item.photos))
                ? item.photos
                : (item?.photo_url && typeof item.photo_url === 'string')
                ? [item.photo_url]
                : [];

            const photoPaths = [
                existingPhotos[0] ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${existingPhotos[0]}` : null,
                existingPhotos[1] ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${existingPhotos[1]}` : null,
                existingPhotos[2] ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${existingPhotos[2]}` : null,
            ];
            setPhotos(photoPaths);
        }
    };

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
            mediaTypes: ['images'],
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

        if (!location || !locationFull || !coordinates) {
            Alert.alert('Endereço Obrigatório', 'Por favor, selecione o endereço completo de retirada do item.');
            return;
        }

        setLoading(true);


        const uploadedPaths = [];

        for (let i = 0; i < photos.length; i++) {
            if (photos[i]) {
                // Se for uma nova foto (começa com file://)
                if (photos[i].startsWith('file://')) {
                    const uploadedPath = await uploadImage(photos[i]);
                    if (uploadedPath) {
                        uploadedPaths.push(uploadedPath);
                    }
                } else {
                    // Se for foto existente, extrair o caminho
                    const path = photos[i].replace(`${SUPABASE_URL}/storage/v1/object/public/item_photos/`, '');
                    uploadedPaths.push(path);
                }
            }
        }

        if (uploadedPaths.length === 0) {
            Alert.alert('Error', 'No se pudo procesar ninguna foto');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('items')
            .update({
                title,
                description,
                price_per_day: parseEuroValue(pricePerDay),
                deposit_value: depositValue ? parseEuroValue(depositValue) : 0,
                discount_week: discountWeek ? parseFloat(discountWeek) : 0,
                discount_month: discountMonth ? parseFloat(discountMonth) : 0,
                category,
                subcategory: subcategory || null,
                location,
                location_full: locationFull,
                location_approx: locationApprox,
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
            })
            .eq('id', item.id);

        setLoading(false);

        if (error) {
            Alert.alert('Error al Actualizar', error.message);
        } else {
            Alert.alert(
                '¡Éxito!',
                '¡Tu artículo ha sido actualizado!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('MyAds')
                    }
                ]
            );
        }
    }

    return (
        <SafeAreaView style={editItemStyles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header Moderno */}
            <View style={editItemStyles.headerContainer}>
                <TouchableOpacity
                    style={editItemStyles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={editItemStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={editItemStyles.headerTitleContainer}>
                    <Text style={editItemStyles.headerTitle}>Editar Artículo</Text>
                    <Text style={editItemStyles.headerSubtitle}>Actualiza la información</Text>
                </View>
                <View style={editItemStyles.headerSpacer} />
            </View>

            <ScrollView style={editItemStyles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Card: Información Básica */}
                <View style={editItemStyles.card}>
                    <Text style={editItemStyles.cardTitle}>📝 Información Básica</Text>

                    <Text style={editItemStyles.label}>Título del Anuncio</Text>
                    <TextInput
                        style={editItemStyles.input}
                        onChangeText={setTitle}
                        value={title}
                        placeholder="Ej: Taladro Bosch 18V"
                        placeholderTextColor="#999"
                        maxLength={80}
                    />

                    <Text style={editItemStyles.label}>Descripción Completa</Text>
                    <TextInput
                        style={[editItemStyles.input, editItemStyles.multilineInput]}
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

                {/* Card: Precio y Descuentos */}
                <View style={editItemStyles.card}>
                    <Text style={editItemStyles.cardTitle}>💰 Precio y Descuentos</Text>

                    <Text style={editItemStyles.label}>Precio por Día</Text>
                    <View style={editItemStyles.priceInputContainer}>
                        <Text style={editItemStyles.currencySymbol}>€</Text>
                        <TextInput
                            style={editItemStyles.priceInput}
                            onChangeText={(text) => {
                                const formatted = formatEuroValue(text);
                                setPricePerDay(formatted);
                            }}
                            value={pricePerDay}
                            placeholder="0,00"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                        <Text style={editItemStyles.perDay}>/día</Text>
                    </View>

                    <Text style={editItemStyles.label}>Valor del Depósito (Daño o Pérdida)</Text>
                    <Text style={editItemStyles.depositWarning}>💡 Coloca un valor justo. Si lo exageras, las personas no querrán alquilar tu producto.</Text>
                    <View style={editItemStyles.priceInputContainer}>
                        <Text style={editItemStyles.currencySymbol}>€</Text>
                        <TextInput
                            style={editItemStyles.priceInput}
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

                    <Text style={editItemStyles.label}>Descuento Alquiler 1 Semana (%)</Text>
                    <TextInput
                        style={editItemStyles.input}
                        onChangeText={setDiscountWeek}
                        value={discountWeek}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={editItemStyles.label}>Descuento Alquiler 1 Mes (%)</Text>
                    <TextInput
                        style={editItemStyles.input}
                        onChangeText={setDiscountMonth}
                        value={discountMonth}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />
                </View>

                {/* Card: Ubicación y Disponibilidad */}
                <View style={editItemStyles.card}>
                    <Text style={editItemStyles.cardTitle}>📍 Ubicación y Disponibilidad</Text>

                    <Text style={editItemStyles.label}>Ubicación de Recogida *</Text>

                    {/* Checkbox para usar endereço de cadastro */}
                    <TouchableOpacity
                        style={editItemStyles.checkboxContainer}
                        onPress={() => setUseProfileAddress(!useProfileAddress)}
                        activeOpacity={0.7}
                    >
                        <View style={[editItemStyles.checkbox, useProfileAddress && editItemStyles.checkboxChecked]}>
                            {useProfileAddress && <Text style={editItemStyles.checkboxIcon}>✓</Text>}
                        </View>
                        <Text style={editItemStyles.checkboxLabel}>Usar mi dirección de cadastro</Text>
                    </TouchableOpacity>

                    {!useProfileAddress && (
                        <>
                            <Text style={editItemStyles.sublabel}>Introduce el código postal para buscar la dirección</Text>

                            <TextInput
                                style={editItemStyles.input}
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
                                <View style={editItemStyles.loadingAddressContainer}>
                                    <ActivityIndicator size="small" color="#2c4455" />
                                    <Text style={editItemStyles.loadingAddressText}>Buscando direcciones...</Text>
                                </View>
                            )}

                            {addressSuggestions.length > 0 && (
                                <View style={editItemStyles.suggestionsContainer}>
                                    <Text style={editItemStyles.suggestionsTitle}>Selecciona una dirección:</Text>
                                    {addressSuggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={editItemStyles.suggestionItem}
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
                                                setPostalCode(suggestion.postalCode || '');
                                                setAddressSuggestions([]);
                                            }}
                                        >
                                            <Text style={editItemStyles.suggestionIcon}>📍</Text>
                                            <Text style={editItemStyles.suggestionText}>{suggestion.display}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {/* Campos de endereço completo */}
                    {location !== '' && (
                        <>
                            <Text style={editItemStyles.label}>Calle/Avenida *</Text>
                            <TextInput
                                style={editItemStyles.input}
                                onChangeText={setStreet}
                                value={street}
                                placeholder="Ej: Calle Gran Vía, 123"
                                placeholderTextColor="#999"
                            />

                            <Text style={editItemStyles.label}>Complemento</Text>
                            <TextInput
                                style={editItemStyles.input}
                                onChangeText={setComplement}
                                value={complement}
                                placeholder="Ej: Piso 3, Puerta B"
                                placeholderTextColor="#999"
                            />

                            <Text style={editItemStyles.label}>Ciudad *</Text>
                            <TextInput
                                style={editItemStyles.input}
                                onChangeText={setCity}
                                value={city}
                                placeholder="Ej: Madrid"
                                placeholderTextColor="#999"
                            />

                            <Text style={editItemStyles.label}>Código Postal *</Text>
                            <TextInput
                                style={editItemStyles.input}
                                onChangeText={setPostalCode}
                                value={postalCode}
                                placeholder="Ej: 28001"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            <Text style={editItemStyles.label}>País *</Text>
                            <TextInput
                                style={editItemStyles.input}
                                onChangeText={setCountry}
                                value={country}
                                placeholder="España"
                                placeholderTextColor="#999"
                            />
                        </>
                    )}

                    {/* Disponibilidad de Recogida */}
                    <Text style={editItemStyles.label}>⏰ Disponibilidad de Recogida</Text>

                    {/* Toggle Horarios Flexibles */}
                    <TouchableOpacity
                        style={editItemStyles.checkboxContainer}
                        onPress={() => setFlexibleHours(!flexibleHours)}
                        activeOpacity={0.7}
                    >
                        <View style={[editItemStyles.checkbox, flexibleHours && editItemStyles.checkboxChecked]}>
                            {flexibleHours && <Text style={editItemStyles.checkboxIcon}>✓</Text>}
                        </View>
                        <Text style={editItemStyles.checkboxLabel}>Horario flexible (06:00 - 23:00, todos los días)</Text>
                    </TouchableOpacity>

                    {!flexibleHours && (
                        <>
                            {/* Seletor de Días */}
                            <Text style={editItemStyles.subLabel}>Días disponibles:</Text>
                            <View style={editItemStyles.daysContainer}>
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
                                        style={[editItemStyles.dayButton, pickupDays[day.key] && editItemStyles.dayButtonActive]}
                                        onPress={() => setPickupDays({...pickupDays, [day.key]: !pickupDays[day.key]})}
                                    >
                                        <Text style={[editItemStyles.dayButtonText, pickupDays[day.key] && editItemStyles.dayButtonTextActive]}>
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Horarios Manhã/Tarde/Noite */}
                            <Text style={editItemStyles.subLabel}>Horarios de recogida:</Text>

                            {/* Mañana */}
                            <TouchableOpacity
                                style={editItemStyles.checkboxContainer}
                                onPress={() => setPickupMorning(!pickupMorning)}
                                activeOpacity={0.7}
                            >
                                <View style={[editItemStyles.checkbox, pickupMorning && editItemStyles.checkboxChecked]}>
                                    {pickupMorning && <Text style={editItemStyles.checkboxIcon}>✓</Text>}
                                </View>
                                <Text style={editItemStyles.checkboxLabel}>🌅 Mañana</Text>
                            </TouchableOpacity>
                            {pickupMorning && (
                                <View style={editItemStyles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={editItemStyles.timePickerButton}
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
                                        <Text style={editItemStyles.timePickerLabel}>Desde:</Text>
                                        <Text style={editItemStyles.timePickerValue}>{pickupMorningStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={editItemStyles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={editItemStyles.timePickerButton}
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
                                        <Text style={editItemStyles.timePickerLabel}>Hasta:</Text>
                                        <Text style={editItemStyles.timePickerValue}>{pickupMorningEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Tarde */}
                            <TouchableOpacity
                                style={editItemStyles.checkboxContainer}
                                onPress={() => setPickupAfternoon(!pickupAfternoon)}
                                activeOpacity={0.7}
                            >
                                <View style={[editItemStyles.checkbox, pickupAfternoon && editItemStyles.checkboxChecked]}>
                                    {pickupAfternoon && <Text style={editItemStyles.checkboxIcon}>✓</Text>}
                                </View>
                                <Text style={editItemStyles.checkboxLabel}>☀️ Tarde</Text>
                            </TouchableOpacity>
                            {pickupAfternoon && (
                                <View style={editItemStyles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={editItemStyles.timePickerButton}
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
                                        <Text style={editItemStyles.timePickerLabel}>Desde:</Text>
                                        <Text style={editItemStyles.timePickerValue}>{pickupAfternoonStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={editItemStyles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={editItemStyles.timePickerButton}
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
                                        <Text style={editItemStyles.timePickerLabel}>Hasta:</Text>
                                        <Text style={editItemStyles.timePickerValue}>{pickupAfternoonEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Noche */}
                            <TouchableOpacity
                                style={editItemStyles.checkboxContainer}
                                onPress={() => setPickupEvening(!pickupEvening)}
                                activeOpacity={0.7}
                            >
                                <View style={[editItemStyles.checkbox, pickupEvening && editItemStyles.checkboxChecked]}>
                                    {pickupEvening && <Text style={editItemStyles.checkboxIcon}>✓</Text>}
                                </View>
                                <Text style={editItemStyles.checkboxLabel}>🌙 Noche</Text>
                            </TouchableOpacity>
                            {pickupEvening && (
                                <View style={editItemStyles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={editItemStyles.timePickerButton}
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
                                        <Text style={editItemStyles.timePickerLabel}>Desde:</Text>
                                        <Text style={editItemStyles.timePickerValue}>{pickupEveningStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={editItemStyles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={editItemStyles.timePickerButton}
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
                                        <Text style={editItemStyles.timePickerLabel}>Hasta:</Text>
                                        <Text style={editItemStyles.timePickerValue}>{pickupEveningEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}

                    {/* Tipo de Entrega */}
                    <Text style={editItemStyles.label}>🚚 Tipo de Entrega</Text>
                    <View style={editItemStyles.deliveryTypeContainer}>
                        <TouchableOpacity
                            style={[editItemStyles.deliveryOption, deliveryType === 'pickup' && editItemStyles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('pickup')}
                            activeOpacity={0.7}
                        >
                            <Text style={editItemStyles.deliveryOptionIcon}>📍</Text>
                            <Text style={[editItemStyles.deliveryOptionText, deliveryType === 'pickup' && editItemStyles.deliveryOptionTextActive]}>
                                Retira en Lugar
                            </Text>
                            {deliveryType === 'pickup' && (
                                <View style={editItemStyles.deliveryCheckmark}>
                                    <Text style={editItemStyles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[editItemStyles.deliveryOption, deliveryType === 'delivery' && editItemStyles.deliveryOptionActive]}
                            onPress={() => setDeliveryType('delivery')}
                            activeOpacity={0.7}
                        >
                            <Text style={editItemStyles.deliveryOptionIcon}>🚚</Text>
                            <Text style={[editItemStyles.deliveryOptionText, deliveryType === 'delivery' && editItemStyles.deliveryOptionTextActive]}>
                                Entrego en Casa
                            </Text>
                            {deliveryType === 'delivery' && (
                                <View style={editItemStyles.deliveryCheckmark}>
                                    <Text style={editItemStyles.deliveryCheckmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Campos de Entrega (mostrar apenas se delivery) */}
                    {deliveryType === 'delivery' && (
                        <View style={editItemStyles.deliveryDetailsContainer}>
                            <Text style={editItemStyles.deliveryDetailsTitle}>📦 Detalles de Entrega</Text>

                            <Text style={editItemStyles.label}>Distancia Máxima de Entrega (km)</Text>
                            <TextInput
                                style={editItemStyles.input}
                                onChangeText={setDeliveryDistance}
                                value={deliveryDistance}
                                placeholder="Ej: 5"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            {/* Toggle Entrega Gratuita */}
                            <Text style={editItemStyles.label}>Tipo de Entrega</Text>
                            <View style={editItemStyles.deliveryFeeTypeContainer}>
                                <TouchableOpacity
                                    style={[editItemStyles.deliveryFeeOption, isFreeDelivery && editItemStyles.deliveryFeeOptionActive]}
                                    onPress={() => {
                                        setIsFreeDelivery(true);
                                        setDeliveryFee('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={editItemStyles.deliveryFeeIcon}>🎁</Text>
                                    <Text style={[editItemStyles.deliveryFeeText, isFreeDelivery && editItemStyles.deliveryFeeTextActive]}>
                                        Entrega Gratis
                                    </Text>
                                    {isFreeDelivery && (
                                        <View style={editItemStyles.smallCheckmark}>
                                            <Text style={editItemStyles.smallCheckmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[editItemStyles.deliveryFeeOption, !isFreeDelivery && editItemStyles.deliveryFeeOptionActive]}
                                    onPress={() => setIsFreeDelivery(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={editItemStyles.deliveryFeeIcon}>💰</Text>
                                    <Text style={[editItemStyles.deliveryFeeText, !isFreeDelivery && editItemStyles.deliveryFeeTextActive]}>
                                        Cobro por Entrega
                                    </Text>
                                    {!isFreeDelivery && (
                                        <View style={editItemStyles.smallCheckmark}>
                                            <Text style={editItemStyles.smallCheckmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Campo de valor da entrega (só mostra se não for grátis) */}
                            {!isFreeDelivery && (
                                <>
                                    <Text style={editItemStyles.label}>Valor de la Entrega</Text>
                                    <View style={editItemStyles.priceInputContainer}>
                                        <Text style={editItemStyles.currencySymbol}>€</Text>
                                        <TextInput
                                            style={editItemStyles.priceInput}
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
                </View>

                {/* Card: Fotos */}
                <View style={editItemStyles.card}>
                    <Text style={editItemStyles.cardTitle}>📸 Fotos del Artículo</Text>
                    <Text style={editItemStyles.cardSubtitle}>Sube hasta 3 fotos - La primera será la principal</Text>

                    <View style={editItemStyles.photosGrid}>
                        {photos.map((photo, index) => (
                            <View key={index} style={editItemStyles.photoContainer}>
                                <TouchableOpacity
                                    onPress={() => pickImage(index)}
                                    style={[editItemStyles.photoPlaceholder, index === 0 && editItemStyles.photoPlaceholderPrimary]}
                                >
                                    {photo ? (
                                        <>
                                            <Image source={{ uri: photo }} style={editItemStyles.previewImage} />
                                            <TouchableOpacity style={editItemStyles.removePhotoButton} onPress={() => removePhoto(index)}>
                                                <Text style={editItemStyles.removePhotoText}>✕</Text>
                                            </TouchableOpacity>
                                            {index === 0 && (
                                                <View style={editItemStyles.primaryBadge}>
                                                    <Text style={editItemStyles.primaryBadgeText}>Principal</Text>
                                                </View>
                                            )}
                                        </>
                                    ) : (
                                        <View style={editItemStyles.addPhotoContent}>
                                            <Text style={editItemStyles.addPhotoIcon}>📷</Text>
                                            <Text style={editItemStyles.addPhotoText}>
                                                {index === 0 ? 'Foto Principal' : `Foto ${index + 1}`}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Botão Guardar Cambios */}
                <TouchableOpacity
                    style={[editItemStyles.publishButton, loading && editItemStyles.publishButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={editItemStyles.publishButtonGradient}
                    >
                        {loading ? (
                            <View style={editItemStyles.publishButtonContent}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={editItemStyles.publishButtonText}>Procesando...</Text>
                            </View>
                        ) : (
                            <View style={editItemStyles.publishButtonContent}>
                                <Text style={editItemStyles.publishButtonIcon}>💾</Text>
                                <Text style={editItemStyles.publishButtonText}>Guardar Cambios</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{height: 30}} />
            </ScrollView>
        </SafeAreaView>
    );
}





