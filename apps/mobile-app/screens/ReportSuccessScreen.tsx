import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../styles/theme';
import { CheckCircle } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportSuccess'>;

export default function ReportSuccessScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { title = 'Success!', message = 'Your action was completed successfully.' } = route.params || {};

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center', alignItems: 'center' },
    iconContainer: { marginBottom: 24, backgroundColor: colors.successBg, padding: 16, borderRadius: 40 },
    title: { ...typography.title, marginBottom: 12, textAlign: 'center' },
    subtitle: { ...typography.subtitle, marginBottom: 40, textAlign: 'center', maxWidth: '80%' },
    button: { ...commonStyles.button, width: '100%' },
    buttonText: { ...commonStyles.buttonText },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CheckCircle size={48} color={colors.success} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}
