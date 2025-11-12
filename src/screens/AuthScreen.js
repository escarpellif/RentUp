import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // -------------------------
  // LÓGICA DE RECUPERAÇÃO DE SENHA
  // -------------------------
  async function handleForgotPassword() {
    if (!email) {
      Alert.alert(
        t('auth.forgotPassword'),
        'Por favor, ingresa tu correo electrónico arriba y luego presiona "¿Olvidaste tu contraseña?"'
      );
      return;
    }

    Alert.alert(
      t('auth.forgotPassword'),
      `¿Enviar email de recuperación a ${email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setLoading(true);

            // Redireciona para página customizada no GitHub Pages
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: 'https://escarpellif.github.io/RentUp/',
            });

            setLoading(false);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert(
                '¡Email Enviado!',
                `Se ha enviado un email a ${email} con un enlace para restablecer tu contraseña.\n\nPor favor, revisa tu bandeja de entrada y haz clic en el enlace.`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }

  // -------------------------
  // LÓGICA DE LOGIN (SIGN IN)
  // -------------------------
  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Campos Incompletos', 'Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Error en el Login', error.message);
    }
    setLoading(false);
  }

  // -------------------------
  // FUNÇÃO PARA VALIDAR SENHA FORTE
  // -------------------------
  function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return {
        valid: false,
        message: `La contraseña debe tener al menos ${minLength} caracteres`
      };
    }

    if (!hasUpperCase) {
      return {
        valid: false,
        message: 'La contraseña debe contener al menos una letra mayúscula (A-Z)'
      };
    }

    if (!hasLowerCase) {
      return {
        valid: false,
        message: 'La contraseña debe contener al menos una letra minúscula (a-z)'
      };
    }

    if (!hasNumbers) {
      return {
        valid: false,
        message: 'La contraseña debe contener al menos un número (0-9)'
      };
    }

    if (!hasSpecialChar) {
      return {
        valid: false,
        message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'
      };
    }

    return { valid: true, message: '' };
  }

  // -------------------------
  // FUNÇÃO PARA VERIFICAR SE USERNAME JÁ EXISTE
  // -------------------------
  async function checkUsernameExists(username) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar username:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      return false;
    }
  }

  // -------------------------
  // LÓGICA DE CADASTRO (SIGN UP)
  // -------------------------
  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Campos Incompletos', 'Por favor, completa todos los campos');
      return;
    }

    if (isRegistering && (!username || !fullName)) {
      Alert.alert('Campos Incompletos', 'Por favor, completa tu nombre de usuario y nombre completo');
      return;
    }

    // Validação de senha forte apenas no registro
    if (isRegistering) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        Alert.alert('Contraseña Débil', passwordValidation.message);
        return;
      }

      // Validar se username já existe
      setLoading(true);
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        setLoading(false);
        Alert.alert(
          'Nombre de Usuario No Disponible',
          `El nombre de usuario "${username}" ya está en uso. Por favor, elige otro.`
        );
        return;
      }

      // Não verificamos email previamente - o Supabase retorna erro específico se já existir
      // Isso evita falsos positivos e permite que o Supabase gerencie a validação
    } else {
      // Para login, mantém a validação mínima
      if (password.length < 6) {
        Alert.alert('Contraseña Inválida', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    if (!isRegistering) {
      setLoading(true);
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          full_name: fullName,
        }
      }
    });

    if (error) {
      // Verificar se é erro de email já registrado
      if (error.message.includes('already registered') ||
          error.message.includes('already been registered') ||
          error.message.includes('User already registered')) {
        Alert.alert(
          'Email Ya Registrado',
          'Este email ya está registrado. ¿Deseas iniciar sesión?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Iniciar Sesión',
              onPress: () => setIsRegistering(false)
            }
          ]
        );
      } else {
        Alert.alert('Error en el Registro', error.message);
      }
    } else if (!session) {
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Por favor, verifica tu email para activarla.',
        [{ text: 'OK', onPress: () => setIsRegistering(false) }]
      );
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand Section */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/app-icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>RentUp</Text>
            <Text style={styles.brandTagline}>
              {isRegistering ? t('auth.createAccount') : t('auth.welcomeBack')}
            </Text>
          </View>

          {/* Language Switcher */}
          <View style={styles.languageSwitcherContainer}>
            <LanguageSwitcher />
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>

            {/* Full Name Input - Only for Registration */}
            {isRegistering && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                </View>
                <TextInput
                  style={styles.input}
                  onChangeText={setFullName}
                  value={fullName}
                  placeholder={t('auth.fullName')}
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            )}

            {/* Username Input - Only for Registration */}
            {isRegistering && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>@</Text>
                </View>
                <TextInput
                  style={styles.input}
                  onChangeText={setUsername}
                  value={username}
                  placeholder={t('auth.username')}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
              </View>
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                placeholder={t('auth.email')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
              </View>
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
                placeholder={t('auth.password')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator - Only for Registration */}
            {isRegistering && password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <Text style={styles.passwordStrengthTitle}>{t('auth.passwordRequirements')}</Text>
                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <Text style={password.length >= 8 ? styles.requirementMet : styles.requirementUnmet}>
                      {password.length >= 8 ? '✓' : '○'}
                    </Text>
                    <Text style={password.length >= 8 ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      {t('auth.minCharacters')}
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/[A-Z]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/[A-Z]/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/[A-Z]/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      {t('auth.oneUppercase')}
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/[a-z]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/[a-z]/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/[a-z]/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      {t('auth.oneLowercase')}
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/\d/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/\d/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/\d/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      {t('auth.oneNumber')}
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      {t('auth.oneSpecial')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={isRegistering ? signUpWithEmail : signInWithEmail}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#ccc', '#999'] : ['#10B981', '#059669']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isRegistering ? t('auth.register') : t('auth.login')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password Link - Only for Login */}
            {!isRegistering && (
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordLink}>
                    {t('auth.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Toggle Auth Mode */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleQuestion}>
                {isRegistering ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
              </Text>
              <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                <Text style={styles.toggleLink}>
                  {isRegistering ? t('auth.login') : t('auth.register')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('home.subtitle')}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  languageSwitcherContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandTagline: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputIconContainer: {
    marginRight: 10,
  },
  inputIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIconContainer: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 20,
  },
  passwordStrengthContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  passwordStrengthTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
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
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    marginRight: 8,
  },
  requirementUnmet: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
  },
  requirementTextMet: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  requirementTextUnmet: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 55,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  toggleQuestion: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  toggleLink: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
});
