import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { supabase, withTimeout } from '../lib/supabase';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Shipment = {
  id: string;
  shipment_code: string;
  supplier_name?: string;
  supplier_location?: string;
  units_count?: number;
  skus_count?: number;
  supplier_country: string;
  status: 'pending' | 'in_transit' | 'received';
  arrival_date: string | null;
  total_cost: number;
};

export default function ShipmentsScreen() {
  const { colors, commonStyles, typography } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const mockData = useMockData();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  const fetchShipments = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (error) {
        console.warn('Supabase error (shipments):', error.message);
      }

      if (data && data.length > 0) {
        setShipments(data as Shipment[]);
      } else {
        // Fallback to unified mock data
        setShipments(mockData.shipments);
      }
    } catch (e) {
      console.warn('Error fetching shipments:', e);
      setShipments(mockData.shipments);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShipments(true);
    setRefreshing(false);
  };

  const formatArrivalDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    return dateStr;
  };

  const renderItem = ({ item }: { item: Shipment }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ShipmentDetail', { shipmentId: item.id })}
        activeOpacity={0.8}
      >
        {/* Top Row: Code & Status */}
        <View style={styles.cardTopRow}>
          <Text style={styles.shipmentCode}>{item.shipment_code}</Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Middle: Supplier Name */}
        <Text style={styles.supplierName}>{item.supplier_name || 'Direct Load'}</Text>

        {/* Location */}
        <Text style={styles.locationText}>
          {item.supplier_location || item.supplier_country}
        </Text>

        {/* Bottom details */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.bottomDetailText}>
            {item.units_count || 0} units · {item.skus_count || 0} SKUs
          </Text>
          <Text style={styles.bottomDetailText}>
            {item.status === 'received' ? 'Received' : `ETA: ${formatArrivalDate(item.arrival_date)}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shipments}
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
          <EmptyState title="No shipments recorded" message="No shipments recorded yet." />
        }
      />
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  container: {
    ...cs.container,
  },
  listContent: {
    padding: SPACING.lg,
  },
  center: {
    ...cs.center,
  },
  card: {
    ...cs.cardPadded,
    marginBottom: SPACING.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shipmentCode: {
    ...typo.mono,
  },
  supplierName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: SPACING.sm,
  },
  locationText: {
    fontSize: FONT_SIZE.md,
    color: colors.textDim,
    marginTop: SPACING.xs,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomDetailText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textMuted,
  },
});
