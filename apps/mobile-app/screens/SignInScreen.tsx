import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../styles/theme';
import { supabase } from '../lib/supabase';

interface SignInScreenProps {
  onSignInSuccess: () => void;
}

export default function SignInScreen({ onSignInSuccess }: SignInScreenProps) {
  const { colors, typography, commonStyles } = useTheme();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all input fields.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      onSignInSuccess();
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
    },
    logoContainer: {
      marginTop: 40,
      marginBottom: 20,
      alignItems: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 36,
      fontWeight: '800',
      color: '#fff',
    },
    title: {
      ...typography.title,
      textAlign: 'center',
      fontSize: 28,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.subtitle,
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      ...typography.body,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    input: {
      ...commonStyles.input,
    },
    button: {
      ...commonStyles.button,
      marginTop: 8,
    },
    buttonText: {
      ...commonStyles.buttonText,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>A</Text>
        </View>
      </View>

      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.textDim}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
