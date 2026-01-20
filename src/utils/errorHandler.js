// ============================================
// ERROR HANDLER UTILITY
// Funções para tratamento centralizado de erros
// ============================================

import { Alert } from 'react-native';

/**
 * Trata erros de API de forma amigável
 * @param {Error} error - Objeto de erro
 * @param {Function} retryFn - Função para tentar novamente (opcional)
 */
export const handleApiError = (error, retryFn = null) => {
    console.error('API Error:', error);

    let title = 'Error';
    let message = 'Algo deu errado. Tente novamente.';
    let buttons = [];

    // Erros de rede
    if (
        error.message?.includes('network') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network request failed') ||
        error.code === 'NETWORK_ERROR'
    ) {
        title = '📡 Problema de Conexión';
        message = 'Verifica tu conexión a internet e intenta nuevamente.';
    }
    // Timeout
    else if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
        title = '⏱️ Tiempo Agotado';
        message = 'La solicitud tardó demasiado. Intenta nuevamente.';
    }
    // Erro de autenticação
    else if (error.code === 'PGRST301' || error.status === 401) {
        title = '🔒 Sesión Expirada';
        message = 'Por favor, inicia sesión nuevamente.';
    }
    // Serviço indisponível
    else if (error.code === 'PGRST116' || error.status === 503) {
        title = '🔧 Servicio No Disponible';
        message = 'El servicio está temporalmente fuera de línea. Intenta más tarde.';
    }
    // Erro de permissão
    else if (error.code === '42501' || error.status === 403) {
        title = '⛔ Sin Permiso';
        message = 'No tienes permiso para realizar esta acción.';
    }
    // Dados não encontrados
    else if (error.code === 'PGRST116' || error.status === 404) {
        title = '🔍 No Encontrado';
        message = 'Los datos solicitados no fueron encontrados.';
    }
    // Erro genérico com mensagem
    else if (error.message) {
        message = error.message;
    }

    // Botões
    if (retryFn) {
        buttons = [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Intentar Nuevamente', onPress: retryFn }
        ];
    } else {
        buttons = [{ text: 'OK' }];
    }

    Alert.alert(title, message, buttons);
};

/**
 * Trata erros silenciosamente (apenas log)
 * @param {Error} error - Objeto de erro
 * @param {string} context - Contexto do erro
 */
export const logError = (error, context = '') => {
    console.error(`[${context}] Error:`, error);

    // Aqui você pode adicionar envio para serviço de analytics
    // Ex: Sentry, Firebase Crashlytics, etc.
};

/**
 * Verifica se o erro é de rede
 * @param {Error} error - Objeto de erro
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
    return (
        error.message?.includes('network') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network request failed') ||
        error.code === 'NETWORK_ERROR'
    );
};

/**
 * Verifica se o erro é de timeout
 * @param {Error} error - Objeto de erro
 * @returns {boolean}
 */
export const isTimeoutError = (error) => {
    return (
        error.message?.includes('timeout') ||
        error.message?.includes('Request timeout')
    );
};

/**
 * Mostra toast de erro rápido (não intrusivo)
 * Nota: Requer biblioteca de toast (ex: react-native-toast-message)
 * @param {string} message - Mensagem de erro
 */
export const showErrorToast = (message) => {
    // Placeholder - implementar quando adicionar biblioteca de toast
    console.warn('Toast Error:', message);
    // Toast.show({ type: 'error', text1: 'Error', text2: message });
};

/**
 * Wrapper para executar função com tratamento de erro
 * @param {Function} fn - Função a executar
 * @param {Function} errorHandler - Handler personalizado (opcional)
 */
export const withErrorHandling = async (fn, errorHandler = handleApiError) => {
    try {
        return await fn();
    } catch (error) {
        errorHandler(error);
        throw error;
    }
};

