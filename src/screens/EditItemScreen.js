import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Button, Alert, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function EditItemScreen({ route, navigation, session }) {
    const { item } = route.params;
    
    const [title, setTitle] = useState(item.title);
    const [description, setDescription] = useState(item.description);
    const [pricePerDay, setPricePerDay] = useState(item.price_per_day.toString());
    const [category, setCategory] = useState(item.category);
    const [location, setLocation] = useState(item.location);
    const [loading, setLoading] = useState(false);
    const [photoUri, setPhotoUri] = useState(null);
    const [photoPath, setPhotoPath] = useState(item.photo_url);

    const categories = ['Herramientas', 'Electrónicos', 'Deportes', 'Moda', 'Vehículos', 'Otros'];

    // URL da foto atual
    const currentPhotoUrl = `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`;

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri);
        }
    };

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

        if (!title || !description || !pricePerDay || !location) {
            Alert.alert('Campos Incompletos', 'Por favor, completa todos los campos');
            return;
        }

        setLoading(true);
        let newPhotoPath = photoPath;

        // Se o usuário selecionou uma nova foto, faz upload
        if (photoUri) {
            console.log('🔵 Nova foto selecionada, fazendo upload...');
            const uploadedPath = await uploadImage(photoUri);
            if (uploadedPath) {
                newPhotoPath = uploadedPath;
                
                // Opcional: deletar a foto antiga
                try {
                    await supabase.storage
                        .from('item_photos')
                        .remove([item.photo_url]);
                    console.log('✅ Foto antiga deletada');
                } catch (err) {
                    console.log('⚠️ Não foi possível deletar a foto antiga:', err);
                }
            }
        }

        console.log('🔵 Atualizando dados na tabela items...');

        const { data, error } = await supabase
            .from('items')
            .update({
                title: title,
                description: description,
                price_per_day: parseFloat(pricePerDay),
                category: category,
                location: location,
                photo_url: newPhotoPath,
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

                        // Deletar a foto do storage
                        try {
                            await supabase.storage
                                .from('item_photos')
                                .remove([item.photo_url]);
                            console.log('✅ Foto deletada');
                        } catch (err) {
                            console.log('⚠️ Erro ao deletar foto:', err);
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
            <StatusBar barStyle="dark-content" />
            {/* Botão Voltar em Círculo */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButtonCircle}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container}>
                <Text style={styles.header}>Editar Artículo</Text>

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
                <TextInput
                    style={styles.input}
                    onChangeText={setLocation}
                    value={location}
                    placeholder="Ej: Lisboa - Chiado"
                />

                <Text style={styles.label}>Foto Principal del Artículo</Text>
                <TouchableOpacity onPress={pickImage} style={styles.photoPlaceholder}>
                    {photoUri ? (
                        <Image
                            source={{ uri: photoUri }}
                            style={styles.previewImage}
                        />
                    ) : (
                        <Image
                            source={{ uri: currentPhotoUrl }}
                            style={styles.previewImage}
                        />
                    )}
                    <Text style={styles.changePhotoText}>Toca para cambiar la foto</Text>
                </TouchableOpacity>

                <Button
                    title={loading ? 'Guardando...' : 'Guardar Cambios'}
                    onPress={handleUpdate}
                    disabled={loading}
                />

                <View style={{ marginTop: 20, marginBottom: 10 }}>
                    <Button
                        title="Eliminar Artículo"
                        onPress={handleDelete}
                        disabled={loading}
                        color="#dc3545"
                    />
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007bff',
        elevation: 2,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    backArrow: {
        fontSize: 18,
        color: '#fff',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
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
    photoPlaceholder: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
        resizeMode: 'cover',
    },
    changePhotoText: {
        position: 'absolute',
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: 5,
        borderRadius: 5,
        fontSize: 12,
    },
});
