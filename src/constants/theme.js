// ============================================
// THEME & DESIGN TOKENS
// Centralização de cores, espaçamentos e estilos
// ============================================

export const Colors = {
  // Primary Colors
  primary: {
    main: '#10B981',        // Verde principal
    dark: '#059669',        // Verde escuro
    light: '#34D399',       // Verde claro
    lighter: '#6EE7B7',     // Verde mais claro
    lightest: '#A7F3D0',    // Verde muito claro
    mint: '#D1FAE5',        // Verde menta
    background: '#F0FDF4',  // Fundo verde claro
    border: '#BBF7D0',      // Borda verde
  },

  // Secondary Colors
  secondary: {
    main: '#2c4455',        // Azul escuro (nosso azul)
    light: '#3B5A73',       // Azul médio
    dark: '#1E2F3D',        // Azul muito escuro
  },

  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    }
  },

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F3F4F6',
    light: '#FAFAFA',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    light: '#D1D5DB',
    white: '#FFFFFF',
    link: '#10B981',
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 10,
  lg: 12,
  xl: 15,
  xxl: 20,
  full: 9999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  giant: 36,
};

export const FontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const CommonStyles = {
  // Container padrão
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  // Card padrão
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },

  // Input padrão
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },

  // Botão primário
  buttonPrimary: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },

  // Texto do botão primário
  buttonPrimaryText: {
    color: Colors.neutral.white,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },

  // Header padrão
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  // Título de seção
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Texto padrão
  text: {
    fontSize: FontSizes.base,
    color: Colors.text.primary,
  },

  // Texto secundário
  textSecondary: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
};

// Função helper para criar sombra personalizada
export const createShadow = (elevation = 3, color = '#000', opacity = 0.1) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: elevation * 2 },
  shadowOpacity: opacity,
  shadowRadius: elevation * 4,
  elevation: elevation,
});

// Função helper para criar gradiente de cores
export const createGradient = (colors) => ({
  colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

export default {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadows,
  CommonStyles,
  createShadow,
  createGradient,
};

