// ============================================
// PERMISSION MANAGER
// Sistema centralizado para gerenciar permissões
// ============================================

import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Logger from '../services/LoggerService';

class PermissionManager {
    /**
     * Solicita permissão de localização com explicação
     */
    static async requestLocation(context = {}) {
        try {
            // 1. Verificar status atual
            const currentStatus = await Location.getForegroundPermissionsAsync();

            if (currentStatus.status === 'granted') {
                return true;
            }

            // 2. Se já negou permanentemente, mostrar configurações
            if (currentStatus.status === 'denied' && !currentStatus.canAskAgain) {
                this.showSettingsPrompt('location');
                return false;
            }

            // 3. Mostrar explicação ANTES de pedir
            const userWants = await new Promise((resolve) => {
                Alert.alert(
                    '📍 Itens Próximos a Você',
                    'Permita acesso à localização para:\n\n• Ver produtos disponíveis na sua região\n• Calcular distância até o vendedor\n• Encontrar itens para retirada local\n\nNão compartilhamos sua localização exata.\nVocê pode desativar isso a qualquer momento.',
                    [
                        {
                            text: 'Agora Não',
                            style: 'cancel',
                            onPress: () => resolve(false)
                        },
                        {
                            text: 'Permitir',
                            onPress: () => resolve(true)
                        }
                    ]
                );
            });

            if (!userWants) {
                Logger.info('Usuário optou por não permitir localização', context);
                return false;
            }

            // 4. Pedir permissão do sistema
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Logger.warn('Permissão de localização negada', { ...context, status });
                this.showSettingsPrompt('location');
                return false;
            }

            Logger.info('Permissão de localização concedida', context);
            return true;

        } catch (error) {
            Logger.error('Erro ao solicitar permissão de localização', context, error);
            return false;
        }
    }

    /**
     * Solicita permissão de câmera com explicação
     */
    static async requestCamera(purpose = 'verification', context = {}) {
        try {
            // 1. Verificar status atual
            const currentStatus = await ImagePicker.getCameraPermissionsAsync();

            if (currentStatus.status === 'granted') {
                return true;
            }

            // 2. Se já negou permanentemente, mostrar configurações
            if (currentStatus.status === 'denied' && !currentStatus.canAskAgain) {
                this.showSettingsPrompt('camera');
                return false;
            }

            // 3. Mensagem personalizada por propósito
            const messages = {
                verification: {
                    title: '📷 Verificação de Identidade',
                    message: 'Para manter a comunidade segura, precisamos:\n\n• Foto do seu documento (RG, CNH, etc)\n• Uma selfie sua\n\nSuas fotos são criptografadas e usadas apenas para verificação.\n\nEsto nos ajuda a prevenir fraudes e manter transações seguras.',
                },
                dispute: {
                    title: '📷 Registrar Evidência',
                    message: 'Para resolver a disputa, você pode tirar fotos que mostrem:\n\n• Estado do item\n• Danos ou problemas\n• Evidências relevantes\n\nIsso ajuda a resolver disputas de forma justa.',
                },
                default: {
                    title: '📷 Acesso à Câmera',
                    message: 'Precisamos acessar a câmera para tirar fotos.',
                }
            };

            const msg = messages[purpose] || messages.default;

            // 4. Mostrar explicação ANTES de pedir
            const userWants = await new Promise((resolve) => {
                Alert.alert(
                    msg.title,
                    msg.message,
                    [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPress: () => resolve(false)
                        },
                        {
                            text: 'Permitir',
                            onPress: () => resolve(true)
                        }
                    ]
                );
            });

            if (!userWants) {
                Logger.info('Usuário optou por não permitir câmera', { ...context, purpose });
                return false;
            }

            // 5. Pedir permissão do sistema
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Logger.warn('Permissão de câmera negada', { ...context, status, purpose });
                this.showSettingsPrompt('camera');
                return false;
            }

            Logger.info('Permissão de câmera concedida', { ...context, purpose });
            return true;

        } catch (error) {
            Logger.error('Erro ao solicitar permissão de câmera', context, error);
            return false;
        }
    }

    /**
     * Solicita permissão de galeria de fotos com explicação
     */
    static async requestPhotoLibrary(purpose = 'upload', context = {}) {
        try {
            // 1. Verificar status atual
            const currentStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

            if (currentStatus.status === 'granted') {
                return true;
            }

            // 2. Se já negou permanentemente, mostrar configurações
            if (currentStatus.status === 'denied' && !currentStatus.canAskAgain) {
                this.showSettingsPrompt('photos');
                return false;
            }

            // 3. Mensagem personalizada por propósito
            const messages = {
                verification: {
                    title: '🖼️ Escolher Foto do Documento',
                    message: 'Para fazer upload do seu documento de identificação, precisamos acessar suas fotos.\n\nVocê escolhe qual foto enviar.\nNenhuma outra foto será acessada.',
                },
                dispute: {
                    title: '🖼️ Escolher Foto de Evidência',
                    message: 'Para adicionar evidências à disputa, precisamos acessar suas fotos.\n\nVocê escolhe quais fotos enviar.',
                },
                default: {
                    title: '🖼️ Acessar Galeria',
                    message: 'Precisamos acessar suas fotos para você escolher uma imagem.',
                }
            };

            const msg = messages[purpose] || messages.default;

            // 4. Mostrar explicação ANTES de pedir
            const userWants = await new Promise((resolve) => {
                Alert.alert(
                    msg.title,
                    msg.message,
                    [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPress: () => resolve(false)
                        },
                        {
                            text: 'Permitir Acesso',
                            onPress: () => resolve(true)
                        }
                    ]
                );
            });

            if (!userWants) {
                Logger.info('Usuário optou por não permitir galeria', { ...context, purpose });
                return false;
            }

            // 5. Pedir permissão do sistema
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Logger.warn('Permissão de galeria negada', { ...context, status, purpose });
                this.showSettingsPrompt('photos');
                return false;
            }

            Logger.info('Permissão de galeria concedida', { ...context, purpose });
            return true;

        } catch (error) {
            Logger.error('Erro ao solicitar permissão de galeria', context, error);
            return false;
        }
    }

    /**
     * Mostra prompt para abrir configurações
     */
    static showSettingsPrompt(permissionType) {
        const messages = {
            location: {
                title: '⚙️ Localização Desativada',
                message: 'A permissão de localização está desativada nas configurações.\n\nPara ativar:\n1. Abra Configurações\n2. Toque em ALUKO\n3. Ative Localização',
            },
            camera: {
                title: '⚙️ Câmera Desativada',
                message: 'A permissão de câmera está desativada nas configurações.\n\nPara ativar:\n1. Abra Configurações\n2. Toque em ALUKO\n3. Ative Câmera',
            },
            photos: {
                title: '⚙️ Fotos Desativadas',
                message: 'A permissão de fotos está desativada nas configurações.\n\nPara ativar:\n1. Abra Configurações\n2. Toque em ALUKO\n3. Ative Fotos',
            },
        };

        const msg = messages[permissionType] || {
            title: '⚙️ Permissão Desativada',
            message: 'Esta permissão está desativada. Ative nas configurações do dispositivo.',
        };

        Alert.alert(
            msg.title,
            msg.message,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Abrir Configurações',
                    onPress: () => Linking.openSettings()
                }
            ]
        );
    }

    /**
     * Verifica se permissão está concedida (sem pedir)
     */
    static async hasLocationPermission() {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            return false;
        }
    }

    static async hasCameraPermission() {
        try {
            const { status } = await ImagePicker.getCameraPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            return false;
        }
    }

    static async hasPhotoLibraryPermission() {
        try {
            const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            return false;
        }
    }
}

export default PermissionManager;

