import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';

export default function AccessDeniedScreen({ route, navigation }) {
  const {
    title = 'Acceso Denegado',
    message = 'No se pudo verificar la autorización para abrir esta vitrina.',
    code = 'ACCESS_DENIED'
  } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Glow Denied Icon */}
        <View style={styles.iconOuterRing}>
          <View style={styles.iconMiddleRing}>
            <View style={styles.iconCenter}>
              <Text style={styles.crossIcon}>✕</Text>
            </View>
          </View>
        </View>

        {/* Título de Error */}
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Operación cancelada por seguridad</Text>

        {/* Card Explicativa */}
        <View style={styles.card}>
          <View style={styles.errorHeader}>
            <Text style={styles.cardTitle}>MOTIVO DEL RECHAZO</Text>
            {code ? (
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{code}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>

          <Text style={styles.helperText}>
            Si crees que esto es un error, verifica que la pantalla de la vitrina muestre un código QR recién generado o consulta con el administrador del grupo.
          </Text>
        </View>

        {/* Botones de Acción */}
        <View style={styles.buttonsContainer}>
          <PrimaryButton
            title="Intentar nuevamente"
            onPress={() => navigation.replace('Scanner')}
            variant="danger"
            style={{ marginBottom: 12 }}
          />

          <PrimaryButton
            title="Volver al inicio"
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }]
            })}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  iconOuterRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  iconMiddleRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8
  },
  crossIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '900'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 1.5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2
  },
  codeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  codeText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.danger,
    fontWeight: '700'
  },
  messageBox: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
    marginBottom: 14
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  buttonsContainer: {
    width: '100%'
  }
});

