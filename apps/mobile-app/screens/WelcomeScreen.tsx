import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../styles/theme';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const { colors, typography, commonStyles } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: 40,
    },
    logo: {
      width: 100,
      height: 100,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 48,
      fontWeight: '800',
      color: '#fff',
    },
    title: {
      ...typography.title,
      fontSize: 32,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 12,
      maxWidth: '80%',
    },
    bottomContainer: {
      marginTop: 'auto',
      paddingBottom: 40,
    },
    button: {
      ...commonStyles.button,
      width: '100%',
    },
    buttonText: {
      ...commonStyles.buttonText,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>A</Text>
          </View>
        </View>
        <Text style={styles.title}>American Home Ventures</Text>
        <Text style={styles.subtitle}>
          Manage your inventory, shipments, and operations from anywhere
        </Text>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.button} onPress={onGetStarted} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
