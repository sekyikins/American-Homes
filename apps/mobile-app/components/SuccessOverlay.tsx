import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import AppButton from './AppButton';

interface SuccessOverlayProps {
  visible: boolean;
  title?: string;
  message: string;
  onDone: () => void;
}

export default function SuccessOverlay({
  visible,
  title = 'Success!',
  message,
  onDone,
}: SuccessOverlayProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.iconBox, { backgroundColor: colors.successBg }]}>
          <CheckCircle size={52} color={colors.success} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textDim }]}>{message}</Text>
        <AppButton
          label="Done"
          onPress={onDone}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.btn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  iconBox: {
    padding: SPACING.xl,
    borderRadius: 999,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: FONT_SIZE.xl,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: '85%',
  },
  btn: {
    width: '100%',
  },
});
