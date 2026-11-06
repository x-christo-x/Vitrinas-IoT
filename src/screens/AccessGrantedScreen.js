import React, { useState, useEffect } from 'react';
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

export default function AccessGrantedScreen({ route, navigation }) {
  const { vitrinaName = 'Vitrina 01', unlockExpiresAtMs } = route.params || {};

  // Formato mm:ss para el contador visual (5 minutos iniciales por defecto)
  const calculateRemainingSeconds = () => {
    if (!unlockExpiresAtMs) return 5 * 60;
    const diffSeconds = Math.max(0, Math.floor((unlockExpiresAtMs - Date.now()) / 1000));
    return diffSeconds;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);

  // Contador estrictamente VISUAL y local (NO realiza escrituras a Firebase)
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Glow Success Icon */}
        <View style={styles.iconOuterRing}>
          <View style={styles.iconMiddleRing}>
            <View style={styles.iconCenter}>
              <Text style={styles.checkmarkIcon}>✓</Text>
            </View>
          </View>
        </View>

        {/* Título de Confirmación */}
        <Text style={styles.title}>¡ACCESO CONCEDIDO!</Text>
        <Text style={styles.subtitle}>Vitrina desbloqueada exitosamente</Text>

        {/* Card Informativa */}
        <View style={styles.infoCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>DISPOSITIVO</Text>
            <Text style={styles.cardValue}>{vitrinaName}</Text>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>ESTADO DEL CERROJO</Text>
            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusPillText}>DESBLOQUEADA</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Temporizador Visual */}
          <View style={styles.timerSection}>
            <Text style={styles.timerLabel}>TIEMPO DE ACCESO DISPONIBLE</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            </View>
            <Text style={styles.timerHint}>
              Acceso disponible durante 5 minutos. La vitrina se bloqueará automáticamente al expirar el tiempo.
            </Text>
          </View>
        </View>

        {/* Botón Volver al Inicio */}
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            title="Volver al inicio"
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }]
            })}
            variant="success"
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  iconMiddleRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8
  },
  checkmarkIcon: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '900'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.success,
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
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBackground,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6
  },
  statusPillText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14
  },
  timerSection: {
    alignItems: 'center',
    paddingTop: 4
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10
  },
  timerBox: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 10
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.success,
    letterSpacing: 3
  },
  timerHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10
  },
  buttonWrapper: {
    width: '100%'
  }
});

