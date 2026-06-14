import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';

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
}

export default function InventoryScreen({
  stockLevels,
  skuSearch,
  setSkuSearch,
}: InventoryScreenProps) {
  const filteredItems = stockLevels.filter(
    (item) =>
      item.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(skuSearch.toLowerCase())
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageSubtitle}>Query current remaining stock derived from ledger.</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Search by SKU or Product Name..."
          placeholderTextColor="#71717a"
          value={skuSearch}
          onChangeText={setSkuSearch}
        />

        <View style={styles.listContainer}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>
                  SKU: {item.sku} {item.serialized ? '• Serialized' : ''}
                </Text>
              </View>
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>{item.stock}</Text>
              </View>
            </View>
          ))}
          {filteredItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found matching "{skuSearch}"</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#fafafa',
    fontSize: 15,
  },
  listContainer: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 15,
    color: '#fafafa',
    fontWeight: '700',
  },
  itemSku: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 4,
  },
  stockBadge: {
    backgroundColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  stockBadgeText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
  },
});
