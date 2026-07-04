import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InventoryItem {
  id: string;
  product_id?: string;
  name: string;
  sku: string;
  stock: number;
  serialized: boolean;
}

export default function InventoryScreen() {
  const { colors, commonStyles, typography } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);
  
  const { products, variants, batches } = useMockData();
  const [skuSearch, setSkuSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const stockMap: Record<string, number> = {};
  batches.forEach(b => {
    if (b.product_id) {
      stockMap[b.product_id] = (stockMap[b.product_id] || 0) + b.remaining_quantity;
    }
  });

  const stockLevels: InventoryItem[] = variants.map(v => {
    const prod = products.find(p => p.id === v.product_id);
    return {
      id: v.id,
      product_id: v.product_id,
      name: prod ? `${prod.name} (${v.variant_name})` : v.variant_name,
      sku: v.sku || '',
      stock: stockMap[v.product_id] || 0,
      serialized: prod?.has_serial || false,
    };
  });

  const filteredItems = stockLevels.filter(
    (item) =>
      item.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(skuSearch.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        index < filteredItems.length - 1 && styles.listItemBorder,
      ]}
      onPress={() => {
        if (item.product_id) {
          navigation.navigate('ProductDetail', { productId: item.product_id });
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSku}>
          SKU: {item.sku}{item.serialized ? '  ·  Serialized' : ''}
        </Text>
      </View>
      <View style={styles.stockBadge}>
        <Text style={styles.stockBadgeText}>{item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={styles.container}>
      {/* ── Static search header ──────────────────────────────────────────── */}
      <View style={styles.staticHeader}>
        <TextInput
          style={styles.input}
          placeholder="Search by SKU or product name…"
          placeholderTextColor={colors.textDim}
          value={skuSearch}
          onChangeText={setSkuSearch}
          returnKeyType="search"
        />
        {/* Quick nav shortcuts */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('Customers')} activeOpacity={0.75}>
            <Text style={styles.quickNavText}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('Shipments')} activeOpacity={0.75}>
            <Text style={styles.quickNavText}>Shipments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('ReceiveStock', {})} activeOpacity={0.75}>
            <Text style={styles.quickNavText}>Receive Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable inventory list ─────────────────────────────────────── */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {skuSearch
                ? `No products matching "${skuSearch}"`
                : 'No inventory data yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  container: { ...cs.container },

  // ── Static search header ───────────────────────────────────────────────────
  staticHeader: { ...cs.staticHeader },
  input: {
    ...cs.input,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: SPACING.sm + 3,
    paddingHorizontal: SPACING.xl - 6,
    fontSize: FONT_SIZE.lg,
    marginBottom: 10,
  },
  quickNavRow: { flexDirection: 'row', gap: SPACING.sm },
  quickNavBtn: { ...cs.chip },
  quickNavText: { ...cs.chipText },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 36,
  },
  listItem: { ...cs.listItem },
  listItemBorder: { ...cs.listItemDivider },
  itemInfo: { flex: 1, paddingRight: SPACING.md },
  itemName: { fontSize: FONT_SIZE.xl, color: colors.text, fontWeight: '700' },
  itemSku: { fontSize: FONT_SIZE.md, color: colors.textMuted, marginTop: 3 },

  stockBadge: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 48,
    alignItems: 'center',
  },
  stockBadgeText: {
    color: colors.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyContainer: { ...cs.emptyContainer },
  emptyText: { ...cs.emptyText },
});
