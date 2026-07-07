import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { CheckCircle, Plus, Minus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryCountStep2'>;

export default function InventoryCountStep2Screen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { products, batches, addDiscrepancyReport } = useMockData();
  const { category, location } = route.params;

  // Filter products by category
  const filteredProducts = products.filter(
    (p) => category === 'All' || p.category.toLowerCase() === category.toLowerCase()
  );

  // Map product to system quantity (sum of remaining_quantity in all batches)
  const getSystemQty = (productId: string) => {
    return batches
      .filter((b) => b.product_id === productId)
      .reduce((sum, b) => sum + b.remaining_quantity, 0);
  };

  // State keeping track of counts: record of productId -> number
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    filteredProducts.forEach((p) => {
      initialCounts[p.id] = getSystemQty(p.id);
    });
    setCounts(initialCounts);
  }, [products, batches]);

  const updateCount = (productId: string, val: string) => {
    const parsed = parseInt(val);
    setCounts((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const adjustVal = (productId: string, amount: number) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + amount),
    }));
  };

  const handleFinishCount = () => {
    // Generate discrepancy reports for any mismatches
    let countMismatches = 0;
    filteredProducts.forEach((p) => {
      const expected = getSystemQty(p.id);
      const actual = counts[p.id] !== undefined ? counts[p.id] : expected;
      if (expected !== actual) {
        addDiscrepancyReport(
          p.id,
          expected,
          actual,
          `Audit mismatch from physical cycle count at ${location}. Expected: ${expected}, Counted: ${actual}.`
        );
        countMismatches++;
      }
    });

    setSuccessMsg(`Audit cycle count submitted. Logged ${countMismatches} inventory discrepancies and updated system records.`);
    setSuccessVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subTitle: { fontSize: 13, color: colors.textDim, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.backgroundDark },
    list: { flex: 1, padding: 16 },
    countCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    productName: { fontSize: 15, fontWeight: '700', color: colors.text },
    productSku: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    controlsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    systemQtyText: { fontSize: 13, color: colors.textMuted },
    counterGroup: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 8 },
    counterBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      width: 60,
      height: 36,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
      textAlign: 'center',
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    footer: { padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.subTitle}>
          Location: {location}  •  Category: {category}
        </Text>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const systemQty = getSystemQty(item.id);
            const currentVal = counts[item.id] !== undefined ? counts[item.id] : systemQty;
            return (
              <View style={styles.countCard}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSku}>Category: {item.category}</Text>
                <View style={styles.controlsRow}>
                  <Text style={styles.systemQtyText}>System: {systemQty} units</Text>
                  <View style={styles.counterGroup}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => adjustVal(item.id, -1)}>
                      <Minus size={16} color={colors.text} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(currentVal)}
                      onChangeText={(val) => updateCount(item.id, val)}
                    />
                    <TouchableOpacity style={styles.counterBtn} onPress={() => adjustVal(item.id, 1)}>
                      <Plus size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.footer}>
          <AppButton
            label="Submit Audit Count"
            onPress={handleFinishCount}
            variant="primary"
            icon={<CheckCircle size={18} color="#fff" />}
            fullWidth
          />
        </View>
      </View>

      <SuccessOverlay
        visible={successVisible}
        title="Cycle Count Complete"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.navigate('Main', { screen: 'HomeTab' });
        }}
      />
    </KeyboardAvoidingView>
  );
}
