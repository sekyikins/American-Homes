import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { supabase, withTimeout } from '../lib/supabase';
import { Lock } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword })
      );
      if (error) throw error;
      Alert.alert('Success', 'Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: SPACING.lg },
    inputContainer: { marginBottom: SPACING.lg },
    label: { ...typography.body, fontWeight: '600', marginBottom: SPACING.sm, color: colors.text },
    input: { ...commonStyles.input },
    button: { ...commonStyles.button, flexDirection: 'row', gap: SPACING.sm },
    buttonText: { ...commonStyles.buttonText },
    criteriaContainer: { borderWidth: 0.5, borderColor: colors.errorBorder, borderRadius: RADIUS.lg, padding: SPACING.xs },
    passwordCriteria: { color: colors.errorText, marginTop: SPACING.xs, paddingHorizontal: SPACING.xs, fontSize: FONT_SIZE.md },
    actionPad: { padding: SPACING.lg },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor={colors.textDim}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textDim}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textDim}
          />
        </View>

          <View style={styles.criteriaContainer}>
            <Text style={styles.passwordCriteria}>* Minimum 8 characters</Text>
            <Text style={styles.passwordCriteria}>* Include uppercase and lowercase letters</Text>
            <Text style={styles.passwordCriteria}>* Include at least one number or symbol</Text>
            <Text style={styles.passwordCriteria}>* Password confirmation must match new password</Text>
          </View>

      </ScrollView>
      <View style={styles.actionPad}>
        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading} activeOpacity={0.8}>
          <Lock size={18} color="#fff" />
          <Text style={styles.buttonText}>{loading ? 'Changing...' : 'Change Password'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
