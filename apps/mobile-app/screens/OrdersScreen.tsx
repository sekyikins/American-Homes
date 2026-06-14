import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const dummyOrders = [
  { id: 'ORD-2026-904', date: 'June 14, 2026', total: '$1,450.00', status: 'Completed', customer: 'David Miller' },
  { id: 'ORD-2026-903', date: 'June 14, 2026', total: '$2,800.00', status: 'Pending Sync', customer: 'Sarah Jenkins' },
  { id: 'ORD-2026-902', date: 'June 13, 2026', total: '$890.00', status: 'Completed', customer: 'Robert Chen' },
];

export default function OrdersScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageSubtitle}>Manage sales, shipments, and customer orders.</Text>

      {/* Development Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerIcon}>✦</Text>
          <Text style={styles.bannerTitle}>Sales Integration Pending</Text>
        </View>
        <Text style={styles.bannerDescription}>
          The orders registry is currently operating in read-only offline mode. Full synchronization with the central POS ledger will be deployed in the next update.
        </Text>
      </View>

      {/* Mock Orders Grid */}
      <Text style={styles.sectionTitle}>Recent Orders (Offline Cache)</Text>
      <View style={styles.card}>
        {dummyOrders.map((order, idx) => {
          const isPending = order.status === 'Pending Sync';
          return (
            <View
              key={order.id}
              style={[
                styles.orderRow,
                idx < dummyOrders.length - 1 && styles.orderDivider,
              ]}
            >
              <View style={styles.orderLeft}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderMeta}>
                  {order.customer} • {order.date}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>{order.total}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isPending ? styles.statusPending : styles.statusCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isPending ? styles.statusTextPending : styles.statusTextCompleted,
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 6,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a1a1aa',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  banner: {
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#3730a3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bannerIcon: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '700',
  },
  bannerTitle: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '700',
  },
  bannerDescription: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fafafa',
  },
  orderMeta: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fafafa',
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    marginTop: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: '#022c22',
    borderColor: '#065f46',
  },
  statusPending: {
    backgroundColor: '#3b0764',
    borderColor: '#581c87',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#34d399',
  },
  statusTextPending: {
    color: '#c084fc',
  },
});
