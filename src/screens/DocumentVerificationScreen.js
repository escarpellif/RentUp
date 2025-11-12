import React, { useState } from 'react';
import { View, ScrollView, Alert , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// Components
import VerificationHeader from '../components/VerificationHeader';
import VerificationInfoCard from '../components/VerificationInfoCard';
import DocumentTypeSelector from '../components/DocumentTypeSelector';
import DocumentNumberInput from '../components/DocumentNumberInput';
import PhotoUploadButton from '../components/PhotoUploadButton';
import SubmitVerificationButton from '../components/SubmitVerificationButton';

// Styles
import { documentVerificationStyles as styles } from '../styles/documentVerificationStyles';

export default function DocumentVerificationScreen({ navigation, session }) {
    const [documentType, setDocumentType] = useState('dni'); // dni, passport, driver_license
    const [documentNumber, setDocumentNumber] = useState('');
    const [documentPhoto, setDocumentPhoto] = useState(null);
    const [selfiePhoto, setSelfiePhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickDocumentPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setDocumentPhoto(result.assets[0].uri);
        }
    };

    const takeSelfie = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para tomar tu selfie.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelfiePhoto(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri, folder) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const filePath = `${session.user.id}/${folder}/${Date.now()}.jpg`;
            
            const { data, error } = await supabase.storage
                .from('verification_docs')
                .upload(filePath, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (error) throw error;
            return data.path;
        } catch (err) {
            console.error('Error uploading image:', err);
            throw err;
        }
    };

    const handleSubmitVerification = async () => {
        if (!documentNumber || !documentPhoto || !selfiePhoto) {
            Alert.alert('Campos incompletos', 'Por favor completa todos los campos y sube las fotos requeridas.');
            return;
        }

        setLoading(true);

        try {
            // Upload das fotos
            const documentPhotoPath = await uploadImage(documentPhoto, 'documents');
            const selfiePhotoPath = await uploadImage(selfiePhoto, 'selfies');

            // Salvar verificação no banco
            const { error } = await supabase
                .from('user_verifications')
                .insert({
                    user_id: session.user.id,
                    document_type: documentType,
                    document_number: documentNumber,
                    document_photo: documentPhotoPath,
                    selfie_photo: selfiePhotoPath,
                    status: 'pending', // pending, approved, rejected
                    submitted_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Atualizar perfil do usuário
            await supabase
                .from('profiles')
                .update({ verification_status: 'pending' })
                .eq('id', session.user.id);

            Alert.alert(
                '¡Verificación enviada!',
                'Tu documentación está en proceso de revisión. Te notificaremos cuando sea aprobada (generalmente en 24-48 horas).',
                [
                    {
                        text: 'Entendido',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error al enviar verificación:', error);
            Alert.alert('Error', 'Hubo un problema al enviar tu verificación. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            
            <VerificationHeader onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <VerificationInfoCard />

                <DocumentTypeSelector
                    documentType={documentType}
                    onSelect={setDocumentType}
                />

                <DocumentNumberInput
                    value={documentNumber}
                    onChangeText={setDocumentNumber}
                />

                <PhotoUploadButton
                    title="📸 Foto del Documento"
                    subtitle="Sube una foto clara de tu documento"
                    icon="📷"
                    hasPhoto={documentPhoto}
                    onPress={pickDocumentPhoto}
                />

                <PhotoUploadButton
                    title="🤳 Selfie con Documento"
                    subtitle="Toma una selfie sosteniendo tu documento"
                    icon="📸"
                    hasPhoto={selfiePhoto}
                    onPress={takeSelfie}
                />

                <SubmitVerificationButton
                    loading={loading}
                    onPress={handleSubmitVerification}
                />

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

