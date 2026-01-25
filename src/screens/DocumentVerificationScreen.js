import React, { useState } from 'react';
import { View, ScrollView, Alert , StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import PermissionManager from '../utils/PermissionManager';

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
        try {
            // Usar PermissionManager para pedir permissão com explicação
            const hasPermission = await PermissionManager.requestPhotoLibrary('verification', {
                screen: 'DocumentVerification',
                action: 'pickDocument'
            });

            if (!hasPermission) {
                return; // Usuário negou ou cancelou
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            // Compatibilidade com diferentes formatos de retorno (sdk versões antigas e novas)
            if (result) {
                console.log('ImagePicker result:', result?.canceled ?? result?.cancelled ? 'cancelled' : 'selected');
                // nova forma: result.canceled (boolean) e result.assets (array)
                if (result.canceled === false && Array.isArray(result.assets) && result.assets.length > 0) {
                    setDocumentPhoto(result.assets[0].uri);
                    return;
                }

                // forma antiga: result.cancelled (boolean) e result.uri
                if (result.cancelled === false && result.uri) {
                    setDocumentPhoto(result.uri);
                    return;
                }

                // fallback: se houver assets e uri
                if (result.assets && result.assets[0] && result.assets[0].uri) {
                    setDocumentPhoto(result.assets[0].uri);
                    return;
                }
            }
        } catch (err) {
            console.error('Error picking document photo:', err);
            Alert.alert(
                '📷 Error con la Foto',
                'No se pudo acceder a la galería. Por favor:\n\n• Verifica los permisos de ALUKO\n• Intenta tomar una foto con la cámara\n• Asegúrate de tener espacio disponible',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Intentar Nuevamente', onPress: () => pickDocument() }
                ]
            );
        }
    };

    const takeSelfie = async () => {
        // Usar PermissionManager para pedir permissão com explicação
        const hasPermission = await PermissionManager.requestCamera('verification', {
            screen: 'DocumentVerification',
            action: 'takeSelfie'
        });

        if (!hasPermission) {
            return; // Usuário negou ou cancelou
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result) {
            if (result.canceled === false && Array.isArray(result.assets) && result.assets.length > 0) {
                setSelfiePhoto(result.assets[0].uri);
                return;
            }
            if (result.cancelled === false && result.uri) {
                setSelfiePhoto(result.uri);
                return;
            }
            if (result.assets && result.assets[0] && result.assets[0].uri) {
                setSelfiePhoto(result.assets[0].uri);
                return;
            }
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
                'Tu documentación está en proceso de revisión. Tu solicitud será aprobada lo más rápido posible.',
                [
                    {
                        text: 'Entendido',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error al enviar verificación:', error);
            Alert.alert(
                '🔐 Error de Verificación',
                'No pudimos enviar tu verificación en este momento. Tus fotos están seguras.\n\nPor favor:\n• Verifica tu conexión\n• Asegúrate de que las fotos sean claras\n• Intenta nuevamente en unos minutos',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Intentar Nuevamente', onPress: () => submitVerification() }
                ]
            );
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
