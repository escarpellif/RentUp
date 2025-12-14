import React, { useState } from 'react';
import {
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
import { authScreenStyles as styles } from '../styles/authScreenStyles';

export default function AuthScreen({ onGuestLogin }) {
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

            {/* Guest Login Button - Only for Login Mode */}
            {!isRegistering && (
              <View style={styles.guestButtonContainer}>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={() => {
                    if (onGuestLogin && typeof onGuestLogin === 'function') {
                      onGuestLogin();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestButtonIcon}>👤</Text>
                  <Text style={styles.guestButtonText}>
                    {t('auth.enterAsGuest')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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

