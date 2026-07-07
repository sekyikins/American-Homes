import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../styles/theme';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  variant?: 'default' | 'compact' | 'uppercase';
  style?: StyleProp<ViewStyle>;
}

export default function SectionHeader({
  title,
  onViewAll,
  viewAllLabel = 'View All',
  variant = 'default',
  style,
}: SectionHeaderProps) {
  const { typography, commonStyles } = useTheme();

  const getTitleStyle = () => {
    switch (variant) {
      case 'compact':
        return typography.sectionTitleCompact;
      case 'uppercase':
        return { ...typography.sectionTitleUppercase, marginBottom: 0 }; // Remove margin bottom as it is handled by container layout
      default:
        return typography.sectionTitle;
    }
  };

  return (
    <View style={[commonStyles.sectionHeader, styles.container, style]}>
      <Text style={getTitleStyle()}>
        {title}
      </Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={typography.viewAllLink}>{viewAllLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
