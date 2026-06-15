import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// Live Supabase Client
import { supabase } from '../lib/supabase';

// Global styling theme
import { useTheme } from '../styles/theme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const typeColors: Record<string, string> = {
    BATCH_CREATED: colors.primary,
    BATCH_RECEIVED: colors.primary,
    SERIAL_SCANNED: colors.success,
    ORDER_SYNCED: colors.pending,
    ORDER_SYNC_SUCCESS: colors.pending,
  };

  const [stats, setStats] = useState([
    { label: 'Total Products', value: '...', sublabel: 'Tracked SKUs' },
    { label: 'Total Stock', value: '...', sublabel: 'Units in store' },
    { label: 'Pending Batches', value: '...', sublabel: 'Awaiting receipt' },
    { label: 'Serialized', value: '...', sublabel: 'Products tracked' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamically measure the header height to avoid overlap on any device screen/font scale
  const [headerHeight, setHeaderHeight] = useState(300);

  const onHeaderLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height && height !== headerHeight) {
      setHeaderHeight(height);
    }
  };

  const fetchHomeStats = async () => {
    try {
      console.time('MobileHomeScreen-Supabase-Load');
      // Fetch stats and recent activity logs in parallel to optimize load speed
      const [prodCountResult, batchesResult, pendingCountResult, serializedCountResult, logsResult] = await Promise.all([
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('inventory_batches')
          .select('remaining_quantity'),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('has_serial', true),
        supabase
          .from('audit_logs')
          .select('id, action, details, created_at')
          .order('created_at', { ascending: false })
          .limit(4)
      ]);
      console.timeEnd('MobileHomeScreen-Supabase-Load');

      if (prodCountResult.error) console.warn('Supabase error (products count):', prodCountResult.error.message);
      if (batchesResult.error) console.warn('Supabase error (inventory_batches):', batchesResult.error.message);
      if (pendingCountResult.error) console.warn('Supabase error (shipments pending):', pendingCountResult.error.message);
      if (serializedCountResult.error) console.warn('Supabase error (products serialized):', serializedCountResult.error.message);
      if (logsResult.error) console.warn('Supabase error (audit_logs):', logsResult.error.message);

      const prodCount = prodCountResult.count;
      const batches = batchesResult.data;
      const pendingCount = pendingCountResult.count;
      const serializedCount = serializedCountResult.count;
      const logs = logsResult.data;

      const totalStock = (batches || []).reduce(
        (sum, b) => sum + (b.remaining_quantity || 0),
        0
      );

      setStats([
        { label: 'Total Products', value: String(prodCount || 0), sublabel: 'Tracked SKUs' },
        { label: 'Total Stock', value: String(totalStock), sublabel: 'Units in store' },
        { label: 'Pending Batches', value: String(pendingCount || 0), sublabel: 'Awaiting receipt' },
        { label: 'Serialized', value: String(serializedCount || 0), sublabel: 'Products tracked' },
      ]);

      if (logs) {
        const formattedActivity = logs.map((l) => {
          let detail = '';
          let type = l.action;

          const detailsObj = l.details as any;
          if (l.action === 'BATCH_CREATED') {
            detail = `${detailsObj?.product_name || 'Stock'} — ${detailsObj?.quantity || 0} units`;
          } else if (l.action === 'SERIAL_SCANNED') {
            detail = `${detailsObj?.serial_number || 'SN'} registered for ${detailsObj?.product_name || 'Product'}`;
          } else if (l.action === 'ORDER_SYNC_SUCCESS' || l.action === 'ORDER_SYNCED') {
            detail = `Synced Order #${detailsObj?.order_id?.slice(0, 8) || ''}. Value: $${detailsObj?.total || ''}`;
          } else {
            detail = typeof l.details === 'string' ? l.details : JSON.stringify(l.details || l.action);
          }

          // Format ISO time
          const date = new Date(l.created_at);
          const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: l.id,
            type,
            detail,
            time,
          };
        });
        setRecentActivity(formattedActivity);
      }
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable list content - covering full screen behind the static header */}
      <FlatList
        data={recentActivity}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => <View style={{ height: headerHeight }} />}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === recentActivity.length - 1;
          return (
            <View
              style={[
                styles.activityRowCard,
                isFirst && styles.activityRowFirst,
                isLast && styles.activityRowLast,
                !isLast && styles.activityRowDivider,
              ]}
            >
              <View style={[styles.activityDot, { backgroundColor: typeColors[item.type] ?? colors.textDim }]} />
              <View style={styles.activityBody}>
                <Text style={styles.activityType}>{item.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.activityDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activity recorded in logs</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        style={styles.activityList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* KPI Cards stay static at the top but pass gestures through to FlatList */}
      <View style={styles.staticHeader} onLayout={onHeaderLayout} pointerEvents="box-none">
        <View style={styles.statsGrid} pointerEvents="box-none">
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard} pointerEvents="none">
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sublabel}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle} pointerEvents="none">Recent Activity</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  staticHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  activityList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 6 },
  statSub: { fontSize: 11, color: colors.textDark, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  
  // Card row elements rendered to look like a unified card list
  activityRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 20,
  },
  activityRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  activityRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 20,
  },
  activityRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityBody: { flex: 1 },
  activityType: { fontSize: 11, fontWeight: '700', color: colors.textDim, letterSpacing: 0.8, textTransform: 'uppercase' },
  activityDetail: { fontSize: 14, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  activityTime: { fontSize: 12, color: colors.textDark, fontVariant: ['tabular-nums'] },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
  },
});
