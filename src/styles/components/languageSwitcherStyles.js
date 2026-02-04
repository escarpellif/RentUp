import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, FontWeights } from '../../constants/theme';

export const languageSwitcherStyles = StyleSheet.create({
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
