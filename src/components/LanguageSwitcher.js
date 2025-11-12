// ============================================
// LANGUAGE SWITCHER COMPONENT
// Seletor de idioma com bandeiras
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../i18n';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';

export default function LanguageSwitcher({ style }) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = async (language) => {
    await i18n.changeLanguage(language);
    await saveLanguage(language);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Botão Espanhol */}
      <TouchableOpacity
        style={[
          styles.languageButton,
          currentLanguage === 'es' && styles.languageButtonActive,
        ]}
        onPress={() => changeLanguage('es')}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>🇪🇸</Text>
        <Text
          style={[
            styles.languageText,
            currentLanguage === 'es' && styles.languageTextActive,
          ]}
        >
          ES
        </Text>
      </TouchableOpacity>

      {/* Botão Inglês */}
      <TouchableOpacity
        style={[
          styles.languageButton,
          currentLanguage === 'en' && styles.languageButtonActive,
        ]}
        onPress={() => changeLanguage('en')}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>🇬🇧</Text>
        <Text
          style={[
            styles.languageText,
            currentLanguage === 'en' && styles.languageTextActive,
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  
  languageButtonActive: {
    backgroundColor: Colors.primary.background,
    borderColor: Colors.primary.main,
    ...Shadows.base,
  },
  
  flag: {
    fontSize: 20,
  },
  
  languageText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  
  languageTextActive: {
    color: Colors.primary.dark,
    fontWeight: '700',
  },
});

