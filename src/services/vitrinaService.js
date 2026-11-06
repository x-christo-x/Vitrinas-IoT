import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import { APP_CONFIG } from '../config/appConfig';
import { fetchMemberData } from './memberService';

/**
 * Obtiene la referencia al documento de la vitrina en Firestore:
 * grupo/{groupId}/vitrinas/{vId}
 */
export const getVitrinaDocRef = (groupId, vitrinaId) => {
  return doc(firestore, 'grupo', groupId, 'vitrinas', vitrinaId);
};

/**
 * Obtiene los datos actuales de una vitrina.
 */
export const fetchVitrinaData = async (groupId, vitrinaId) => {
  try {
    const vitrinaRef = getVitrinaDocRef(groupId, vitrinaId);
    const vitrinaSnap = await getDoc(vitrinaRef);
    if (!vitrinaSnap.exists()) {
      return { exists: false, data: null };
    }
    return { exists: true, data: vitrinaSnap.data() };
  } catch (error) {
    console.error('Error al obtener vitrina:', error);
    return { exists: false, data: null, error };
  }
};

/**
 * Realiza la validación completa en Firestore y solicita el desbloqueo de la vitrina.
 * 
 * Validaciones:
 * 1. Usuario autenticado en Firebase
 * 2. Miembro activo y con canUnlock === true
 * 3. Vitrina existe en Firestore
 * 4. Vitrina active === true
 * 5. Vitrina no esté ya UNLOCKED
 * 6. vitrina.activeToken === qr.token
 * 7. vitrina.tokenExpiresAt > ahora
 * 8. qr.exp > ahora
 * 
 * Si todo es exitoso, actualiza con updateDoc():
 * lockState: "UNLOCKED", systemState: "ACTIVE", unlockedBy, unlockedAt, unlockExpiresAt, updatedAt
 */
export const requestUnlock = async (qrData, currentMember) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        code: 'NOT_AUTHENTICATED',
        message: 'No hay ninguna sesión activa. Inicia sesión de nuevo.'
      };
    }

    const groupId = qrData.groupId || APP_CONFIG.groupId;
    const vitrinaId = qrData.vId;

    // 1. Validar permisos del miembro (consultando Firestore para asegurar estado fresco)
    const memberCheck = await fetchMemberData(groupId, currentUser.uid);
    if (!memberCheck.exists) {
      return {
        success: false,
        code: 'MEMBER_NOT_FOUND',
        message: 'No perteneces a este grupo.'
      };
    }

    const member = memberCheck.member;
    if (!member.active) {
      return {
        success: false,
        code: 'MEMBER_INACTIVE',
        message: 'Tu acceso al grupo está desactivado.'
      };
    }

    if (!member.canUnlock) {
      return {
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'No tienes permiso para abrir vitrinas.'
      };
    }

    // 2. Consultar documento de la vitrina
    const vitrinaRef = getVitrinaDocRef(groupId, vitrinaId);
    const vitrinaSnap = await getDoc(vitrinaRef);

    if (!vitrinaSnap.exists()) {
      return {
        success: false,
        code: 'VITRINA_NOT_FOUND',
        message: 'La vitrina no existe en el sistema.'
      };
    }

    const vitrina = vitrinaSnap.data();

    // 3. Validar estado de la vitrina
    if (vitrina.active !== true) {
      return {
        success: false,
        code: 'VITRINA_INACTIVE',
        message: 'La vitrina no está activa actualmente.'
      };
    }

    // 4. Validar si ya está desbloqueada
    if (vitrina.lockState === 'UNLOCKED') {
      return {
        success: false,
        code: 'ALREADY_UNLOCKED',
        message: 'La vitrina ya se encuentra desbloqueada.'
      };
    }

    // 5. Validar que el token del QR coincida exactamente con activeToken de Firestore
    if (vitrina.activeToken !== qrData.token) {
      return {
        success: false,
        code: 'TOKEN_MISMATCH',
        message: 'El código QR ya no es válido. Escanea el nuevo código.'
      };
    }

    // 6. Validar expiración del token en Firestore (usando toMillis())
    const now = Date.now();
    let firestoreTokenExpMs = null;

    if (vitrina.tokenExpiresAt && typeof vitrina.tokenExpiresAt.toMillis === 'function') {
      firestoreTokenExpMs = vitrina.tokenExpiresAt.toMillis();
    } else if (typeof vitrina.tokenExpiresAt === 'number') {
      firestoreTokenExpMs = vitrina.tokenExpiresAt;
    }

    if (firestoreTokenExpMs && firestoreTokenExpMs <= now) {
      return {
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'El código QR ha expirado. Espera la renovación en pantalla.'
      };
    }

    // 7. Validar expiración local del payload del QR
    if (qrData.exp && qrData.exp <= now) {
      return {
        success: false,
        code: 'QR_EXPIRED',
        message: 'El código QR ha expirado.'
      };
    }

    // 8. Desbloqueo MVP: Escribir actualización en Firestore
    const unlockDurationMs = (APP_CONFIG.unlockDurationMinutes || 5) * 60 * 1000;
    const unlockExpiresAtTimestamp = Timestamp.fromMillis(now + unlockDurationMs);

    await updateDoc(vitrinaRef, {
      lockState: 'UNLOCKED',
      systemState: 'ACTIVE',
      unlockedBy: {
        uid: currentUser.uid,
        nombre: member.nombre || currentMember?.nombre || 'Usuario Autorizado',
        rol: member.rol || currentMember?.rol || 'Miembro'
      },
      unlockedAt: serverTimestamp(),
      unlockExpiresAt: unlockExpiresAtTimestamp,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      vitrinaId: vitrinaId,
      vitrinaName: vitrina.nombre || 'Vitrina 01',
      unlockExpiresAtMs: now + unlockDurationMs
    };
  } catch (error) {
    console.error('Error al solicitar desbloqueo de vitrina:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      message: 'No se pudo conectar con el servidor para autorizar el desbloqueo.'
    };
  }
};

