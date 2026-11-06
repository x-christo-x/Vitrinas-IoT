import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Traduce códigos de error técnicos de Firebase Auth a mensajes legibles para el usuario.
 */
export const mapAuthErrorToMessage = (error) => {
  if (!error) return 'Ocurrió un error inesperado.';
  
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, inténtalo más tarde.';
    case 'auth/user-disabled':
      return 'Esta cuenta de usuario ha sido inhabilitada.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    default:
      return 'No se pudo iniciar sesión. Por favor verifica tus credenciales.';
  }
};

/**
 * Inicia sesión con correo y contraseña.
 */
export const loginWithEmail = async (email, password) => {
  try {
    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail || !password) {
      throw { code: 'custom/empty-fields', message: 'Por favor ingresa tu correo y contraseña.' };
    }
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error en loginWithEmail:', error);
    return {
      user: null,
      error: error.message || mapAuthErrorToMessage(error)
    };
  }
};

/**
 * Cierra la sesión activa del usuario.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error en logoutUser:', error);
    return { success: false, error: 'No se pudo cerrar la sesión.' };
  }
};

/**
 * Escucha cambios en el estado de autenticación.
 */
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

