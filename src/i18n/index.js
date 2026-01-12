// ============================================
// i18n CONFIGURATION
// Sistema de internacionalização
// ============================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'es'; // Padrão: Espanhol
  } catch (error) {
    console.error('Error loading language:', error);
    return 'es';
  }
};

// Função para salvar idioma
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
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

