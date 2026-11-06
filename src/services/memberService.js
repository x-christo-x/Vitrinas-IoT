import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';

/**
 * Obtiene la referencia al documento del miembro en Firestore:
 * grupo/{groupId}/miembros/{uid}
 */
export const getMemberDocRef = (groupId, uid) => {
  return doc(firestore, 'grupo', groupId, 'miembros', uid);
};

/**
 * Consulta única de los datos del miembro en el grupo.
 */
export const fetchMemberData = async (groupId, uid) => {
  try {
    if (!groupId || !uid) {
      return { exists: false, member: null, error: 'Identificadores inválidos.' };
    }

    const docRef = getMemberDocRef(groupId, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        exists: false,
        member: null,
        error: 'No perteneces a este grupo.'
      };
    }

    const data = docSnap.data();

    if (data.active !== true) {
      return {
        exists: true,
        member: {
          uid,
          nombre: data.nombre || 'Usuario',
          rol: data.rol || 'Miembro',
          active: false,
          canUnlock: false
        },
        error: 'Tu acceso al grupo está desactivado.'
      };
    }

    return {
      exists: true,
      member: {
        uid,
        nombre: data.nombre || 'Usuario',
        rol: data.rol || 'Miembro',
        active: true,
        canUnlock: data.canUnlock === true
      },
      error: null
    };
  } catch (error) {
    console.error('Error al consultar miembro:', error);
    return {
      exists: false,
      member: null,
      error: 'Error al consultar la información de membresía.'
    };
  }
};

/**
 * Escucha en tiempo real los cambios del documento del miembro para reflejar
 * de inmediato si el administrador activa/desactiva canUnlock o active.
 */
export const subscribeToMemberData = (groupId, uid, onData, onError) => {
  if (!groupId || !uid) return () => {};

  const docRef = getMemberDocRef(groupId, uid);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onData({
          exists: false,
          member: null,
          error: 'No perteneces a este grupo.'
        });
        return;
      }

      const data = docSnap.data();

      if (data.active !== true) {
        onData({
          exists: true,
          member: {
            uid,
            nombre: data.nombre || 'Usuario',
            rol: data.rol || 'Miembro',
            active: false,
            canUnlock: false
          },
          error: 'Tu acceso al grupo está desactivado.'
        });
        return;
      }

      onData({
        exists: true,
        member: {
          uid,
          nombre: data.nombre || 'Usuario',
          rol: data.rol || 'Miembro',
          active: true,
          canUnlock: data.canUnlock === true
        },
        error: null
      });
    },
    (err) => {
      console.error('Error en listener de miembro:', err);
      if (onError) onError(err);
    }
  );
};

