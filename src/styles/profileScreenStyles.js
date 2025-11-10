// ============================================
// PROFILE SCREEN STYLES
// Estilos da tela de perfil
// ============================================

import { StyleSheet, Platform, StatusBar } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../constants/theme';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  backArrow: {
    fontSize: 22,
    color: Colors.text.primary,
  },
  
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  
  headerSpacer: {
    width: 40,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scrollContent: {
    padding: Spacing.lg,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.base,
  },
  
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: 5,
    color: Colors.text.primary,
  },
  
  email: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  
  username: {
    fontSize: FontSizes.base,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  
  memberSince: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.main,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.base + 3,
    gap: Spacing.sm,
  },
  
  editProfileIcon: {
    fontSize: FontSizes.md,
  },
  
  editProfileText: {
    color: Colors.neutral.white,
    fontSize: FontSizes.base + 1,
    fontWeight: FontWeights.semibold,
  },
  
  // Section Headers
  sectionHeader: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginTop: 10,
    marginBottom: Spacing.base + 3,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  
  // Ratings
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  ratingSection: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    padding: Spacing.base + 3,
    borderRadius: BorderRadius.lg,
    marginHorizontal: 5,
    alignItems: 'center',
    ...Shadows.sm,
  },
  
  roleTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  
  ratingBox: {
    alignItems: 'center',
  },
  
  ratingValue: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    color: Colors.primary.main,
  },
  
  ratingLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 5,
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: Spacing.md,
  },
  
  actionButton: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.base,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  actionButtonPrimary: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  
  actionIcon: {
    fontSize: FontSizes.xxl,
    marginBottom: Spacing.sm,
  },
  
  actionText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  
  actionTextWhite: {
    color: Colors.neutral.white,
  },
});

export default profileStyles;

