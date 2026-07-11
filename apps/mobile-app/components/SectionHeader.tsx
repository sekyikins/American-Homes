import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../styles/theme';
import { ReactNode } from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react-native'

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  onDropDown?: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'compact' | 'uppercase';
  style?: StyleProp<ViewStyle>;
}

export default function SectionHeader({
  title,
  onViewAll,
  viewAllLabel = 'VIEW ALL',
  onDropDown,
  icon,
  variant = 'compact',
  style,
}: SectionHeaderProps) {
  const { colors, typography, commonStyles } = useTheme();
  const resolvedIcon = icon ?? <ChevronDown size={24} color={colors.primary} />;

  const getTitleStyle = () => {
    switch (variant) {
      case 'compact':
        return { ...typography.sectionTitleCompact, marginBottom: 0 };
      case 'uppercase':
        return { ...typography.sectionTitleUppercase, marginBottom: 0 }; // Remove margin bottom as it is handled by container layout
      default:
        return typography.sectionTitle;
    }
  };

  return (
    <View style={[
      commonStyles.sectionHeader,
      { marginBottom: 0, backgroundColor: colors.background, padding: 8 },
      styles.container,
      style
    ]}>
      <Text style={getTitleStyle()}>
        {title}
      </Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={typography.viewAllLink}>{viewAllLabel}</Text>
        </TouchableOpacity>
      )}
      {onDropDown && (
        <TouchableOpacity onPress={onDropDown} activeOpacity={0.7}>
          <View>{resolvedIcon}</View>
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
