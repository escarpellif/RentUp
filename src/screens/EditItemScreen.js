import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { getApproximateLocation, getCoordinatesFromAddress, addRandomOffset } from '../utils/locationHelper';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function EditItemScreen({ route, navigation, session }) {
    const { item } = route.params || {};

    const [title, setTitle] = useState(item?.title || '');
    const [description, setDescription] = useState(item?.description || '');
    const [pricePerDay, setPricePerDay] = useState(item?.price_per_day?.toString() || '');
    const [category, setCategory] = useState(item?.category || 'Otros');
    const [location, setLocation] = useState(item?.location || '');
    const [locationFull, setLocationFull] = useState(item?.location_full || item?.location || '');
    const [locationApprox, setLocationApprox] = useState(item?.location_approx || getApproximateLocation(item?.location || ''));
    const [coordinates, setCoordinates] = useState(item?.coordinates || null);
    const [postalCode, setPostalCode] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [deliveryType, setDeliveryType] = useState(item?.delivery_type || 'pickup');
    const [loading, setLoading] = useState(false);

    // Inicializa com as fotos existentes ou array vazio
    const [photos, setPhotos] = useState(() => {
        const existingPhotos = item?.photos || (item?.photo_url ? [item.photo_url] : []);
        return [
            existingPhotos[0] ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${existingPhotos[0]}` : null,
            existingPhotos[1] ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${existingPhotos[1]}` : null,
            existingPhotos[2] ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${existingPhotos[2]}` : null,
        ];
    });

    const [photoPaths, setPhotoPaths] = useState(() => {
        const existingPhotos = item?.photos || (item?.photo_url ? [item.photo_url] : []);
        return [
            existingPhotos[0] || null,
            existingPhotos[1] || null,
            existingPhotos[2] || null,
        ];
    });

    const [newPhotos, setNewPhotos] = useState([false, false, false]);

    // Validação do item após hooks
    useEffect(() => {
        if (!item) {
            Alert.alert('Error', 'Item não encontrado');
            navigation.goBack();
        }
    }, [item, navigation]);

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
            const newPhotosArray = [...photos];
            newPhotosArray[index] = result.assets[0].uri;
            setPhotos(newPhotosArray);

            const newPhotosFlags = [...newPhotos];
            newPhotosFlags[index] = true;
            setNewPhotos(newPhotosFlags);
        }
    };

    const removePhoto = (index) => {
        const newPhotosArray = [...photos];
        newPhotosArray[index] = null;
        setPhotos(newPhotosArray);

        const newPathsArray = [...photoPaths];
        newPathsArray[index] = null;
        setPhotoPaths(newPathsArray);
    };

    // URL da foto atual - removida pois agora usamos array

    const uploadImage = async (uri) => {
        console.log('🔵 Iniciando upload da nova imagem...');
        setLoading(true);

        const user = session.user;

        if (!user) {
            console.error('❌ Erro: Usuário não está logado');
            Alert.alert('Error de Sesión', 'El usuario no está conectado.');
            setLoading(false);
            return null;
        }

        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const filePath = `${user.id}/${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from('item_photos')
                .upload(filePath, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (error) {
                console.error("❌ ERRO NO UPLOAD DO STORAGE:", error.message);
                Alert.alert('Error en la Carga', 'Error al subir la imagen: ' + error.message);
                setLoading(false);
                return null;
            }

            console.log('✅ Upload concluído com sucesso!', data.path);
            setLoading(false);
            return data.path;
        } catch (err) {
            console.error('❌ Exceção durante upload:', err);
            Alert.alert('Error', 'Error inesperado durante la carga: ' + err.message);
            setLoading(false);
            return null;
        }
    };

    async function handleUpdate() {
        console.log('🔵 Iniciando atualização do item...');

        // Verificar se há pelo menos uma foto
        const hasAtLeastOnePhoto = photos.some(photo => photo !== null);

        if (!title || !description || !pricePerDay || !location || !hasAtLeastOnePhoto) {
            Alert.alert('Campos Incompletos', 'Por favor, completa todos los campos y añade al menos una foto');
            return;
        }

        setLoading(true);
        const finalPhotoPaths = [...photoPaths];

        // Fazer upload das novas fotos
        for (let i = 0; i < photos.length; i++) {
            if (newPhotos[i] && photos[i]) {
                console.log(`🔵 Nova foto ${i + 1} selecionada, fazendo upload...`);
                const uploadedPath = await uploadImage(photos[i]);
                if (uploadedPath) {
                    // Deletar foto antiga se existir
                    if (photoPaths[i]) {
                        try {
                            await supabase.storage
                                .from('item_photos')
                                .remove([photoPaths[i]]);
                            console.log(`✅ Foto antiga ${i + 1} deletada`);
                        } catch (err) {
                            console.log(`⚠️ Não foi possível deletar a foto antiga ${i + 1}:`, err);
                        }
                    }
                    finalPhotoPaths[i] = uploadedPath;
                }
            } else if (!photos[i]) {
                // Se a foto foi removida, deletar do storage
                if (photoPaths[i]) {
                    try {
                        await supabase.storage
                            .from('item_photos')
                            .remove([photoPaths[i]]);
                        console.log(`✅ Foto ${i + 1} removida do storage`);
                    } catch (err) {
                        console.log(`⚠️ Erro ao remover foto ${i + 1}:`, err);
                    }
                }
                finalPhotoPaths[i] = null;
            }
        }

        // Filtrar apenas fotos não nulas
        const validPhotoPaths = finalPhotoPaths.filter(path => path !== null);

        console.log('🔵 Atualizando dados na tabela items...');

        const { data, error } = await supabase
            .from('items')
            .update({
                title: title,
                description: description,
                price_per_day: parseFloat(pricePerDay),
                category: category,
                location: location,
                location_full: locationFull,
                location_approx: locationApprox,
                coordinates: coordinates,
                coordinates_approx: coordinates ? addRandomOffset(coordinates) : null,
                photo_url: validPhotoPaths[0] || null, // Primeira foto como principal
                photos: validPhotoPaths, // Array com todas as fotos
                delivery_type: deliveryType,
            })
            .eq('id', item.id)
            .eq('owner_id', session.user.id); // Garante que só o dono pode editar

        setLoading(false);

        if (error) {
            console.error("❌ ERRO DE ATUALIZAÇÃO NO SUPABASE:", error);
            Alert.alert('Error al Actualizar', error.message);
        } else {
            console.log('✅ Item atualizado com sucesso!', data);
            Alert.alert('¡Éxito!', '¡Tu artículo ha sido actualizado!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                }
            ]);
        }
    }

    async function handleDelete() {
        Alert.alert(
            'Confirmar Eliminación',
            '¿Estás seguro de que deseas eliminar este artículo?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);

                        // Deletar todas as fotos do storage
                        const photosToDelete = item.photos || (item.photo_url ? [item.photo_url] : []);
                        if (photosToDelete.length > 0) {
                            try {
                                await supabase.storage
                                    .from('item_photos')
                                    .remove(photosToDelete);
                                console.log('✅ Fotos deletadas');
                            } catch (err) {
                                console.log('⚠️ Erro ao deletar fotos:', err);
                            }
                        }

                        // Deletar o item do banco
                        const { error } = await supabase
                            .from('items')
                            .delete()
                            .eq('id', item.id)
                            .eq('owner_id', session.user.id);

                        setLoading(false);

                        if (error) {
                            Alert.alert('Error al Eliminar', error.message);
                        } else {
                            Alert.alert('¡Eliminado!', 'Artículo eliminado con éxito.', [
                                {
                                    text: 'OK',
                                    onPress: () => navigation.goBack()
                                }
                            ]);
                        }
                    }
                }
            ]
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header com Botão Voltar */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Editar Artículo</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.container}>

                <Text style={styles.label}>Título del Anuncio</Text>
                <TextInput
                    style={styles.input}
                    onChangeText={setTitle}
                    value={title}
                    placeholder="Ej: Taladro Bosch 18V - Alquiler"
                    maxLength={80}
                />

                <Text style={styles.label}>Descripción Completa</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    onChangeText={setDescription}
                    value={description}
                    placeholder="Detalla el estado del artículo, accesorios y reglas de uso."
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

                <Text style={styles.label}>Precio de Alquiler por Día (€)</Text>
                <TextInput
                    style={styles.input}
                    onChangeText={setPricePerDay}
                    value={pricePerDay}
                    placeholder="Ej: 50.00"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Ubicación de Recogida</Text>
                <Text style={styles.sublabel}>Introduce el código postal para buscar la dirección</Text>

                <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                        setPostalCode(text);
                        searchAddressByPostalCode(text);
                    }}
                    value={postalCode}
                    placeholder="Ej: 28001"
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

                {location !== '' && (
                    <View style={styles.selectedLocationContainer}>
                        <Text style={styles.selectedLocationLabel}>Dirección seleccionada:</Text>
                        <View style={styles.selectedLocationBox}>
                            <Text style={styles.selectedLocationIcon}>📍</Text>
                            <Text style={styles.selectedLocationText}>{location}</Text>
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
                        </View>
                    </View>
                )}

                {/* Tipo de Entrega */}
                <Text style={styles.label}>Tipo de Entrega</Text>
                <View style={styles.deliveryTypeContainer}>
                    <TouchableOpacity
                        style={[
                            styles.deliveryOption,
                            deliveryType === 'pickup' && styles.deliveryOptionActive
                        ]}
                        onPress={() => setDeliveryType('pickup')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.deliveryOptionIcon}>📍</Text>
                        <Text style={[
                            styles.deliveryOptionText,
                            deliveryType === 'pickup' && styles.deliveryOptionTextActive
                        ]}>
                            Retira en Lugar
                        </Text>
                        {deliveryType === 'pickup' && (
                            <View style={styles.deliveryCheckmark}>
                                <Text style={styles.deliveryCheckmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.deliveryOption,
                            deliveryType === 'delivery' && styles.deliveryOptionActive
                        ]}
                        onPress={() => setDeliveryType('delivery')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.deliveryOptionIcon}>🚚</Text>
                        <Text style={[
                            styles.deliveryOptionText,
                            deliveryType === 'delivery' && styles.deliveryOptionTextActive
                        ]}>
                            Entrego en Casa
                        </Text>
                        {deliveryType === 'delivery' && (
                            <View style={styles.deliveryCheckmark}>
                                <Text style={styles.deliveryCheckmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.deliveryOption,
                            deliveryType === 'both' && styles.deliveryOptionActive
                        ]}
                        onPress={() => setDeliveryType('both')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.deliveryOptionIcon}>🔄</Text>
                        <Text style={[
                            styles.deliveryOptionText,
                            deliveryType === 'both' && styles.deliveryOptionTextActive
                        ]}>
                            Ambas Opciones
                        </Text>
                        {deliveryType === 'both' && (
                            <View style={styles.deliveryCheckmark}>
                                <Text style={styles.deliveryCheckmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Fotos del Artículo (até 3) */}
                <Text style={styles.label}>Fotos del Artículo (hasta 3)</Text>
                <Text style={styles.sublabel}>La primera foto será la principal</Text>

                <View style={styles.photosGrid}>
                    {photos.map((photo, index) => (
                        <View key={index} style={styles.photoContainer}>
                            <TouchableOpacity
                                onPress={() => pickImage(index)}
                                style={[
                                    styles.photoPlaceholder,
                                    index === 0 && styles.photoPlaceholderPrimary
                                ]}
                            >
                                {photo ? (
                                    <>
                                        <Image
                                            source={{ uri: photo }}
                                            style={styles.previewImage}
                                        />
                                        <TouchableOpacity
                                            style={styles.removePhotoButton}
                                            onPress={() => removePhoto(index)}
                                        >
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

                {/* Botão Guardar Cambios */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleUpdate}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                    >
                        {loading ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.buttonText}>Guardando...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonIcon}>💾</Text>
                                <Text style={styles.buttonText}>Guardar Cambios</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Botão Eliminar Artículo */}
                <TouchableOpacity
                    style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
                    onPress={handleDelete}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? ['#95a5a6', '#7f8c8d'] : ['#dc3545', '#c82333']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.deleteButtonGradient}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonIcon}>🗑️</Text>
                            <Text style={styles.buttonText}>Eliminar Artículo</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 50 }} />
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
    headerSpacer: {
        width: 40,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F8F9FA',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
    },
    sublabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
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
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        overflow: 'hidden',
        position: 'relative',
    },
    photoPlaceholderPrimary: {
        borderColor: '#2c4455',
        borderWidth: 2,
        borderStyle: 'solid',
    },
    addPhotoContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPhotoIcon: {
        fontSize: 30,
        marginBottom: 5,
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
        borderRadius: 8,
        resizeMode: 'cover',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    removePhotoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    primaryBadge: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: 'rgba(44, 68, 85, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
    },

    deliveryTypeContainer: {
        marginBottom: 20,
        gap: 12,
    },
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        position: 'relative',
    },
    deliveryOptionActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2c4455',
    },
    deliveryOptionIcon: {
        fontSize: 24,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2c4455',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    saveButton: {
        marginTop: 30,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        marginBottom: 10,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    deleteButtonDisabled: {
        opacity: 0.7,
    },
    deleteButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    buttonIcon: {
        fontSize: 24,
    },
    buttonText: {
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
        marginBottom: 10,
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
        marginBottom: 15,
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
        marginBottom: 15,
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
