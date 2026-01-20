// ============================================
// NETWORK STATUS DETECTOR
// Hook para detectar status de conexão de internet
// ============================================

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook personalizado para monitorar status de conexão de internet
 * @returns {boolean} isConnected - true se conectado, false se offline
 */
export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionType, setConnectionType] = useState('unknown');

    useEffect(() => {
        // Verificar status inicial
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected && state.isInternetReachable !== false);
            setConnectionType(state.type);
        });

        // Listener para mudanças de status
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected && state.isInternetReachable !== false;
            setIsConnected(connected);
            setConnectionType(state.type);

            // Log para debugging
            if (!connected) {
                console.log('📡 Internet desconectada');
            } else {
                console.log('📡 Internet conectada:', state.type);
            }
        });

        return () => unsubscribe();
    }, []);

    return { isConnected, connectionType };
};

/**
 * Função para verificar status de conexão uma única vez
 * @returns {Promise<boolean>} Status de conexão
 */
export const checkInternetConnection = async () => {
    try {
        const state = await NetInfo.fetch();
        return state.isConnected && state.isInternetReachable !== false;
    } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        return false;
    }
};

