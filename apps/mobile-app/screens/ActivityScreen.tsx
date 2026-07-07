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
import { useTheme } from '../styles/theme';

type LogEntry = {
  id: string;
  action: string;
  details: any;
  created_at: string;
  user_id: string | null;
};

const ACTION_COLORS: Record<string, string> = {
  SERIAL_SCANNED:            '#22c55e',
  BATCH_CREATED:             '#6366f1',
  BATCH_RECEIVED:            '#6366f1',
  SHIPMENT_CREATED:          '#f59e0b',
  SHIPMENT_RECEIVED:         '#10b981',
  AGENT_COMMISSION_UPDATED:  '#8b5cf6',
  COMMISSION_CREDITED:       '#10b981',
  CREDIT_PAYMENT_RECORDED:   '#3b82f6',
  ORDER_SYNCED:              '#f97316',
  ORDER_SYNC_SUCCESS:        '#f97316',
  WITHDRAWAL_COMPLETED:      '#22c55e',
  WITHDRAWAL_FAILED:         '#ef4444',
};

// No external refreshKey — pull-to-refresh is handled internally
export default function ActivityScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 25;

  const fetchLogs = useCallback(async (reset = false) => {
    const start = reset ? 0 : offset;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('audit_logs')
          .select('id, action, details, created_at, user_id')
          .order('created_at', { ascending: false })
          .range(start, start + PAGE - 1)
      );

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
  }, [offset]);

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

  const filtered = search
    ? logs.filter(l => l.action.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const formatDetail = (log: LogEntry): string => {
    const d = log.details as any;
    if (!d) return '—';
    if (typeof d === 'string') return d;
    const parts = [
      d.message,
      d.serial_number && `SN: ${d.serial_number}`,
      d.order_id && `Order: ${String(d.order_id).slice(0, 8)}`,
      d.amount && `$${d.amount}`,
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
    const accent = ACTION_COLORS[item.action] || colors.textDim;
    return (
      <View style={styles.logRow}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={styles.logBody}>
          <View style={styles.logTop}>
            <View
              style={[
                styles.badge,
                { borderColor: accent + '55', backgroundColor: accent + '18' },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: accent }]}
                numberOfLines={1}
              >
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
          placeholder="Filter by action type..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
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
          onEndReached={() => !search && hasMore && fetchLogs()}
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
            !search && hasMore ? (
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
    searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
    searchInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      color: colors.text,
      fontSize: 14,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    list: { paddingHorizontal: 14, paddingBottom: 24, gap: 10, paddingTop: 8 },
    logRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    accentBar: { width: 3 },
    logBody: { flex: 1, padding: 12 },
    logTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    badge: {
      borderRadius: 5,
      borderWidth: 1,
      paddingHorizontal: 7,
      paddingVertical: 2,
      maxWidth: '65%',
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    logTime: {
      fontSize: 10,
      color: colors.textDark,
      fontVariant: ['tabular-nums'],
    },
    logDetail: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    loadMore: {
      margin: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 13,
      alignItems: 'center',
    },
    loadMoreText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    emptyText: { color: colors.textDim, fontSize: 14 },
  });
