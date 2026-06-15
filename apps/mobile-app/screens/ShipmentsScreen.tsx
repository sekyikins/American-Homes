import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../styles/theme';

type Shipment = {
  id: string;
  shipment_code: string;
  supplier_country: string;
  status: 'pending' | 'in_transit' | 'received';
  arrival_date: string | null;
  total_cost: number;
  created_at: string;
};

export default function ShipmentsScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.warn('Supabase error (shipments):', error.message);
    if (data) setShipments(data as Shipment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShipments();
    setRefreshing(false);
  };

  const pending  = shipments.filter(s => s.status === 'pending').length;
  const transit  = shipments.filter(s => s.status === 'in_transit').length;
  const received = shipments.filter(s => s.status === 'received').length;

  const STATUS_CONFIG = {
    pending: {
      label: 'Pending',
      color: colors.textDim,
      bg: colors.card,
      border: colors.borderLight,
    },
    in_transit: {
      label: 'In Transit',
      color: colors.pending,
      bg: colors.pendingBg,
      border: colors.pendingBorder,
    },
    received: {
      label: 'Received',
      color: colors.success,
      bg: colors.successBg,
      border: colors.successBorder,
    },
  };

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'TBD';

  const formatCreated = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats row stays static at the top */}
      <View style={styles.staticHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.textDim }]}>{pending}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={[styles.statVal, { color: colors.pending }]}>{transit}</Text>
            <Text style={styles.statLbl}>In Transit</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={[styles.statVal, { color: colors.success }]}>{received}</Text>
            <Text style={styles.statLbl}>Received</Text>
          </View>
        </View>
      </View>

      {/* Shipment Cards List scrolls */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {shipments.map(ship => {
          const cfg = STATUS_CONFIG[ship.status] || STATUS_CONFIG.pending;
          return (
            <View key={ship.id} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.code}>{ship.shipment_code}</Text>
                  <Text style={styles.country}>{ship.supplier_country}</Text>
                </View>
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

              {/* Card footer */}
              <View style={styles.cardFooter}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>ARRIVAL</Text>
                  <Text style={styles.metaValue}>{formatDate(ship.arrival_date)}</Text>
                </View>
                <View style={[styles.metaItem, styles.metaBorder]}>
                  <Text style={styles.metaLabel}>COST</Text>
                  <Text style={styles.metaValue}>
                    ${Number(ship.total_cost).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.metaItem, styles.metaBorder]}>
                  <Text style={styles.metaLabel}>LOGGED</Text>
                  <Text style={styles.metaValue}>{formatCreated(ship.created_at)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {shipments.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No shipments recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Use the Admin Dashboard to log new import batches.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    staticHeader: { padding: 16, paddingBottom: 4 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36, gap: 12 },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    statBox: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
    statVal: {
      fontSize: 22,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    statLbl: { fontSize: 11, color: colors.textDim, marginTop: 3, fontWeight: '500' },

    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardTopLeft: { flex: 1 },
    code: { fontSize: 16, fontWeight: '700', color: colors.text },
    country: { fontSize: 12, color: colors.textDim, marginTop: 3 },
    statusBadge: {
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statusText: { fontSize: 12, fontWeight: '700' },

    cardFooter: { flexDirection: 'row' },
    metaItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    metaBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
    metaLabel: {
      fontSize: 9,
      color: colors.textDark,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    metaValue: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 3 },

    empty: { paddingVertical: 60, alignItems: 'center', gap: 8 },
    emptyText: {
      color: colors.textDim,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptySubtext: {
      color: colors.textDark,
      fontSize: 13,
      textAlign: 'center',
    },
  });
