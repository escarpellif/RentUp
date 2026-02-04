import 'react-native-url-polyfill/auto'; // Garante compatibilidade de URL para RN
import {createClient} from '@supabase/supabase-js';
// import { Platform } from 'react-native'; // COMENTADO TEMPORARIAMENTE
import Constants from 'expo-constants';

// 🔒 CHAVES PROTEGIDAS - Carregadas de variáveis de ambiente
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validação de segurança
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ ERRO DE CONFIGURAÇÃO: Chaves do Supabase não encontradas! Verifique o arquivo .env');
}

// ⚠️ VERSÃO TEMPORÁRIA: Storage adapter SEM persistência
// Isso significa que o usuário terá que fazer login toda vez
const createStorageAdapter = () => {
    const memoryStorage = {};

    return {
        getItem: async (key) => {
            console.log('🔍 [DEBUG] Storage getItem:', key);
            return memoryStorage[key] || null;
        },
        setItem: async (key, value) => {
            console.log('💾 [DEBUG] Storage setItem:', key);
            memoryStorage[key] = value;
        },
        removeItem: async (key) => {
            console.log('🗑️ [DEBUG] Storage removeItem:', key);
            delete memoryStorage[key];
        },
    };
};

// Configuração do cliente Supabase
// ⚠️ VERSÃO TEMPORÁRIA: Usando storage em memória (não persiste entre sessões)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: false, // DESABILITADO temporariamente
        detectSessionInUrl: false,
    },
});

