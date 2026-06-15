import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../styles/theme';

type PaymentStatus = 'paid' | 'partial' | 'credit' | 'pending_resolution';

type Order = {
  id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  customer_name: string;
  customer_phone: string;
};

type FilterKey = 'all' | PaymentStatus;




const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'credit', label: 'Credit' },
  { key: 'partial', label: 'Partial' },
  { key: 'pending_resolution', label: 'Pending' },
];

export default function OrdersScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; color: string; bg: string; border: string }
  > = {
    paid: {
      label: 'Paid',
      color: colors.success,
      bg: colors.successBg,
      border: colors.successBorder,
    },
    partial: {
      label: 'Partial',
      color: colors.pending,
      bg: colors.pendingBg,
      border: colors.pendingBorder,
    },
    credit: {
      label: 'Credit',
      color: colors.error,
      bg: colors.errorBg,
      border: colors.errorBorder,
    },
    pending_resolution: {
      label: 'Pending',
      color: colors.textDim,
      bg: colors.card,
      border: colors.border,
    },
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, total_amount, payment_status, created_at, customers ( name, phone )'
      )
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) console.warn('Supabase error (orders):', error.message);

    if (data) {
      setOrders(
        data.map(o => ({
          id: o.id,
          total_amount: Number(o.total_amount) || 0,
          payment_status: (o.payment_status as PaymentStatus) || 'pending_resolution',
          created_at: o.created_at,
          customer_name: (o.customers as any)?.name || 'Walk-in Customer',
          customer_phone: (o.customers as any)?.phone || '',
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filtered =
    filter === 'all' ? orders : orders.filter(o => o.payment_status === filter);

  const totalRevenue = filtered.reduce((s, o) => s + o.total_amount, 0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const renderItem = ({ item }: { item: Order }) => {
    const cfg = STATUS_CONFIG[item.payment_status] || STATUS_CONFIG.pending_resolution;
    return (
      <View style={styles.orderCard}>
        <View style={[styles.orderStatusBar, { backgroundColor: cfg.color }]} />
        <View style={styles.orderBody}>
          <View style={styles.orderLeft}>
            <Text style={styles.orderId}>
              #{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderCustomer}>{item.customer_name}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>
              $
              {item.total_amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: cfg.bg, borderColor: cfg.border },
              ]}
            >
              <Text style={[styles.statusText, { color: cfg.color }]}>
                {cfg.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.summaryRevenue}>
          $
          {totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}{' '}
          total
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Orders created from the POS system will appear here.'
                  : `No ${filter} orders on record.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    filterBar: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
      gap: 6,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
    filterTextActive: { color: '#ffffff' },

    summaryBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    summaryCount: { fontSize: 12, color: colors.textDim },
    summaryRevenue: { fontSize: 13, fontWeight: '700', color: colors.text },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: { paddingHorizontal: 14, paddingBottom: 24, gap: 10 },

    orderCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    orderStatusBar: { width: 3 },
    orderBody: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
    },
    orderLeft: { flex: 1 },
    orderId: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: 0.5,
    },
    orderCustomer: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 3,
    },
    orderDate: { fontSize: 11, color: colors.textDim, marginTop: 2 },

    orderRight: { alignItems: 'flex-end', gap: 6 },
    orderTotal: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    statusBadge: {
      borderRadius: 7,
      borderWidth: 1,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textMuted,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textDim,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18,
    },
  });
