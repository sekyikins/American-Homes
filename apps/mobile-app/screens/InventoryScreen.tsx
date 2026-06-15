import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';

import { useTheme } from '../styles/theme';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  serialized: boolean;
}

interface InventoryScreenProps {
  stockLevels: InventoryItem[];
  skuSearch: string;
  setSkuSearch: (text: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function InventoryScreen({
  stockLevels,
  skuSearch,
  setSkuSearch,
  refreshing = false,
  onRefresh,
}: InventoryScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const filteredItems = stockLevels.filter(
    (item) =>
      item.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(skuSearch.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }) => (
    <View
      style={[
        styles.listItem,
        index < filteredItems.length - 1 && styles.listItemBorder,
      ]}
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
    </View>
  );

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

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ── Static search header ───────────────────────────────────────────────────
  staticHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: 15, color: colors.text, fontWeight: '700' },
  itemSku: { fontSize: 12, color: colors.textMuted, marginTop: 3 },

  stockBadge: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 48,
    alignItems: 'center',
  },
  stockBadgeText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: colors.textDim, fontSize: 14 },
});
