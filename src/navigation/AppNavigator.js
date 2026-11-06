import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

import LoadingScreen from '../components/LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import AccessGrantedScreen from '../screens/AccessGrantedScreen';
import AccessDeniedScreen from '../screens/AccessDeniedScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { firebaseUser, loading } = useAuth();

  // 1. Mostrar pantalla de carga mientras Firebase verifica la sesión persistida
  if (loading) {
    return <LoadingScreen message="Verificando sesión de seguridad..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade'
        }}
      >
        {!firebaseUser ? (
          // Stack de Autenticación
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animationTypeForReplace: 'pop'
            }}
          />
        ) : (
          // Stack de la Aplicación Principal
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={{
                animation: 'slide_from_bottom'
              }}
            />
            <Stack.Screen
              name="AccessGranted"
              component={AccessGrantedScreen}
              options={{
                animation: 'fade_from_bottom'
              }}
            />
            <Stack.Screen
              name="AccessDenied"
              component={AccessDeniedScreen}
              options={{
                animation: 'fade_from_bottom'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

