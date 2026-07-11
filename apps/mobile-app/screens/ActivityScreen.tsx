import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { supabase, withTimeout } from '../lib/supabase';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import {
  CheckCircle, Package, ScanLine, ShoppingCart,
  FileText, AlertTriangle, Wallet, RefreshCw, ClipboardList
} from 'lucide-react-native';

type LogEntry = {
  id: string;
  action: string;
  details: any;
  created_at: string;
  user_id: string | null;
};

// Map action strings to icon + accent color
const ACTION_META: Record<string, { color: string; icon: any }> = {
  SERIAL_SCANNED:             { color: '#22c55e', icon: ScanLine },
  BATCH_CREATED:              { color: '#6366f1', icon: Package },
  BATCH_RECEIVED:             { color: '#6366f1', icon: Package },
  SHIPMENT_CREATED:           { color: '#f59e0b', icon: Package },
  SHIPMENT_RECEIVED:          { color: '#10b981', icon: Package },
  AGENT_COMMISSION_UPDATED:   { color: '#8b5cf6', icon: Wallet },
  COMMISSION_CREDITED:        { color: '#10b981', icon: Wallet },
  CREDIT_PAYMENT_RECORDED:    { color: '#3b82f6', icon: Wallet },
  ORDER_SYNCED:               { color: '#f97316', icon: ShoppingCart },
  ORDER_SYNC_SUCCESS:         { color: '#f97316', icon: ShoppingCart },
  WITHDRAWAL_COMPLETED:       { color: '#22c55e', icon: Wallet },
  WITHDRAWAL_FAILED:          { color: '#ef4444', icon: Wallet },
  TASK_COMPLETED:             { color: '#10b981', icon: CheckCircle },
  INVENTORY_COUNT:            { color: '#6366f1', icon: ClipboardList },
  STOCK_ADJUSTED:             { color: '#f59e0b', icon: Package },
  ORDER_CREATED:              { color: '#f97316', icon: ShoppingCart },
  DISCREPANCY_REPORTED:       { color: '#ef4444', icon: AlertTriangle },
  DAMAGE_REPORTED:            { color: '#ef4444', icon: AlertTriangle },
  SHIPMENT_ISSUE_REPORTED:    { color: '#f59e0b', icon: FileText },
  CUSTOMER_DEBT_ADJUSTED:     { color: '#3b82f6', icon: Wallet },
  CUSTOMER_PAYMENT_RECORDED:  { color: '#10b981', icon: Wallet },
};

const FILTER_TABS = ['All', 'Inventory', 'Orders', 'Finance', 'Tasks'];
const FILTER_ACTIONS: Record<string, string[]> = {
  Inventory: ['SERIAL_SCANNED', 'BATCH_CREATED', 'BATCH_RECEIVED', 'SHIPMENT_RECEIVED', 'STOCK_ADJUSTED', 'INVENTORY_COUNT', 'DISCREPANCY_REPORTED', 'DAMAGE_REPORTED'],
  Orders: ['ORDER_SYNCED', 'ORDER_SYNC_SUCCESS', 'ORDER_CREATED'],
  Finance: ['COMMISSION_CREDITED', 'CREDIT_PAYMENT_RECORDED', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_FAILED', 'CUSTOMER_DEBT_ADJUSTED', 'CUSTOMER_PAYMENT_RECORDED', 'AGENT_COMMISSION_UPDATED'],
  Tasks: ['TASK_COMPLETED', 'SHIPMENT_ISSUE_REPORTED', 'SHIPMENT_CREATED'],
};

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { currentUser } = useMockData();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 30;

  const fetchLogs = useCallback(async (reset = false) => {
    const start = reset ? 0 : offset;
    try {
      let query = supabase
        .from('audit_logs')
        .select('id, action, details, created_at, user_id')
        .order('created_at', { ascending: false })
        .range(start, start + PAGE - 1);

      // Filter to current user's mobile-app activities if not admin
      if (currentUser && currentUser.role !== 'admin') {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await withTimeout(query);

      if (error) console.warn('Supabase error (audit_logs):', error.message);

      if (data) {
        setLogs(prev => (reset ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE);
        setOffset(start + data.length);
      }
    } catch (e) {
      console.warn('Error fetching logs:', e);
    } finally {
      setLoading(false);
    }
  }, [offset, currentUser]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setLogs([]);
    setLoading(true);
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    setLogs([]);
    await fetchLogs(true);
    setRefreshing(false);
  };

  const filtered = logs.filter(l => {
    const matchesSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && JSON.stringify(l.details).toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = activeFilter === 'All' ||
      (FILTER_ACTIONS[activeFilter] || []).some(a => l.action.includes(a));
    return matchesSearch && matchesFilter;
  });

  const formatDetail = (log: LogEntry): string => {
    const d = log.details as any;
    if (!d) return '—';
    if (typeof d === 'string') return d;
    const parts = [
      d.message,
      d.user_name && `By: ${d.user_name}`,
      d.serial_number && `SN: ${d.serial_number}`,
      d.order_id && `Order: ${String(d.order_id).slice(0, 8)}`,
      d.amount && `$${d.amount}`,
      d.product_name,
      d.task_title,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : JSON.stringify(d).slice(0, 80);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const renderItem = ({ item }: { item: LogEntry }) => {
    const meta = ACTION_META[item.action] || { color: colors.textDim, icon: FileText };
    const accent = meta.color;
    const IconComp = meta.icon;

    return (
      <View style={styles.logRow}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={[styles.iconBox, { backgroundColor: accent + '18' }]}>
          <IconComp size={16} color={accent} />
        </View>
        <View style={styles.logBody}>
          <View style={styles.logTop}>
            <View style={[styles.badge, { borderColor: accent + '55', backgroundColor: accent + '18' }]}>
              <Text style={[styles.badgeText, { color: accent }]} numberOfLines={1}>
                {item.action.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={styles.logTime}>{formatTime(item.created_at)}</Text>
          </View>
          <Text style={styles.logDetail} numberOfLines={2}>
            {formatDetail(item)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search activity..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterText, activeFilter === tab && styles.filterTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
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
          onEndReached={() => !search && activeFilter === 'All' && hasMore && fetchLogs()}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            !search && activeFilter === 'All' && hasMore ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => fetchLogs()}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No activity logs found</Text>
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
    searchWrap: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
    searchInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      color: colors.text,
      fontSize: FONT_SIZE.lg,
    },
    filterBar: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
      gap: SPACING.sm,
    },
    filterTab: {
      flex: 1,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: '600',
      color: colors.textMuted,
    },
    filterTextActive: { color: '#fff' },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md, paddingTop: SPACING.sm },
    logRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      alignItems: 'center',
    },
    accentBar: { width: 3, alignSelf: 'stretch' },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      margin: SPACING.md,
      flexShrink: 0,
    },
    logBody: { flex: 1, paddingVertical: SPACING.md, paddingRight: SPACING.md },
    logTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    badge: {
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      paddingHorizontal: 7,
      paddingVertical: 2,
      maxWidth: '65%',
    },
    badgeText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    logTime: {
      fontSize: FONT_SIZE.xs,
      color: colors.textDark,
    },
    logDetail: { fontSize: FONT_SIZE.md, color: colors.textMuted, lineHeight: 17 },
    loadMore: {
      margin: SPACING.lg,
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 13,
      alignItems: 'center',
    },
    loadMoreText: { color: colors.primary, fontSize: FONT_SIZE.lg, fontWeight: '600' },
    emptyText: { color: colors.textDim, fontSize: FONT_SIZE.lg },
  });
