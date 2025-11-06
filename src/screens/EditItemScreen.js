import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Button, Alert, TouchableOpacity, Image } from 'react-native';
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

    const categories = ['Ferramentas', 'Eletrônicos', 'Esportes', 'Moda', 'Veículos', 'Outros'];

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
            Alert.alert('Erro de Sessão', 'Usuário não está logado.');
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
                Alert.alert('Erro no Upload', 'Falha ao subir a imagem: ' + error.message);
                setLoading(false);
                return null;
            }

            console.log('✅ Upload concluído com sucesso!', data.path);
            setLoading(false);
            return data.path;
        } catch (err) {
            console.error('❌ Exceção durante upload:', err);
            Alert.alert('Erro', 'Erro inesperado durante o upload: ' + err.message);
            setLoading(false);
            return null;
        }
    };

    async function handleUpdate() {
        console.log('🔵 Iniciando atualização do item...');

        if (!title || !description || !pricePerDay || !location) {
            Alert.alert('Preencha todos os campos');
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
            Alert.alert('Erro ao Atualizar', error.message);
        } else {
            console.log('✅ Item atualizado com sucesso!', data);
            Alert.alert('Sucesso!', 'Seu item foi atualizado!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                }
            ]);
        }
    }

    async function handleDelete() {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja deletar este item?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Deletar',
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
                            Alert.alert('Erro ao Deletar', error.message);
                        } else {
                            Alert.alert('Deletado!', 'Item removido com sucesso.', [
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
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Editar Item</Text>

            <Text style={styles.label}>Título do Anúncio</Text>
            <TextInput
                style={styles.input}
                onChangeText={setTitle}
                value={title}
                placeholder="Ex: Furadeira Bosch 18V - Aluguel"
                maxLength={80}
            />

            <Text style={styles.label}>Descrição Completa</Text>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                onChangeText={setDescription}
                value={description}
                placeholder="Detalhe o estado do item, acessórios e regras de uso."
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Categoria</Text>
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

            <Text style={styles.label}>Preço do Aluguel por Dia (€)</Text>
            <TextInput
                style={styles.input}
                onChangeText={setPricePerDay}
                value={pricePerDay}
                placeholder="Ex: 50.00"
                keyboardType="numeric"
            />

            <Text style={styles.label}>Localização de Retirada</Text>
            <TextInput
                style={styles.input}
                onChangeText={setLocation}
                value={location}
                placeholder="Ex: Lisboa - Chiado"
            />

            <Text style={styles.label}>Foto Principal do Item</Text>
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
                <Text style={styles.changePhotoText}>Toque para alterar foto</Text>
            </TouchableOpacity>

            <Button
                title={loading ? 'Salvando...' : 'Salvar Alterações'}
                onPress={handleUpdate}
                disabled={loading}
            />

            <View style={{ marginTop: 20, marginBottom: 10 }}>
                <Button
                    title="Deletar Item"
                    onPress={handleDelete}
                    disabled={loading}
                    color="#dc3545"
                />
            </View>

            <View style={{ height: 50 }} />
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

