import React, { createContext, useState, useEffect, useContext } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { subscribeToAuth, loginWithEmail, logoutUser } from '../services/authService';
import { subscribeToMemberData, fetchMemberData } from '../services/memberService';

const AuthContext = createContext({
  firebaseUser: null,
  member: null,
  memberError: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshMember: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [member, setMember] = useState(null);
  const [memberError, setMemberError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Escuchar sesión de Firebase Auth
  useEffect(() => {
    let unsubscribeMember = null;

    const unsubscribeAuth = subscribeToAuth(async (user) => {
      // Limpiar listener de miembro anterior si existe
      if (unsubscribeMember) {
        unsubscribeMember();
        unsubscribeMember = null;
      }

      if (user) {
        setFirebaseUser(user);
        // Escuchar datos del miembro en Firestore en tiempo real
        unsubscribeMember = subscribeToMemberData(
          APP_CONFIG.groupId,
          user.uid,
          (result) => {
            if (result.exists && result.member) {
              setMember(result.member);
              setMemberError(result.error || null);
            } else {
              setMember(null);
              setMemberError(result.error || 'No perteneces a este grupo.');
            }
            setLoading(false);
          },
          (err) => {
            console.error('Error suscribiendo a datos de miembro:', err);
            setMemberError('Error al sincronizar datos de membresía.');
            setLoading(false);
          }
        );
      } else {
        setFirebaseUser(null);
        setMember(null);
        setMemberError(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeMember) unsubscribeMember();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const result = await loginWithEmail(email, password);
    if (!result.user) {
      setLoading(false);
      return { success: false, error: result.error };
    }
    // El listener onAuthStateChanged cargará automáticamente al usuario y sus permisos
    return { success: true, error: null };
  };

  const logout = async () => {
    setLoading(true);
    await logoutUser();
    setFirebaseUser(null);
    setMember(null);
    setMemberError(null);
    setLoading(false);
  };

  const refreshMember = async () => {
    if (!firebaseUser) return;
    const result = await fetchMemberData(APP_CONFIG.groupId, firebaseUser.uid);
    if (result.exists && result.member) {
      setMember(result.member);
      setMemberError(result.error || null);
    } else {
      setMember(null);
      setMemberError(result.error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        member,
        memberError,
        loading,
        login,
        logout,
        refreshMember
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

