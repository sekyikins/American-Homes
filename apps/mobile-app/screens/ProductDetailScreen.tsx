import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ArrowUpDown, Hammer, FileWarning } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { products, variants, batches, units, shipments } = useMockData();
  const { productId } = route.params;

  const product = products.find((p) => p.id === productId);

  const productVariants = variants.filter((v) => v.product_id === productId);
  const productBatches = batches.filter((b) => b.product_id === productId);
  
  // Total in-stock
  const totalStock = productBatches.reduce((sum, b) => sum + b.remaining_quantity, 0);

  // Serial units
  const productUnits = units.filter((u) => 
    productBatches.some((b) => b.id === u.batch_id)
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    productName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
    productCategory: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', marginBottom: 12 },
    productDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    statsRow: { flexDirection: 'row', gap: 12, marginVertical: 12 },
    statBox: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textDim, marginTop: 4 },
    variantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    variantSku: { fontSize: 14, fontWeight: '700', color: colors.text },
    variantName: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    priceRight: { marginLeft: 'auto', alignItems: 'flex-end' },
    retailPrice: { fontSize: 14, fontWeight: '700', color: colors.success },
    costPrice: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    batchRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    batchInfo: { fontSize: 13, color: colors.text },
    batchRemaining: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    unitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    serialText: { fontSize: 13, color: colors.text, flex: 1 },
    unitStatus: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    unitStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    actionsContainer: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700' },
  });

  if (!product) {
    return (
      <View style={styles.container}>
        <EmptyState title="Product not found" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.productCategory}>{product.category}</Text>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDesc}>{product.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalStock}</Text>
              <Text style={styles.statLabel}>Available Stock</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{product.has_serial ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Serialized</Text>
            </View>
          </View>
        </View>

        {/* Audit Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.background }]}
            onPress={() => navigation.navigate('StockAdjust', { productId: product.id })}
          >
            <ArrowUpDown size={16} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Adjust</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: colors.error, backgroundColor: colors.background }]}
            onPress={() => navigation.navigate('ReportDamage', { productId: product.id })}
          >
            <Hammer size={16} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Damage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: colors.pending, backgroundColor: colors.background }]}
            onPress={() => navigation.navigate('DiscrepancyReport', { productId: product.id })}
          >
            <FileWarning size={16} color={colors.pending} />
            <Text style={[styles.actionBtnText, { color: colors.pending }]}>Discrepancy</Text>
          </TouchableOpacity>
        </View>

        {/* Variants */}
        <SectionHeader title="Variants & Catalog Info" variant="uppercase" />
        <View style={styles.card}>
          {productVariants.map((v) => (
            <View key={v.id} style={styles.variantRow}>
              <View>
                <Text style={styles.variantSku}>{v.sku}</Text>
                <Text style={styles.variantName}>{v.variant_name}</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.retailPrice}>Retail: ${v.retail_price.toFixed(2)}</Text>
                <Text style={styles.costPrice}>Wholesale: ${v.wholesale_price.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Batches */}
        <SectionHeader title="Inventory Batches" variant="uppercase" />
        <View style={styles.card}>
          {productBatches.length === 0 ? (
            <EmptyState message="No batches available" />
          ) : (
            productBatches.map((b) => {
              const shipment = shipments.find(s => s.id === b.shipment_id);
              return (
                <View key={b.id} style={styles.batchRow}>
                  <Text style={styles.batchInfo}>
                    {shipment ? shipment.shipment_code : 'Direct Load'}  •  Cost: ${b.cost_price.toFixed(2)}
                  </Text>
                  <Text style={styles.batchRemaining}>
                    {b.remaining_quantity} / {b.quantity_received} left
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Serial Units */}
        {product.has_serial && (
          <>
            <SectionHeader title={`Serial Numbers (${productUnits.length})`} variant="uppercase" />
            <View style={styles.card}>
              {productUnits.length === 0 ? (
                <EmptyState message="No registered serial units" />
              ) : (
                productUnits.map((u) => {
                  const isAvailable = u.status === 'available';
                  const isDamaged = u.status === 'damaged';
                  const statusColors = isAvailable
                    ? { bg: colors.successBg, text: colors.successText }
                    : isDamaged
                    ? { bg: colors.errorBg, text: colors.errorText }
                    : { bg: colors.pendingBg, text: colors.pendingText };

                  return (
                    <View key={u.id} style={styles.unitRow}>
                      <Text style={styles.serialText}>{u.serial_number}</Text>
                      <View style={[styles.unitStatus, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.unitStatusText, { color: statusColors.text }]}>{u.status}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
