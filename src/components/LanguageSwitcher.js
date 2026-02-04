// ============================================
// LANGUAGE SWITCHER COMPONENT
// Seletor de idioma com bandeiras
// ============================================

import React from 'react';
import {View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../i18n';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { languageSwitcherStyles } from '../styles/components/languageSwitcherStyles';

export default function LanguageSwitcher({ style }) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = async (language) => {
    await i18n.changeLanguage(language);
    await saveLanguage(language);
  };

  return (
    <View style={[languageSwitcherStyles.container, style]}>
      {/* Botão Espanhol */}
      <TouchableOpacity
        style={[
          languageSwitcherStyles.languageButton,
          currentLanguage === 'es' && languageSwitcherStyles.languageButtonActive,
        ]}
        onPress={() => changeLanguage('es')}
        activeOpacity={0.7}
      >
        <Text style={languageSwitcherStyles.flag}>🇪🇸</Text>
        <Text
          style={[
            languageSwitcherStyles.languageText,
            currentLanguage === 'es' && languageSwitcherStyles.languageTextActive,
          ]}
        >
          ES
        </Text>
      </TouchableOpacity>

      {/* Botão Inglês */}
      <TouchableOpacity
        style={[
          languageSwitcherStyles.languageButton,
          currentLanguage === 'en' && languageSwitcherStyles.languageButtonActive,
        ]}
        onPress={() => changeLanguage('en')}
        activeOpacity={0.7}
      >
        <Text style={languageSwitcherStyles.flag}>🇬🇧</Text>
        <Text
          style={[
            languageSwitcherStyles.languageText,
            currentLanguage === 'en' && languageSwitcherStyles.languageTextActive,
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>
    </View>
  );
}



