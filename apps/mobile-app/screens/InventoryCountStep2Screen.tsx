import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { CheckCircle, Plus, Minus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryCountStep2'>;

export default function InventoryCountStep2Screen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { products, batches, addDiscrepancyReport } = useMockData();
  const { location, category } = route.params;

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Filter products by category if needed
  const filteredProducts = products.filter(p => {
    if (category === 'All') return true;
    return p.category.toLowerCase() === category.toLowerCase();
  });

  // Calculate system stock for comparison
  const getSystemQty = (productId: string) => {
    return batches
      .filter(b => b.product_id === productId)
      .reduce((sum, b) => sum + b.remaining_quantity, 0);
  };

  const handleIncrement = (productId: string, step: number) => {
    const systemQty = getSystemQty(productId);
    const current = counts[productId] !== undefined ? counts[productId] : systemQty;
    const newVal = Math.max(0, current + step);
    setCounts(prev => ({ ...prev, [productId]: newVal }));
  };

  const handleInputChange = (productId: string, val: string) => {
    const parsed = parseInt(val);
    if (!val) {
      setCounts(prev => ({ ...prev, [productId]: 0 }));
      return;
    }
    if (!isNaN(parsed)) {
      setCounts(prev => ({ ...prev, [productId]: parsed }));
    }
  };

  const handleSubmit = () => {
    let countMismatches = 0;

    filteredProducts.forEach(prod => {
      const systemQty = getSystemQty(prod.id);
      const physicalQty = counts[prod.id] !== undefined ? counts[prod.id] : systemQty;

      if (systemQty !== physicalQty) {
        countMismatches++;
        // Log a discrepancy report automatically
        addDiscrepancyReport(
          prod.id,
          systemQty,
          physicalQty,
          `Audit mismatch count at ${location}. System: ${systemQty}, Physical: ${physicalQty}.`
        );
      }
    });

    setSuccessMsg(`Audit cycle count submitted. Logged ${countMismatches} inventory discrepancies and updated system records.`);
    setSuccessVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subTitle: { fontSize: FONT_SIZE.body, color: colors.textDim, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: colors.backgroundDark },
    list: { flex: 1, padding: SPACING.lg },
    countCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
    },
    productName: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text },
    productSku: { fontSize: FONT_SIZE.md, color: colors.textDim },
    controlsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border },
    systemQtyText: { fontSize: FONT_SIZE.body, color: colors.textMuted },
    counterGroup: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: SPACING.sm },
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
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: colors.background,
      textAlign: 'center',
      color: colors.text,
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
    },
    footer: { padding: SPACING.lg, paddingTop: SPACING.sm },
    listContainer: { paddingBottom: SPACING.lg },
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
          contentContainerStyle={styles.listContainer}
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
                    <TouchableOpacity style={styles.counterBtn} onPress={() => handleIncrement(item.id, -1)}>
                      <Minus size={16} color={colors.text} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(currentVal)}
                      onChangeText={(val) => handleInputChange(item.id, val)}
                    />
                    <TouchableOpacity style={styles.counterBtn} onPress={() => handleIncrement(item.id, 1)}>
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
            onPress={handleSubmit}
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
          navigation.navigate('Main', { screen: 'OperationsTab' });
        }}
      />
    </KeyboardAvoidingView>
  );
}
