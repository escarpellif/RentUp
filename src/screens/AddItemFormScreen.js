import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator, Platform , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { getApproximateLocation, getCoordinatesFromAddress, addRandomOffset } from '../utils/locationHelper';
import CategorySubcategoryPicker from '../components/CategorySubcategoryPicker';

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

                // Preencher campos separados
                setStreet(userProfile.address || '');
                setCity(userProfile.city || '');
                setCountry('España');
                setComplement('');

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
                deposit_value: depositValue ? parseFloat(depositValue) : 0,
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

                    {/* Seleção de Categoria e Subcategoria */}
                    <CategorySubcategoryPicker
                        selectedCategory={category}
                        selectedSubcategory={subcategory}
                        onCategoryChange={setCategory}
                        onSubcategoryChange={setSubcategory}
                    />
                </View>

                {/* Card: Precio */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💰 Precio</Text>

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

                    <Text style={styles.label}>Descuento Alquiler 1 Semana (%)</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setDiscountWeek}
                        value={discountWeek}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Descuento Alquiler 1 Mes (%)</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setDiscountMonth}
                        value={discountMonth}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Valor del Depósito (Daño o Pérdida)</Text>
                    <Text style={styles.depositWarning}>💡 Coloca un valor justo. Si lo exageras, las personas no querrán alquilar tu producto.</Text>
                    <View style={styles.priceInputContainer}>
                        <Text style={styles.currencySymbol}>€</Text>
                        <TextInput
                            style={styles.priceInput}
                            onChangeText={setDepositValue}
                            value={depositValue}
                            placeholder="0.00"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Card: Ubicación y Disponibilidad */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📍 Ubicación y Disponibilidad</Text>

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
                                                // Preencher campos separados
                                                setStreet(''); // ← Deixar vazio para usuário preencher
                                                setCity(suggestion.city || '');
                                                setCountry('España');
                                                setAddressSuggestions([]);
                                                setPostalCode(suggestion.postalCode || '');
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

                    {/* Campos de endereço completo */}
                    {(location !== '' || useProfileAddress) && (
                        <>
                            <Text style={styles.label}>Calle/Avenida *</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setStreet}
                                value={street}
                                placeholder="Ej: Calle Gran Vía, 123"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.label}>Complemento</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setComplement}
                                value={complement}
                                placeholder="Ej: Piso 3, Puerta B"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.label}>Ciudad *</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setCity}
                                value={city}
                                placeholder="Ej: Madrid"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.label}>Código Postal *</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setPostalCode}
                                value={postalCode}
                                placeholder="Ej: 28001"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>País *</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setCountry}
                                value={country}
                                placeholder="España"
                                placeholderTextColor="#999"
                            />
                        </>
                    )}

                    {/* Tipo de Entrega */}
                    <Text style={styles.label}>🚚 Tipo de Entrega</Text>
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

                    {/* Disponibilidad de Recogida */}
                    <Text style={styles.label}>⏰ Disponibilidad de Recogida</Text>

                    {/* Toggle Horarios Flexibles */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setFlexibleHours(!flexibleHours)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, flexibleHours && styles.checkboxChecked]}>
                            {flexibleHours && <Text style={styles.checkboxIcon}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Horario flexible (06:00 - 23:00, todos los días)</Text>
                    </TouchableOpacity>

                    {!flexibleHours && (
                        <>
                            {/* Seletor de Días */}
                            <Text style={styles.subLabel}>Días disponibles:</Text>
                            <View style={styles.daysContainer}>
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
                                        style={[styles.dayButton, pickupDays[day.key] && styles.dayButtonActive]}
                                        onPress={() => setPickupDays({...pickupDays, [day.key]: !pickupDays[day.key]})}
                                    >
                                        <Text style={[styles.dayButtonText, pickupDays[day.key] && styles.dayButtonTextActive]}>
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Horarios Manhã/Tarde/Noite */}
                            <Text style={styles.subLabel}>Horarios de recogida:</Text>

                            {/* Mañana */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setPickupMorning(!pickupMorning)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, pickupMorning && styles.checkboxChecked]}>
                                    {pickupMorning && <Text style={styles.checkboxCheck}>✓</Text>}
                                </View>
                                <Text style={styles.checkboxLabel}>🌅 Mañana</Text>
                            </TouchableOpacity>
                            {pickupMorning && (
                                <View style={styles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
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
                                        <Text style={styles.timePickerLabel}>Desde:</Text>
                                        <Text style={styles.timePickerValue}>{pickupMorningStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
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
                                        <Text style={styles.timePickerLabel}>Hasta:</Text>
                                        <Text style={styles.timePickerValue}>{pickupMorningEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Tarde */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setPickupAfternoon(!pickupAfternoon)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, pickupAfternoon && styles.checkboxChecked]}>
                                    {pickupAfternoon && <Text style={styles.checkboxCheck}>✓</Text>}
                                </View>
                                <Text style={styles.checkboxLabel}>☀️ Tarde</Text>
                            </TouchableOpacity>
                            {pickupAfternoon && (
                                <View style={styles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
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
                                        <Text style={styles.timePickerLabel}>Desde:</Text>
                                        <Text style={styles.timePickerValue}>{pickupAfternoonStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
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
                                        <Text style={styles.timePickerLabel}>Hasta:</Text>
                                        <Text style={styles.timePickerValue}>{pickupAfternoonEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Noche */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setPickupEvening(!pickupEvening)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, pickupEvening && styles.checkboxChecked]}>
                                    {pickupEvening && <Text style={styles.checkboxCheck}>✓</Text>}
                                </View>
                                <Text style={styles.checkboxLabel}>🌙 Noche</Text>
                            </TouchableOpacity>
                            {pickupEvening && (
                                <View style={styles.timeRangeContainer}>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
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
                                        <Text style={styles.timePickerLabel}>Desde:</Text>
                                        <Text style={styles.timePickerValue}>{pickupEveningStart}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeRangeSeparator}>-</Text>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
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
                                        <Text style={styles.timePickerLabel}>Hasta:</Text>
                                        <Text style={styles.timePickerValue}>{pickupEveningEnd}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
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
    depositWarning: {
        fontSize: 12,
        color: '#FF9800',
        fontStyle: 'italic',
        marginBottom: 8,
        lineHeight: 18,
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
    // Estilos para disponibilidade de horários
    subLabel: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    daysContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    dayButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    dayButtonTextActive: {
        color: '#fff',
    },
    timeRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    timePickerButton: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
    },
    timePickerLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    timePickerValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    timeRangeSeparator: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
});



