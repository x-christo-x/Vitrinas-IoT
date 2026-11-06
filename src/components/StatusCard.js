import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function StatusCard({
  label,
  value,
  status = 'default', // 'success' | 'danger' | 'warning' | 'info' | 'default'
  subtitle = null,
  highlight = false
}) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'success':
        return {
          backgroundColor: COLORS.successBackground,
          borderColor: 'rgba(16, 185, 129, 0.4)',
          textColor: COLORS.success
        };
      case 'danger':
        return {
          backgroundColor: COLORS.dangerBackground,
          borderColor: 'rgba(239, 68, 68, 0.4)',
          textColor: COLORS.danger
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warningBackground,
          borderColor: 'rgba(245, 158, 11, 0.4)',
          textColor: COLORS.warning
        };
      case 'info':
        return {
          backgroundColor: COLORS.primaryGlow,
          borderColor: COLORS.borderHighlight,
          textColor: COLORS.primary
        };
      default:
        return {
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderColor: COLORS.border,
          textColor: COLORS.text
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.card, highlight && styles.highlightedCard]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badge.backgroundColor,
              borderColor: badge.borderColor
            }
          ]}
        >
          <Text style={[styles.badgeText, { color: badge.textColor }]}>
            {value}
          </Text>
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  highlightedCard: {
    borderColor: COLORS.borderHighlight,
    backgroundColor: '#122035'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6
  }
});

