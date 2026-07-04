import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../styles/theme';
import { Play, MapPin, Tag } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryCount'>;

const locations = ['Austin Hub A', 'Austin Hub B', 'Dallas Warehouse'];
const categories = ['All', 'Electronics', 'Appliances', 'Kitchen', 'Bedding', 'Lighting'];

export default function InventoryCountScreen({ navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      minWidth: '45%',
      gap: 8,
    },
    optionBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    optionText: { fontSize: 14, fontWeight: '600', color: colors.text },
    optionTextActive: { color: colors.primary, fontWeight: '700' },
    startBtn: {
      ...commonStyles.button,
      marginTop: 20,
      flexDirection: 'row',
      gap: 8,
    },
    startBtnText: { ...commonStyles.buttonText },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Select Location</Text>
        <View style={styles.grid}>
          {locations.map((loc) => {
            const isActive = selectedLocation === loc;
            return (
              <TouchableOpacity
                key={loc}
                style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                onPress={() => setSelectedLocation(loc)}
              >
                <MapPin size={16} color={isActive ? colors.primary : colors.textDim} />
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{loc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Select Product Category</Text>
        <View style={styles.grid}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Tag size={16} color={isActive ? colors.primary : colors.textDim} />
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('InventoryCountStep2', { location: selectedLocation, category: selectedCategory })}
          activeOpacity={0.8}
        >
          <Play size={18} color="#fff" />
          <Text style={styles.startBtnText}>Start Counting</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
