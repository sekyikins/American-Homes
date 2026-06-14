import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Live Supabase Client
import { supabase } from '../lib/supabase';

const typeColors: Record<string, string> = {
  BATCH_CREATED: '#6366f1',
  BATCH_RECEIVED: '#6366f1',
  SERIAL_SCANNED: '#10b981',
  ORDER_SYNCED: '#f59e0b',
  ORDER_SYNC_SUCCESS: '#f59e0b',
};

export default function HomeScreen() {
  const [stats, setStats] = useState([
    { label: 'Total Products', value: '...', sublabel: 'Tracked SKUs' },
    { label: 'Total Stock', value: '...', sublabel: 'Units in store' },
    { label: 'Pending Batches', value: '...', sublabel: 'Awaiting receipt' },
    { label: 'Serialized', value: '...', sublabel: 'Products tracked' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHomeStats = async () => {
    try {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageSubtitle}>American Home Ventures — Warehouse Overview</Text>

      {/* KPI Cards */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statSub}>{stat.sublabel}</Text>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.card}>
        {recentActivity.map((entry, idx) => (
          <View
            key={entry.id}
            style={[styles.activityRow, idx < recentActivity.length - 1 && styles.activityDivider]}
          >
            <View style={[styles.activityDot, { backgroundColor: typeColors[entry.type] ?? '#52525b' }]} />
            <View style={styles.activityBody}>
              <Text style={styles.activityType}>{entry.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.activityDetail}>{entry.detail}</Text>
            </View>
            <Text style={styles.activityTime}>{entry.time}</Text>
          </View>
        ))}
        {recentActivity.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activity recorded in logs</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20, paddingBottom: 36 },
  pageSubtitle: { fontSize: 13, color: '#71717a', marginTop: 6, marginBottom: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#fafafa', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#a1a1aa', marginTop: 6 },
  statSub: { fontSize: 11, color: '#52525b', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#a1a1aa', marginBottom: 12, letterSpacing: 0.5 },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityDivider: { borderBottomWidth: 1, borderBottomColor: '#27272a' },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityBody: { flex: 1 },
  activityType: { fontSize: 11, fontWeight: '700', color: '#71717a', letterSpacing: 0.8, textTransform: 'uppercase' },
  activityDetail: { fontSize: 14, fontWeight: '500', color: '#e4e4e7', marginTop: 2 },
  activityTime: { fontSize: 12, color: '#52525b', fontVariant: ['tabular-nums'] },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
  },
});
