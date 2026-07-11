/**
 * ModalPicker — reusable modal-overlay picker component.
 *
 * Usage:
 *   <ModalPicker
 *     visible={showPicker}
 *     title="Select Network"
 *     options={['Cash', 'Mobile Money', 'Bank Transfer']}
 *     selected="Cash"
 *     onSelect={(v) => { setVal(v); setShowPicker(false); }}
 *     onClose={() => setShowPicker(false)}
 *   />
 *
 *   Trigger button (use ModalPickerTrigger for consistent styling):
 *   <ModalPickerTrigger label="Cash" onPress={() => setShowPicker(true)} />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';

// ─── Trigger Button ───────────────────────────────────────────────────────────

interface TriggerProps {
  label: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ModalPickerTrigger({ label, placeholder, onPress, disabled }: TriggerProps) {
  const { colors } = useTheme();
  const isEmpty = !label || label === placeholder;

  return (
    <TouchableOpacity
      style={[triggerStyles.btn, { backgroundColor: colors.card, borderColor: colors.border }, disabled && triggerStyles.disabled]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <Text style={[triggerStyles.text, { color: isEmpty ? colors.textDim : colors.text }]} numberOfLines={1}>
        {label || placeholder || 'Select…'}
      </Text>
      <ChevronDown size={18} color={colors.text} />
    </TouchableOpacity>
  );
}

const triggerStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
  },
  text: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    marginRight: SPACING.sm,
  },
  disabled: { opacity: 0.45 },
});

// ─── Modal Picker ─────────────────────────────────────────────────────────────

interface ModalPickerProps {
  visible: boolean;
  title?: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function ModalPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: ModalPickerProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={[overlayStyles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={onClose}>
        <View style={[overlayStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {title && (
            <View style={[overlayStyles.titleRow, { borderBottomColor: colors.border }]}>
              <Text style={[overlayStyles.titleText, { color: colors.textDim }]}>{title}</Text>
            </View>
          )}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {options.map((opt, idx) => {
              const isSelected = opt === selected;
              const isLast = idx === options.length - 1;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    overlayStyles.option,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.primary + '12' },
                  ]}
                  onPress={() => onSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[overlayStyles.optionText, { color: isSelected ? colors.primary : colors.text }, isSelected && { fontWeight: '700' }]}>
                    {opt}
                  </Text>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  sheet: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  titleRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  titleText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  optionText: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
  },
});
