// ============================================
// i18n CONFIGURATION
// Sistema de internacionalização
// ============================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import { Platform } from 'react-native'; // COMENTADO TEMPORARIAMENTE

// Importar traduções
import es from './locales/es';
import en from './locales/en';

// const LANGUAGE_KEY = '@ALUKO:language'; // COMENTADO TEMPORARIAMENTE

// Recursos de tradução
const resources = {
  es: { translation: es },
  en: { translation: en },
};

// TODA LÓGICA DE ASYNCSTORAGE COMENTADA TEMPORARIAMENTE
/*
// Helper para obter AsyncStorage de forma segura
const getAsyncStorage = () => {
  try {
    if (Platform.OS !== 'web') {
      return require('@react-native-async-storage/async-storage').default;
    }
    return null;
  } catch (error) {
    console.warn('Erro ao carregar AsyncStorage:', error);
    return null;
  }
};

// Função para carregar idioma salvo
const loadSavedLanguage = async () => {
  try {
    // Detectar ambiente web de forma segura
    const hasWindow = typeof window !== 'undefined';
    const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined';

    if (Platform.OS === 'web' && hasLocalStorage) {
      // Web: usar localStorage
      const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
      return savedLanguage || 'es';
    } else {
      // Native: usar AsyncStorage
      const AsyncStorage = getAsyncStorage();
      if (!AsyncStorage) {
        console.warn('AsyncStorage não disponível, usando idioma padrão');
        return 'es';
      }
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      return savedLanguage || 'es';
    }
  } catch (error) {
    console.error('Error loading language:', error);
    return 'es';
  }
};

// Função para salvar idioma
export const saveLanguage = async (language) => {
  try {
    // Detectar ambiente web de forma segura
    const hasWindow = typeof window !== 'undefined';
    const hasLocalStorage = hasWindow && typeof window.localStorage !== 'undefined';

    if (Platform.OS === 'web' && hasLocalStorage) {
      // Web: usar localStorage
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } else {
      // Native: usar AsyncStorage
      const AsyncStorage = getAsyncStorage();
      if (AsyncStorage) {
        await AsyncStorage.setItem(LANGUAGE_KEY, language);
      } else {
        console.warn('AsyncStorage não disponível para salvar idioma');
      }
    }
  } catch (error) {
    console.error('Error saving language:', error);
  }
};
*/

// VERSÃO TEMPORÁRIA SEM PERSISTÊNCIA
export const saveLanguage = async (language) => {
  console.log('saveLanguage DESABILITADO temporariamente:', language);
};

// Inicializar i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'es', // Idioma padrão fixo
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

// Função para inicializar o idioma salvo
// DESABILITADA TEMPORARIAMENTE
export const initializeLanguage = async () => {
  console.log('initializeLanguage DESABILITADO temporariamente');
  /*
  try {
    const language = await loadSavedLanguage();
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error initializing language:', error);
  }
  */
};


export default i18n;

