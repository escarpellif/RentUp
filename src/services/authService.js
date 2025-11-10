// ============================================
// AUTH SERVICE
// Lógica de autenticação separada dos componentes
// ============================================

import { supabase } from '../../supabase';
import { Alert } from 'react-native';

/**
 * Valida se a senha atende aos requisitos de segurança
 */
export const validatePassword = (password) => {
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
};

/**
 * Verifica se o username já existe no banco
 */
export const checkUsernameExists = async (username) => {
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
};

/**
 * Verifica se o email já existe no sistema
 */
export const checkEmailExists = async (email) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy-password-check-12345'
    });

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
};

/**
 * Realiza login do usuário
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Realiza cadastro de novo usuário
 */
export const signUp = async (email, password, username, fullName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Realiza logout do usuário
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Recupera sessão atual do usuário
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Reseta a senha do usuário
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  validatePassword,
  checkUsernameExists,
  checkEmailExists,
  signIn,
  signUp,
  signOut,
  getSession,
  resetPassword,
};

