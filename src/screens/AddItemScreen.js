import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Button, Alert, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';


export default function AddItemScreen({ session }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [category, setCategory] = useState('Herramientas');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [photoUri, setPhotoUri] = useState(null); // URI local da foto selecionada
    const [photoPath, setPhotoPath] = useState(null); // Caminho da foto no Supabase Storage

    const categories = ['Herramientas', 'Electrónicos', 'Deportes', 'Moda', 'Vehículos', 'Otros'];

    // ----------------------------------------------------
    // LÓGICA DE SELEÇÃO DA IMAGEM
    // ----------------------------------------------------
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri); // Salva a URI local para visualização
        }
    };

    // ----------------------------------------------------
    // LÓGICA DE UPLOAD PARA O SUPABASE STORAGE
    // ----------------------------------------------------
    const uploadImage = async (uri) => {
        console.log('🔵 Iniciando upload da imagem...');
        setLoading(true);

        // 1. OBTENÇÃO CORRETA DO ID DO USUÁRIO
        const user = session.user;

        // VERIFICAÇÃO CRÍTICA
        if (!user) {
            console.error('❌ Erro: Usuário não está logado');
            Alert.alert('Error de Sesión', 'El usuario no está conectado.');
            setLoading(false);
            return null;
        }

        console.log('✅ Usuário logado:', user.id);

        try {
            console.log('🔵 Lendo arquivo como base64...');
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            console.log('✅ Arquivo convertido para base64, tamanho:', base64.length);

            // Define o caminho do arquivo: user_id/timestamp.jpg
            const filePath = `${user.id}/${Date.now()}.jpg`;
            console.log('🔵 Caminho do arquivo no storage:', filePath);

            // 3. Faz o upload!
            console.log('🔵 Enviando para Supabase Storage...');
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

    // ----------------------------------------------------
    // FUNÇÃO PRINCIPAL DE SUBMISSÃO (AGORA INTEGRADA)
    // ----------------------------------------------------
    async function handleSubmit() {
        console.log('🔵 Iniciando handleSubmit...');

        if (!title || !description || !pricePerDay || !location || !photoUri) {
            Alert.alert('Completa Todos los Campos', '¡Recuerda añadir una foto!');
            return;
        }

        console.log('✅ Todos os campos preenchidos');
        setLoading(true);
        let uploadedPath = null;

        // 1. FAZ O UPLOAD DA IMAGEM
        if (photoUri) {
            console.log('🔵 Iniciando upload da foto...');
            uploadedPath = await uploadImage(photoUri);
        }

        if (!uploadedPath) {
            console.log('❌ Upload falhou, abortando submissão');
            setLoading(false);
            return;
        }

        console.log('🔵 Inserindo dados na tabela items...');
        console.log('📋 Dados:', {
            owner_id: session.user.id,
            title,
            description,
            price_per_day: parseFloat(pricePerDay),
            category,
            location,
            photo_url: uploadedPath
        });

        // 2. INSERE OS DADOS NA TABELA 'items'
        const { data, error } = await supabase
            .from('items')
            .insert({
                owner_id: session.user.id,
                title: title,
                description: description,
                price_per_day: parseFloat(pricePerDay),
                category: category,
                location: location,
                photo_url: uploadedPath,
            });

        setLoading(false);

        if (error) {
            console.error("❌ ERRO DE INSERÇÃO NO SUPABASE:", error);
            Alert.alert('Error al Anunciar', error.message);
        } else {
            console.log('✅ Item inserido com sucesso!', data);
            Alert.alert('¡Éxito!', '¡Tu artículo ha sido anunciado en el marketplace!');
            // 3. LIMPA O FORMULÁRIO
            setTitle('');
            setDescription('');
            setPricePerDay('');
            setLocation('');
            setPhotoUri(null);
            setPhotoPath(null);
        }
    }


    // Monta a URL pública da foto para visualização
    const photoPreviewUrl = photoPath
        ? `${SUPABASE_URL}/storage/v1/object/public/item_photos/${photoPath}`
        : photoUri; // Se ainda não subiu, usa a URI local

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Anunciar Nuevo Artículo</Text>

            {/* 1. Título do Item */}
            <Text style={styles.label}>Título del Anuncio (Corto y Atractivo)</Text>
            <TextInput
                style={styles.input}
                onChangeText={setTitle}
                value={title}
                placeholder="Ej: Taladro Bosch 18V - Alquiler"
                maxLength={80}
            />

            {/* 2. Descrição */}
            <Text style={styles.label}>Descripción Completa</Text>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                onChangeText={setDescription}
                value={description}
                placeholder="Detalla el estado del artículo, accesorios y reglas de uso."
                multiline
                numberOfLines={4}
            />

            {/* 3. Categoria */}
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

            {/* 4. Preço por Dia */}
            <Text style={styles.label}>Precio de Alquiler por Día (€)</Text>
            <TextInput
                style={styles.input}
                onChangeText={setPricePerDay}
                value={pricePerDay}
                placeholder="Ej: 50.00"
                keyboardType="numeric"
            />

            {/* 5. Localização */}
            <Text style={styles.label}>Tu Ubicación de Recogida (Ciudad/Barrio)</Text>
            <TextInput
                style={styles.input}
                onChangeText={setLocation}
                value={location}
                placeholder="Ej: Dubai Marina o São Paulo - Pinheiros"
            />

            {/* 6. Botão e Preview da Foto */}
            <Text style={styles.label}>Foto Principal del Artículo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.photoPlaceholder}>
                {photoUri ? (
                    <Image
                        source={{ uri: photoUri }}
                        style={styles.previewImage}
                    />
                ) : (
                    <Text style={{color: 'gray'}}>Haz clic para seleccionar la foto</Text>
                )}
            </TouchableOpacity>

            <Button
                title={loading ? 'Procesando...' : 'Anunciar Artículo'}
                onPress={handleSubmit}
                disabled={loading}
            />

            <View style={{height: 50}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
        borderStyle: 'dashed',
        borderRadius: 5,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
        resizeMode: 'cover', // Para garantir que a imagem preencha o espaço
    },
});