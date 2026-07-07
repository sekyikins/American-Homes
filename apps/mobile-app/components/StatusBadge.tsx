import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../styles/theme';

interface StatusBadgeProps {
  status: string;
  style?: StyleProp<ViewStyle>;
}

export default function StatusBadge({ status, style }: StatusBadgeProps) {
  const { colors, commonStyles } = useTheme();

  const getStatusConfig = (rawStatus: string) => {
    const s = rawStatus.toLowerCase().replace(/_/g, ' ');
    switch (s) {
      case 'paid':
        return {
          label: 'Paid',
          color: colors.successText || colors.success,
          bg: colors.successBg,
          border: colors.successBorder,
        };
      case 'partial':
        return {
          label: 'Partial',
          color: colors.pendingText || colors.pending,
          bg: colors.pendingBg,
          border: colors.pendingBorder,
        };
      case 'credit':
        return {
          label: 'Credit',
          color: colors.errorText || colors.error,
          bg: colors.errorBg,
          border: colors.errorBorder,
        };
      case 'in transit':
      case 'in_transit':
        return {
          label: 'In Transit',
          color: colors.primary,
          bg: colors.primary + '20',
          border: colors.primary + '40',
        };
      case 'received':
        return {
          label: 'Received',
          color: colors.successText || colors.success,
          bg: colors.successBg,
          border: colors.successBorder,
        };
      case 'pending':
        return {
          label: 'Pending',
          color: colors.pendingText || colors.pending,
          bg: colors.pendingBg,
          border: colors.pendingBorder,
        };
      case 'pending resolution':
      case 'pending_resolution':
      default:
        return {
          label: s.charAt(0).toUpperCase() + s.slice(1),
          color: colors.textDim,
          bg: colors.card,
          border: colors.border,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View
      style={[
        commonStyles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}
    >
      <Text style={[commonStyles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}
