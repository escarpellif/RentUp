import { supabase } from '../../supabase';
import { Alert } from 'react-native';

/**
 * Verifica se o usuário tem verificação aprovada
 * @param {string} userId - ID do usuário
 * @returns {Promise<{isVerified: boolean, status: string}>}
 */
export async function checkUserVerification(userId) {
    try {
        console.log('[checkUserVerification] Verificando usuário:', userId);

        if (!userId) {
            console.error('[checkUserVerification] UserId não fornecido');
            return { isVerified: false, status: 'error' };
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('verification_status')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[checkUserVerification] Erro ao buscar perfil:', error);
            throw error;
        }

        if (!profile) {
            console.error('[checkUserVerification] Perfil não encontrado');
            return { isVerified: false, status: 'not_submitted' };
        }

        console.log('[checkUserVerification] Status do perfil:', profile.verification_status);

        // Se o perfil NÃO está aprovado, verificar se há verificação aprovada em user_verifications
        if (profile.verification_status !== 'approved') {
            const { data: verification, error: verError } = await supabase
                .from('user_verifications')
                .select('status')
                .eq('user_id', userId)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .single();

            // Se encontrou uma verificação aprovada, sincronizar o perfil
            if (!verError && verification?.status === 'approved') {
                try {
                    await supabase
                        .from('profiles')
                        .update({ verification_status: 'approved' })
                        .eq('id', userId);

                    console.log('Verificação sincronizada com sucesso para usuario:', userId);
                    return { isVerified: true, status: 'approved' };
                } catch (updateError) {
                    console.error('Erro ao sincronizar verificação:', updateError);
                    // Mesmo se falhar o update, retorna que está aprovado
                    return { isVerified: true, status: 'approved' };
                }
            }
        }

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
                'Tu documentación está siendo revisada. Tu solicitud será aprobada lo más rápido posible.',
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

        case 'error':
            Alert.alert(
                'Error de Conexión',
                'No pudimos verificar tu estado. Por favor, verifica tu conexión a internet e intenta de nuevo.',
                [{ text: 'Entendido' }]
            );
            break;

        default:
            console.warn('[handleVerificationAlert] Status desconocido:', status);
            Alert.alert(
                'Error',
                'Hubo un problema al verificar tu estado. Por favor intenta de nuevo o contacta soporte.',
                [{ text: 'Entendido' }]
            );
    }
}

