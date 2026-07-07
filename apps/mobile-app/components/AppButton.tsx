import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type AppButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    sizeStyles(size),
    variantStyle(variant, colors, isDisabled),
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textColor = getTextColor(variant, colors, isDisabled);

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.78}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[styles.label, sizeLabelStyles(size), { color: textColor }]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Variant styles ───────────────────────────────────────────────────────────

function variantStyle(variant: AppButtonVariant, colors: any, disabled: boolean) {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: disabled ? colors.border : colors.primary,
        borderWidth: 0,
      };
    case 'secondary':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: disabled ? colors.border : colors.primary,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
    case 'danger':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: disabled ? colors.border : colors.error,
      };
  }
}

function getTextColor(variant: AppButtonVariant, colors: any, disabled: boolean): string {
  if (disabled) return colors.textDim;
  switch (variant) {
    case 'primary':
      return '#ffffff';
    case 'secondary':
      return colors.primary;
    case 'ghost':
      return colors.primary;
    case 'danger':
      return colors.error;
  }
}

// ─── Size styles ─────────────────────────────────────────────────────────────

function sizeStyles(size: AppButtonSize): object {
  switch (size) {
    case 'sm':
      return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md };
    case 'md':
      return { paddingVertical: 13, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.md };
    case 'lg':
      return { paddingVertical: 16, paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.md };
  }
}

function sizeLabelStyles(size: AppButtonSize): object {
  switch (size) {
    case 'sm':
      return { fontSize: FONT_SIZE.md, fontWeight: '600' as const };
    case 'md':
      return { fontSize: FONT_SIZE.xl, fontWeight: '700' as const };
    case 'lg':
      return { fontSize: FONT_SIZE.xl, fontWeight: '700' as const };
  }
}

// ─── Base styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
  label: {
    // color and fontSize set dynamically
  },
});
