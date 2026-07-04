import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const { colors, commonStyles, typography } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Orders'>>();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState(route.params?.customerName || '');

  useEffect(() => {
    if (route.params?.customerName) {
      setSearchQuery(route.params.customerName);
    }
  }, [route.params?.customerName]);

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

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.payment_status === filter;
    const matchesSearch = searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        activeOpacity={0.7}
      >
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
      </TouchableOpacity>
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
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Order ID or customer name…"
          placeholderTextColor={colors.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
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

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { ...cs.container },

    searchBarContainer: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.xs,
      backgroundColor: colors.background,
    },
    searchInput: {
      ...cs.input,
      height: 40,
      paddingVertical: 0,
      fontSize: FONT_SIZE.md,
    },

    filterBar: { ...cs.filterBar },
    filterTab: { ...cs.filterTab },
    filterTabActive: { ...cs.filterTabActive },
    filterText: { ...cs.filterText },
    filterTextActive: { ...cs.filterTextActive },

    summaryBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    summaryCount: { fontSize: FONT_SIZE.md, color: colors.textDim },
    summaryRevenue: { fontSize: FONT_SIZE.body, fontWeight: '700', color: colors.text },

    center: { ...cs.center },
    list: { paddingHorizontal: 14, paddingBottom: 24, gap: 10 },

    orderCard: {
      flexDirection: 'row',
      ...cs.card,
    },
    orderStatusBar: { width: 3 },
    orderBody: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.lg - 2,
    },
    orderLeft: { flex: 1 },
    orderId: {
      fontSize: FONT_SIZE.body,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: 0.5,
    },
    orderCustomer: {
      fontSize: FONT_SIZE.lg,
      color: colors.textMuted,
      marginTop: 3,
    },
    orderDate: { ...typo.meta, marginTop: 2 },

    orderRight: { alignItems: 'flex-end', gap: SPACING.sm },
    orderTotal: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '800',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    statusBadge: {
      ...cs.badge,
      borderRadius: 7,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    statusText: { ...cs.badgeText },

    emptyContainer: {
      ...cs.emptyContainer,
      paddingTop: 80,
      paddingHorizontal: SPACING.xxxl,
    },
    emptyTitle: {
      ...typo.emptyTitle,
    },
    emptySubtitle: {
      ...typo.emptyBody,
      marginTop: SPACING.sm,
      lineHeight: 18,
    },
  });
