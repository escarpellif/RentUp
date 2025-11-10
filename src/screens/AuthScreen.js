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

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  // FUNÇÃO PARA VERIFICAR SE EMAIL JÁ EXISTE
  // -------------------------
  async function checkEmailExists(email) {
    try {
      // Tentar fazer sign in com email inválido para verificar se existe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy-password-check-12345'
      });

      // Se o erro for "Invalid login credentials", o email existe mas a senha está errada
      // Se o erro for "Email not confirmed", o email existe mas não foi confirmado
      if (error) {
        if (error.message.includes('Invalid login credentials') ||
            error.message.includes('Email not confirmed')) {
          return true; // Email existe
        }
        return false; // Email não existe
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
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

      // Validar se email já existe
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setLoading(false);
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
        return;
      }
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
      Alert.alert('Error en el Registro', error.message);
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
              {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isRegistering ? 'Regístrate' : 'Iniciar Sesión'}
            </Text>

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
                  placeholder="Nombre Completo"
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
                  placeholder="Nombre de Usuario"
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
                placeholder="Correo Electrónico"
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
                placeholder="Contraseña"
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
                <Text style={styles.passwordStrengthTitle}>Requisitos de la contraseña:</Text>
                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <Text style={password.length >= 8 ? styles.requirementMet : styles.requirementUnmet}>
                      {password.length >= 8 ? '✓' : '○'}
                    </Text>
                    <Text style={password.length >= 8 ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      Mínimo 8 caracteres
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/[A-Z]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/[A-Z]/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/[A-Z]/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      Una letra mayúscula (A-Z)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/[a-z]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/[a-z]/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/[a-z]/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      Una letra minúscula (a-z)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/\d/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/\d/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/\d/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      Un número (0-9)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.requirementMet : styles.requirementUnmet}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'}
                    </Text>
                    <Text style={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.requirementTextMet : styles.requirementTextUnmet}>
                      Un carácter especial (!@#$...)
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
                    {isRegistering ? 'Registrarse' : 'Entrar'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle Auth Mode */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleQuestion}>
                {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              </Text>
              <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                <Text style={styles.toggleLink}>
                  {isRegistering ? 'Iniciar Sesión' : 'Regístrate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Posee menos, Accede a más.
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
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  logoIcon: {
    fontSize: 50,
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
