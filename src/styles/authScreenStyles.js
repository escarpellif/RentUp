// ============================================
// AUTH SCREEN STYLES
// Estilos da tela de autenticação
// ============================================

import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../constants/theme';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  gradientBackground: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxxl,
  },
  
  // Brand Section
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 4,
    borderColor: Colors.primary.mint,
    ...Shadows.md,
  },
  
  logoImage: {
    width: 70,
    height: 70,
  },
  
  brandName: {
    fontSize: FontSizes.giant,
    fontWeight: FontWeights.bold,
    color: Colors.neutral.white,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  brandTagline: {
    fontSize: FontSizes.md,
    color: Colors.neutral.white,
    fontWeight: FontWeights.medium,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Form Card
  formCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 25,
    padding: Spacing.xl + 6,
    ...Shadows.lg,
  },
  
  formTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    marginBottom: 25,
    textAlign: 'center',
  },
  
  // Input Fields
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base + 3,
    paddingHorizontal: Spacing.base - 1,
    height: 55,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  
  inputIconContainer: {
    marginRight: 10,
  },
  
  inputIcon: {
    fontSize: 20,
  },
  
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  
  eyeIconContainer: {
    padding: 5,
  },
  
  eyeIcon: {
    fontSize: 20,
  },
  
  // Password Strength Indicator
  passwordStrengthContainer: {
    backgroundColor: Colors.primary.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base + 3,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  passwordStrengthTitle: {
    fontSize: FontSizes.sm + 1,
    fontWeight: FontWeights.semibold,
    color: Colors.primary.dark,
    marginBottom: Spacing.sm,
  },
  
  requirementsList: {
    gap: 4,
  },
  
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  
  requirementMet: {
    fontSize: FontSizes.base,
    color: Colors.primary.dark,
    fontWeight: FontWeights.bold,
    marginRight: Spacing.sm,
  },
  
  requirementUnmet: {
    fontSize: FontSizes.base,
    color: Colors.neutral.gray[400],
    marginRight: Spacing.sm,
  },
  
  requirementTextMet: {
    fontSize: FontSizes.sm,
    color: Colors.primary.dark,
    fontWeight: FontWeights.medium,
  },
  
  requirementTextUnmet: {
    fontSize: FontSizes.sm,
    color: Colors.neutral.gray[500],
  },
  
  // Submit Button
  submitButton: {
    marginTop: 10,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.primary.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  
  submitButtonDisabled: {
    opacity: 0.6,
  },
  
  submitButtonGradient: {
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 55,
  },
  
  submitButtonText: {
    color: Colors.neutral.white,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  
  // Toggle Auth Mode
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  toggleQuestion: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
  },
  
  toggleLink: {
    fontSize: FontSizes.base,
    color: Colors.primary.main,
    fontWeight: FontWeights.bold,
  },
  
  // Footer
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.neutral.white,
    opacity: 0.8,
    fontStyle: 'italic',
  },
});

export default authStyles;

