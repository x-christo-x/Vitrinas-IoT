import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { APP_CONFIG } from '../config/appConfig';
import StatusCard from '../components/StatusCard';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({ navigation }) {
  const { member, memberError, logout } = useAuth();

  const isAuthorized = member && member.active && member.canUnlock;
  const memberName = member?.nombre || 'Usuario';
  const memberRole = member?.rol || 'Miembro';

  const handleScanPress = () => {
    if (!isAuthorized) return;
    navigation.navigate('Scanner');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Superior */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.groupBadge}>GRUPO: {APP_CONFIG.groupId}</Text>
            <Text style={styles.greetingText}>Hola, {memberName}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={logout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutIconText}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Banner de Advertencia si existe error de membresía o permisos */}
        {memberError ? (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerIcon}>⚠️</Text>
            <Text style={styles.alertBannerText}>{memberError}</Text>
          </View>
        ) : !member?.canUnlock ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerIcon}>🔒</Text>
            <Text style={styles.warningBannerText}>
              Sin permiso para desbloquear vitrinas. Consulta con tu administrador.
            </Text>
          </View>
        ) : null}

        {/* Botón Principal de Escaneo estilo Radar / Target */}
        <View style={styles.scanSection}>
          <TouchableOpacity
            activeOpacity={isAuthorized ? 0.85 : 1}
            onPress={handleScanPress}
            disabled={!isAuthorized}
            style={[
              styles.radarOuterRing,
              !isAuthorized && styles.radarDisabledRing
            ]}
          >
            <View
              style={[
                styles.radarMiddleRing,
                !isAuthorized && styles.radarDisabledMiddle
              ]}
            >
              <View
                style={[
                  styles.radarCenterCircle,
                  !isAuthorized && styles.radarDisabledCenter
                ]}
              >
                <Text style={styles.scannerIconSymbol}>⛶</Text>
                <Text style={styles.scannerTextPrimary}>
                  {isAuthorized ? 'ESCANEAR' : 'BLOQUEADO'}
                </Text>
                <Text style={styles.scannerTextSecondary}>
                  {isAuthorized ? 'VITRINA' : 'SIN ACCESO'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.scanHint}>
            {isAuthorized
              ? 'Toca para abrir la cámara y escanear el QR en la vitrina'
              : 'Requiere permisos de operador para abrir vitrinas'}
          </Text>
        </View>

        {/* Sección de Estado del Usuario */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>INFORMACIÓN DE SEGURIDAD</Text>

          <StatusCard
            label="Usuario"
            value={memberName}
            status="default"
          />

          <StatusCard
            label="Rol en el grupo"
            value={memberRole}
            status="info"
          />

          <StatusCard
            label="Estado de cuenta"
            value={member?.active ? 'Activo' : 'Inactivo'}
            status={member?.active ? 'success' : 'danger'}
          />

          <StatusCard
            label="Acceso a vitrinas"
            value={member?.canUnlock ? 'Autorizado' : 'Sin permiso'}
            status={member?.canUnlock ? 'success' : 'warning'}
            subtitle={
              member?.canUnlock
                ? 'Permiso concedido para solicitar apertura'
                : 'Solo lectura de telemetría'
            }
            highlight={member?.canUnlock}
          />
        </View>

        {/* Botón Inferior para Cerrar Sesión */}
        <View style={styles.logoutSection}>
          <PrimaryButton
            title="Cerrar sesión"
            onPress={logout}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  groupBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginTop: 2
  },
  logoutIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutIconText: {
    fontSize: 18,
    color: COLORS.danger
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBackground,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20
  },
  alertBannerIcon: {
    fontSize: 16,
    marginRight: 10
  },
  alertBannerText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600'
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBackground,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20
  },
  warningBannerIcon: {
    fontSize: 16,
    marginRight: 10
  },
  warningBannerText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '500'
  },
  scanSection: {
    alignItems: 'center',
    marginVertical: 18
  },
  radarOuterRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  },
  radarDisabledRing: {
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0
  },
  radarMiddleRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radarDisabledMiddle: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: COLORS.border
  },
  radarCenterCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6
  },
  radarDisabledCenter: {
    backgroundColor: COLORS.cardBackgroundLight,
    shadowOpacity: 0,
    elevation: 0
  },
  scannerIconSymbol: {
    fontSize: 32,
    color: COLORS.textInverse,
    fontWeight: '800'
  },
  scannerTextPrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 1.5,
    marginTop: 2
  },
  scannerTextSecondary: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(7, 11, 20, 0.75)',
    letterSpacing: 1
  },
  scanHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 260
  },
  infoSection: {
    marginTop: 12
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4
  },
  logoutSection: {
    marginTop: 20
  }
});

