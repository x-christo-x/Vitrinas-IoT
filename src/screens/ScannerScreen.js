import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { parseAndValidateQR } from '../services/qrService';
import { requestUnlock } from '../services/vitrinaService';
import PrimaryButton from '../components/PrimaryButton';

export default function ScannerScreen({ navigation }) {
  const { member } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Validando acceso...');

  // Candado para evitar múltiples triggers simultáneos por frame
  const scanLockRef = useRef(false);

  const handleBarcodeScanned = async ({ data }) => {
    // Si ya estamos procesando un código, ignorar lecturas subsecuentes
    if (scanLockRef.current || isProcessing) {
      return;
    }

    scanLockRef.current = true;
    setIsProcessing(true);
    setProcessingStatus('Analizando código QR...');

    try {
      // 1. Validar formato y restricciones locales del QR
      const localValidation = parseAndValidateQR(data);
      if (!localValidation.valid) {
        setIsProcessing(false);
        scanLockRef.current = false;
        navigation.replace('AccessDenied', {
          title: 'Código QR No Válido',
          message: localValidation.message,
          code: localValidation.code
        });
        return;
      }

      // 2. Validar contra Firestore y solicitar desbloqueo
      setProcessingStatus('Verificando token en Firestore...');
      const unlockResult = await requestUnlock(localValidation.data, member);

      setIsProcessing(false);
      scanLockRef.current = false;

      if (unlockResult.success) {
        navigation.replace('AccessGranted', {
          vitrinaId: unlockResult.vitrinaId,
          vitrinaName: unlockResult.vitrinaName,
          unlockExpiresAtMs: unlockResult.unlockExpiresAtMs
        });
      } else {
        navigation.replace('AccessDenied', {
          title: 'Acceso Denegado',
          message: unlockResult.message,
          code: unlockResult.code
        });
      }
    } catch (err) {
      console.error('Error procesando escaneo de vitrina:', err);
      setIsProcessing(false);
      scanLockRef.current = false;
      navigation.replace('AccessDenied', {
        title: 'Error de Procesamiento',
        message: 'Ocurrió un error inesperado al validar el acceso.',
        code: 'UNEXPECTED_ERROR'
      });
    }
  };

  // 1. Pantalla de carga mientras se consulta el permiso de cámara
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Comprobando permisos de cámara...</Text>
      </View>
    );
  }

  // 2. Pantalla si el permiso fue denegado o no concedido
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.permissionContent}>
          <View style={styles.permissionBadge}>
            <Text style={styles.permissionCameraIcon}>📷</Text>
          </View>
          <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
          <Text style={styles.permissionSubtitle}>
            Para escanear los códigos QR de las vitrinas físicas necesitamos acceso a la cámara de tu dispositivo.
          </Text>

          <View style={styles.permissionButtonWrapper}>
            {permission.canAskAgain ? (
              <PrimaryButton
                title="Permitir cámara"
                onPress={requestPermission}
                variant="primary"
              />
            ) : (
              <View>
                <Text style={styles.manualSettingsText}>
                  El permiso fue denegado anteriormente. Habilítalo en la configuración de la app:
                </Text>
                <PrimaryButton
                  title="Abrir ajustes del sistema"
                  onPress={() => Linking.openSettings()}
                  variant="primary"
                />
              </View>
            )}
            <PrimaryButton
              title="Volver al inicio"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Scanner Activo
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Visor de Cámara de Expo SDK 54 */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
        onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
      />

      {/* Overlay Oscuro con Visor Central */}
      <SafeAreaView style={styles.overlayContainer}>
        {/* Barra Superior con botón Volver */}
        <View style={styles.overlayHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (!isProcessing) navigation.goBack();
            }}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.liveStatusPill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveStatusText}>Buscando vitrina...</Text>
          </View>
        </View>

        {/* Marco de Escaneo Central */}
        <View style={styles.targetSection}>
          <View style={styles.targetFrame}>
            {/* Esquinas decorativas de tecnología */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.instructionText}>
            Coloca el código QR dentro del marco
          </Text>
          <Text style={styles.instructionSubtext}>
            La lectura es instantánea y automática
          </Text>
        </View>

        {/* Footer del Scanner */}
        <View style={styles.overlayFooter}>
          <Text style={styles.protocolBadge}>
            PROTOCOLO ANTI-REPLAY ACTIVO (30s)
          </Text>
        </View>

        {/* Modal de Procesamiento bloqueante */}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingTitle}>Validando acceso...</Text>
              <Text style={styles.processingStatusText}>{processingStatus}</Text>
              <Text style={styles.processingHint}>
                No muevas el dispositivo ni salgas de la app
              </Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  centerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 14
  },
  permissionSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  permissionBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  permissionCameraIcon: {
    fontSize: 32
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10
  },
  permissionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28
  },
  permissionButtonWrapper: {
    width: '100%'
  },
  manualSettingsText: {
    fontSize: 13,
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: 12
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  backButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600'
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8
  },
  liveStatusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700'
  },
  targetSection: {
    alignItems: 'center'
  },
  targetFrame: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.primary
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4
  },
  instructionText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center'
  },
  instructionSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  overlayFooter: {
    alignItems: 'center',
    marginBottom: 20
  },
  protocolBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 11, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 99
  },
  processingCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    width: '100%',
    maxWidth: 320,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
    letterSpacing: 0.5
  },
  processingStatusText: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 6,
    textAlign: 'center'
  },
  processingHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 16,
    textAlign: 'center'
  }
});

