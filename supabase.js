import 'react-native-url-polyfill/auto'; // Garante compatibilidade de URL para RN
import {createClient} from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 🔒 CHAVES PROTEGIDAS - Carregadas de variáveis de ambiente
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validação de segurança
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ ERRO DE CONFIGURAÇÃO: Chaves do Supabase não encontradas! Verifique o arquivo .env');
}

// Storage adapter para diferentes plataformas
const createStorageAdapter = () => {
    if (Platform.OS === 'web') {
        // Web: usar localStorage
        return {
            getItem: async (key) => {
                if (typeof window === 'undefined') return null;
                return window.localStorage.getItem(key);
            },
            setItem: async (key, value) => {
                if (typeof window === 'undefined') return;
                window.localStorage.setItem(key, value);
            },
            removeItem: async (key) => {
                if (typeof window === 'undefined') return;
                window.localStorage.removeItem(key);
            },
        };
    } else {
        // Native: usar AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return AsyncStorage;
    }
};

// Configuração do cliente Supabase
// Usa AsyncStorage no mobile e localStorage na web
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

