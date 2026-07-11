import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import { Search } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryList'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InventoryItem {
  id: string;
  product_id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  serialized: boolean;
  batchIds: string[];
  shipmentCode: string | null;
}

export default function InventoryListScreen({ route }: Props) {
  const { colors, commonStyles, typography } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { products, variants, batches, shipments } = useMockData();

  const { category, serialized, shipmentId, warehouseLocation } = route.params;

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const styles = React.useMemo(
    () => createStyles(colors, commonStyles, typography),
    [colors, commonStyles, typography],
  );

  // Build stock map per product (summing across all batches, or specific shipment batch)
  const stockMap: Record<string, number> = {};
  const batchMap: Record<string, string[]> = {};

  batches.forEach((b) => {
    const matchesShipment = shipmentId === 'All' || b.shipment_id === shipmentId;
    if (matchesShipment) {
      stockMap[b.product_id] = (stockMap[b.product_id] || 0) + b.remaining_quantity;
      batchMap[b.product_id] = [...(batchMap[b.product_id] || []), b.id];
    }
  });

  // Build display items
  const allItems: InventoryItem[] = products
    .map((p) => {
      const variant = variants.find((v) => v.product_id === p.id);
      const shipment = shipmentId !== 'All'
        ? shipments.find((s) => s.id === shipmentId)
        : null;
      return {
        id: p.id,
        product_id: p.id,
        name: p.name,
        category: p.category,
        sku: variant?.sku || '—',
        stock: stockMap[p.id] || 0,
        serialized: p.has_serial,
        batchIds: batchMap[p.id] || [],
        shipmentCode: shipment?.shipment_code || null,
      };
    })
    .filter((item) => {
      // Filter by category
      if (category !== 'All' && item.category !== category) return false;
      // Filter by serialized
      if (serialized === 'Serialized' && !item.serialized) return false;
      if (serialized === 'Non-Serialized' && item.serialized) return false;
      // Only show products that have any stock in the chosen scope
      if (item.stock === 0 && shipmentId !== 'All') return false;
      return true;
    });

  const filteredItems = allItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Subtitle summary
  const summaryParts: string[] = [];
  if (category !== 'All') summaryParts.push(category);
  if (serialized !== 'All') summaryParts.push(serialized);
  if (shipmentId !== 'All') {
    const s = shipments.find((sh) => sh.id === shipmentId);
    if (s) summaryParts.push(s.shipment_code);
  }
  if (warehouseLocation !== 'All') summaryParts.push(warehouseLocation);
  const subtitle = summaryParts.length > 0 ? summaryParts.join('  ·  ') : 'All inventory';

  const renderItem = ({
    item,
    index,
  }: {
    item: InventoryItem;
    index: number;
  }) => {
    const isLow = item.stock > 0 && item.stock <= 5;
    const isOut = item.stock === 0;

    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          index < filteredItems.length - 1 && styles.listItemBorder,
        ]}
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item.product_id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>
            {item.category}
            {item.serialized ? '  ·  Serialized' : ''}
            {item.sku ? `  ·  ${item.sku}` : ''}
          </Text>
        </View>
        <View
          style={[
            styles.stockBadge,
            isLow && styles.stockBadgeLow,
            isOut && styles.stockBadgeOut,
          ]}
        >
          <Text
            style={[
              styles.stockBadgeText,
              isLow && styles.stockBadgeTextLow,
              isOut && styles.stockBadgeTextOut,
            ]}
          >
            {item.stock}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Static subtitle + search */}
      <View style={styles.staticHeader}>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        <View style={styles.searchRow}>
          <Search size={15} color={colors.textDim} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.input}
            placeholder="Search name or SKU…"
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
              {search
                ? `No products matching "${search}"`
                : 'No inventory matches these filters'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { ...cs.container },

    // ── Static header ───────────────────────────────────────────────────────
    staticHeader: {
      ...cs.staticHeader,
      paddingBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    subtitle: {
      fontSize: FONT_SIZE.sm,
      color: colors.textDim,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      paddingVertical: SPACING.sm + 3,
      fontSize: FONT_SIZE.body,
      color: colors.text,
    },

    // ── List ────────────────────────────────────────────────────────────────
    listContent: {
      paddingHorizontal: SPACING.lg,
    },
    listItem: { ...cs.listItem },
    listItemBorder: { ...cs.listItemDivider },
    itemInfo: { flex: 1, paddingRight: SPACING.md },
    itemName: {
      fontSize: FONT_SIZE.xl,
      color: colors.text,
      fontWeight: '700',
    },
    itemMeta: {
      fontSize: FONT_SIZE.sm,
      color: colors.textMuted,
    },

    // ── Stock badge variants ────────────────────────────────────────────────
    stockBadge: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 48,
      alignItems: 'center',
    },
    stockBadgeLow: {
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b18',
    },
    stockBadgeOut: {
      borderColor: colors.error,
      backgroundColor: colors.error + '15',
    },
    stockBadgeText: {
      color: colors.success,
      fontSize: FONT_SIZE.lg,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    stockBadgeTextLow: { color: '#f59e0b' },
    stockBadgeTextOut: { color: colors.error },

    // ── Empty ───────────────────────────────────────────────────────────────
    emptyContainer: { ...cs.emptyContainer },
    emptyText: { ...cs.emptyText },
  });
