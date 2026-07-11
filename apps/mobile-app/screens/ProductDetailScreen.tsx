import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ArrowUpDown, Hammer, FileWarning } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import StickyScrollView from '../components/StickyScrollView';

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
    content: { padding: SPACING.lg },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    productName: { fontSize: FONT_SIZE.title, fontWeight: '700', color: colors.text, marginBottom: SPACING.xs },
    productCategory: { fontSize: FONT_SIZE.body, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', marginBottom: SPACING.md },
    productDesc: { fontSize: FONT_SIZE.lg, color: colors.textMuted, lineHeight: 20 },
    statsRow: { flexDirection: 'row', gap: SPACING.md, marginVertical: SPACING.md },
    statBox: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      alignItems: 'center',
    },
    statValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: FONT_SIZE.sm, color: colors.textDim, marginTop: SPACING.xs },
    variantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    variantSku: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text },
    variantName: { fontSize: FONT_SIZE.md, color: colors.textDim },
    priceRight: { marginLeft: 'auto', alignItems: 'flex-end' },
    retailPrice: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.success },
    costPrice: { fontSize: FONT_SIZE.md, color: colors.textDim },
    batchRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    batchInfo: { fontSize: FONT_SIZE.body, color: colors.text },
    batchRemaining: { fontSize: FONT_SIZE.body, fontWeight: '700', color: colors.textMuted },
    unitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    serialText: { fontSize: FONT_SIZE.body, color: colors.text, flex: 1 },
    unitStatus: {
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
    },
    unitStatusText: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase' },
    actionsContainer: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, marginBottom: SPACING.xl },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      gap: SPACING.sm,
    },
    actionBtnText: { fontSize: FONT_SIZE.body, fontWeight: '700' },
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
      <StickyScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
      </StickyScrollView>
    </View>
  );
}
