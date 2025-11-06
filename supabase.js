import 'react-native-url-polyfill/auto'; // Garante compatibilidade de URL para RN
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚨 SUBSTITUA PELAS SUAS CHAVES DO SUPABASE 🚨
const supabaseUrl = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aG5rd3h2eG5zYXRxbWxqbnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTgwNzksImV4cCI6MjA3NzgzNDA3OX0.TmV3OI1OitcdLvFcGYTm2hclZ8aI-2zwtsI8Ar6GQaU';

// Configuração do cliente Supabase para React Native
// Usamos o AsyncStorage para persistir a sessão do usuário
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

