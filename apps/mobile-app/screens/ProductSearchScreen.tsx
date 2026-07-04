import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Search, ChevronRight, Package } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductSearch'>;

export default function ProductSearchScreen({ navigation }: Props) {
  const { colors, typography } = useTheme();
  const { products, variants } = useMockData();
  const [query, setQuery] = useState('');

  const filteredProducts = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesName = p.name.toLowerCase().includes(q);
    const matchesCategory = p.category.toLowerCase().includes(q);
    
    // Check variant SKUs for this product
    const productVariants = variants.filter((v) => v.product_id === p.id);
    const matchesSku = productVariants.some((v) => v.sku.toLowerCase().includes(q));

    return matchesName || matchesCategory || matchesSku;
  });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, flex: 1 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      marginLeft: 8,
    },
    productCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    productInfo: { flex: 1, marginLeft: 12 },
    productName: { fontSize: 15, fontWeight: '700', color: colors.text },
    productCategory: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    emptyText: { textAlign: 'center', color: colors.textDim, marginTop: 40, fontSize: 14 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textDim} />
          <TextInput
            style={styles.input}
            placeholder="Search by name, SKU, or category..."
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={query ? filteredProducts : products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              activeOpacity={0.7}
            >
              <Package size={20} color={colors.primary} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
              </View>
              <ChevronRight size={18} color={colors.textDark} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching products found.</Text>
          }
        />
      </View>
    </View>
  );
}
