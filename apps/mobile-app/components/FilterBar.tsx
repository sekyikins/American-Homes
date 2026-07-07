import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../styles/theme';

export interface FilterOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  activeKey: string;
  onChange: (key: any) => void;
  isSegmented?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function FilterBar({
  options,
  activeKey,
  onChange,
  isSegmented = false,
  style,
}: FilterBarProps) {
  const { colors, commonStyles } = useTheme();

  const styles = StyleSheet.create({
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundDark,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    segmentBtnActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textDim,
    },
    segmentTextActive: {
      color: '#ffffff',
      fontWeight: '700',
    },
  });

  if (isSegmented) {
    return (
      <View style={[styles.segmentedContainer, style]}>
        {options.map((opt) => {
          const isActive = opt.key === activeKey;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[commonStyles.filterBar, style]}>
      {options.map((opt) => {
        const isActive = opt.key === activeKey;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              commonStyles.filterTab,
              isActive && commonStyles.filterTabActive,
            ]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                commonStyles.filterText,
                isActive && commonStyles.filterTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
