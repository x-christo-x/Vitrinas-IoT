import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function LoadingScreen({ message = 'Iniciando sistema...' }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={styles.title}>VITRINA IoT</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  content: {
    alignItems: 'center'
  },
  indicatorContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center'
  }
});

