import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../styles/theme';
import { Check } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

export default function LanguageSelectionScreen({ navigation }: Props) {
  const { colors, typography } = useTheme();
  const [selectedLang, setSelectedLang] = useState('en');

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    langBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
    },
    langBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    langText: { fontSize: 16, fontWeight: '600', color: colors.text },
    langTextActive: { color: colors.primary, fontWeight: '700' },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {languages.map(lang => {
          const isActive = selectedLang === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langBtn, isActive && styles.langBtnActive]}
              onPress={() => setSelectedLang(lang.code)}
            >
              <Text style={[styles.langText, isActive && styles.langTextActive]}>{lang.name}</Text>
              {isActive && <Check size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
