import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import {
  MapPin,
  Tag,
  Package,
  Layers,
  ChevronRight,
  Cpu,
} from 'lucide-react-native';
import SectionHeader from '../components/SectionHeader';
import AppButton from '../components/AppButton';
import StickyScrollView from '../components/StickyScrollView';

// InventoryScreen is used directly as a tab screen — it doesn't receive
// typed screen props, so we keep it prop-free and use useNavigation.
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WAREHOUSE_LOCATIONS = ['All', 'Austin Hub A', 'Austin Hub B', 'Dallas Warehouse'];
const SERIALIZED_OPTIONS = ['All', 'Serialized', 'Non-Serialized'];

export default function InventoryScreen() {
  const { colors, commonStyles } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { products, shipments } = useMockData();

  // Derive unique categories from products
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category))).sort()];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSerialized, setSelectedSerialized] = useState('All');
  const [selectedShipmentId, setSelectedShipmentId] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  const styles = React.useMemo(() => createStyles(colors, commonStyles), [colors, commonStyles]);

  const handleView = () => {
    navigation.navigate('InventoryList', {
      category: selectedCategory,
      serialized: selectedSerialized,
      shipmentId: selectedShipmentId,
      warehouseLocation: selectedWarehouse,
    });
  };

  return (
    <View style={styles.container}>
      <StickyScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Category */}
        <SectionHeader
          title="Product Category"
          variant="uppercase"
          style={{ marginBottom: SPACING.sm }}
        />
        <View style={styles.grid}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.75}
              >
                <Tag size={15} color={isActive ? colors.primary : colors.textDim} />
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Shipment / Batch Source */}
        <SectionHeader
          title="Shipment / Batch Source"
          variant="uppercase"
          style={{ marginBottom: SPACING.sm, marginTop: SPACING.xl }}
        />
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.optionBtn, selectedShipmentId === 'All' && styles.optionBtnActive]}
            onPress={() => setSelectedShipmentId('All')}
            activeOpacity={0.75}
          >
            <Layers size={15} color={selectedShipmentId === 'All' ? colors.primary : colors.textDim} />
            <Text style={[styles.optionText, selectedShipmentId === 'All' && styles.optionTextActive]}>
              All Shipments
            </Text>
          </TouchableOpacity>
          {shipments.map((s) => {
            const isActive = selectedShipmentId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                onPress={() => setSelectedShipmentId(s.id)}
                activeOpacity={0.75}
              >
                <Package size={15} color={isActive ? colors.primary : colors.textDim} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]} numberOfLines={1}>
                    {s.shipment_code}
                  </Text>
                  {s.supplier_name && (
                    <Text style={styles.optionSub} numberOfLines={1}>{s.supplier_name}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Warehouse Location */}
        <SectionHeader
          title="Warehouse Location"
          variant="uppercase"
          style={{ marginBottom: SPACING.sm, marginTop: SPACING.xl }}
        />
        <View style={styles.grid}>
          {WAREHOUSE_LOCATIONS.map((loc) => {
            const isActive = selectedWarehouse === loc;
            return (
              <TouchableOpacity
                key={loc}
                style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                onPress={() => setSelectedWarehouse(loc)}
                activeOpacity={0.75}
              >
                <MapPin size={15} color={isActive ? colors.primary : colors.textDim} />
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Serialized */}
        <SectionHeader
          title="Serialization"
          variant="uppercase"
          style={{ marginBottom: SPACING.sm, marginTop: SPACING.xl }}
        />
        <View style={styles.grid}>
          {SERIALIZED_OPTIONS.map((opt) => {
            const isActive = selectedSerialized === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                onPress={() => setSelectedSerialized(opt)}
                activeOpacity={0.75}
              >
                <Cpu size={15} color={isActive ? colors.primary : colors.textDim} />
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </StickyScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <AppButton
          label="View Inventory"
          onPress={handleView}
          variant="primary"
          icon={<ChevronRight size={18} color="#fff" />}
          fullWidth
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any, cs: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: SPACING.lg,
    },

    // ── Option grids ────────────────────────────────────────────────────────
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginBottom: SPACING.xs,
    },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
      minWidth: '47%',
      maxWidth: '100%',
    },
    optionBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    optionText: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
    },
    optionTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    optionSub: {
      fontSize: FONT_SIZE.xs,
      color: colors.textDim,
    },

    // ── Footer ──────────────────────────────────────────────────────────────
    footer: {
      padding: SPACING.lg,
      paddingTop: SPACING.md,
      backgroundColor: colors.background,
    },
  });
