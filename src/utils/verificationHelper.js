import { supabase } from '../../supabase';
import { Alert } from 'react-native';

/**
 * Verifica se o usuário tem verificação aprovada
 * @param {string} userId - ID do usuário
 * @returns {Promise<{isVerified: boolean, status: string}>}
 */
export async function checkUserVerification(userId) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('verification_status')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return {
            isVerified: profile.verification_status === 'approved',
            status: profile.verification_status || 'not_submitted'
        };
    } catch (error) {
        console.error('Error checking verification:', error);
        return { isVerified: false, status: 'error' };
    }
}

/**
 * Mostra alerta apropriado baseado no status de verificação
 * @param {string} status - Status da verificação
 * @param {function} navigation - Navigation object
 */
export function handleVerificationAlert(status, navigation) {
    switch (status) {
        case 'not_submitted':
            Alert.alert(
                'Verificación Requerida',
                'Para anunciar o alquilar artículos, necesitas verificar tu identidad primero.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Verificar Ahora',
                        onPress: () => navigation.navigate('DocumentVerification')
                    }
                ]
            );
            break;
        
        case 'pending':
            Alert.alert(
                'Verificación en Proceso',
                'Tu documentación está siendo revisada. Te notificaremos cuando sea aprobada (generalmente 24-48 horas).',
                [{ text: 'Entendido' }]
            );
            break;
        
        case 'rejected':
            Alert.alert(
                'Verificación Rechazada',
                'Tu verificación fue rechazada. Por favor, intenta de nuevo con documentos válidos.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Intentar de Nuevo',
                        onPress: () => navigation.navigate('DocumentVerification')
                    }
                ]
            );
            break;
        
        default:
            Alert.alert('Error', 'Hubo un problema al verificar tu estado. Por favor intenta de nuevo.');
    }
}

