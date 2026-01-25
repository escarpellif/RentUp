// ============================================
// i18n CONFIGURATION
// Sistema de internacionalização
// ============================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

// Importar AsyncStorage apenas em plataformas nativas
let AsyncStorage;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Importar traduções
import es from './locales/es';
import en from './locales/en';

const LANGUAGE_KEY = '@ALUKO:language';

// Recursos de tradução
const resources = {
  es: { translation: es },
  en: { translation: en },
};

// Função para carregar idioma salvo
const loadSavedLanguage = async () => {
  try {
    if (Platform.OS === 'web') {
      // Web: usar localStorage
      const savedLanguage = typeof window !== 'undefined'
        ? window.localStorage.getItem(LANGUAGE_KEY)
        : null;
      return savedLanguage || 'es';
    } else {
      // Native: usar AsyncStorage
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
    if (Platform.OS === 'web') {
      // Web: usar localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LANGUAGE_KEY, language);
      }
    } else {
      // Native: usar AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    }
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Inicializar i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'es', // Idioma padrão inicial
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

// Carregar idioma salvo
loadSavedLanguage().then((language) => {
  i18n.changeLanguage(language);
});

export default i18n;

