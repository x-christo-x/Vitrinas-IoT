import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View
} from 'react-native';
import { COLORS } from '../theme/colors';

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  style,
  textStyle,
  icon = null
}) {
  const isActionDisabled = disabled || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'success':
        return styles.successContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isActionDisabled}
      style={[
        styles.baseButton,
        getContainerStyle(),
        isActionDisabled && styles.disabledContainer,
        style
      ]}
    >
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? COLORS.primary : COLORS.text}
          />
          <Text style={[styles.baseText, getTextStyle(), styles.loadingText]}>
            Procesando...
          </Text>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              isActionDisabled && styles.disabledText,
              textStyle
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  secondaryContainer: {
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  dangerContainer: {
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  successContainer: {
    backgroundColor: COLORS.success,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },
  disabledContainer: {
    opacity: 0.45,
    elevation: 0
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconContainer: {
    marginRight: 10
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  primaryText: {
    color: COLORS.textInverse
  },
  secondaryText: {
    color: COLORS.text
  },
  outlineText: {
    color: COLORS.primary
  },
  disabledText: {
    color: COLORS.textMuted
  },
  loadingText: {
    marginLeft: 8,
    color: COLORS.text
  }
});

