import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { Image } from 'react-native';
import logo from "../assets/icon.png";

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
      padding: SPACING.xl,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      margin: 0,
    },
    logo: {
      width: 200,
      height: 200,
      borderRadius: RADIUS.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 250,
      height: 250,
    },
    title: {
      ...typography.title,
      fontSize: FONT_SIZE.hero,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: FONT_SIZE.xl,
      textAlign: 'center',
      marginTop: SPACING.md,
      maxWidth: '80%',
    },
    bottomContainer: {
      marginTop: 'auto',
      paddingBottom: SPACING.xl,
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
            <Image
              source={logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
