import 'react-native-url-polyfill/auto'; // Garante compatibilidade de URL para RN
import {createClient} from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 🔒 CHAVES PROTEGIDAS - Carregadas de variáveis de ambiente
// IMPORTANTE: No EAS Build, as variáveis vêm do Constants.expoConfig.extra
// Durante desenvolvimento local, vêm do .env via app.config.js

// Função helper para obter configuração de forma segura
const getConfig = () => {
  try {
    // Tentar pegar do expo config primeiro
    const url = Constants.expoConfig?.extra?.supabaseUrl;
    const key = Constants.expoConfig?.extra?.supabaseAnonKey;

    console.log('[Supabase Config] Tentando carregar do Constants.expoConfig');
    console.log('[Supabase Config] URL presente:', !!url);
    console.log('[Supabase Config] Key presente:', !!key);

    if (url && key) {
      return { url, key };
    }

    // Fallback: valores hardcoded para garantir que funcione
    console.warn('[Supabase Config] Usando fallback hardcoded');
    return {
      url: "https://fvhnkwxvxnsatqmljnxu.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aG5rd3h2eG5zYXRxbWxqbnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTgwNzksImV4cCI6MjA3NzgzNDA3OX0.TmV3OI1OitcdLvFcGYTm2hclZ8aI-2zwtsI8Ar6GQaU"
    };
  } catch (error) {
    console.error('[Supabase Config] Erro ao carregar config:', error);
    // Retornar valores hardcoded como último recurso
    return {
      url: "https://fvhnkwxvxnsatqmljnxu.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aG5rd3h2eG5zYXRxbWxqbnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTgwNzksImV4cCI6MjA3NzgzNDA3OX0.TmV3OI1OitcdLvFcGYTm2hclZ8aI-2zwtsI8Ar6GQaU"
    };
  }
};

const config = getConfig();
const supabaseUrl = config.url;
const supabaseAnonKey = config.key;

console.log('[Supabase Init] Configuração final:');
console.log('[Supabase Init] URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('[Supabase Init] Key length:', supabaseAnonKey?.length);

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

