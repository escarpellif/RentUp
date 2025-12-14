import { Alert } from 'react-native';

/**
 * Checks if the user is a guest and shows an alert if they try to access protected features
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @param {string} message - Custom message to show (optional)
 * @returns {boolean} - Returns true if user is authenticated, false if guest
 */
export const requireAuth = (isGuest, message = 'Login first') => {
  if (isGuest) {
    Alert.alert(
      'Autenticación Requerida',
      message,
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

/**
 * Spanish version of the auth check
 */
export const requiereAutenticacion = (isGuest, mensaje = 'Por favor, inicia sesión para continuar') => {
  if (isGuest) {
    Alert.alert(
      'Autenticación Requerida',
      mensaje,
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

