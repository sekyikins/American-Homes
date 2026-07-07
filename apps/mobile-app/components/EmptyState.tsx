import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme, SPACING } from '../styles/theme';

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title?: string;
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({ icon: IconComponent, title, message, style }: EmptyStateProps) {
  const { colors, typography, commonStyles } = useTheme();

  return (
    <View style={[commonStyles.emptyContainer, styles.container, style]}>
      {IconComponent && (
        <View style={styles.iconContainer}>
          <IconComponent size={48} color={colors.textDark} />
        </View>
      )}
      {title && (
        <Text style={typography.emptyTitle}>
          {title}
        </Text>
      )}
      {message && (
        <Text style={[typography.emptyBody, styles.message]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  message: {
    marginTop: SPACING.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
});
