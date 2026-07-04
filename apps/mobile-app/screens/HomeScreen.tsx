import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import {
  TriangleAlert,
  ChevronRight,
  CircleCheck,
  Circle,
  Users,
  ShoppingBag,
  FileText,
  RefreshCw,
} from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Fixed gradient colors (intentional branded design element — not theme-dependent)
const INDIGO_START = '#4338ca';
const INDIGO_END = '#6366f1';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { tasks, toggleTaskStatus, shipments, notifications, walletBalance, customers, orders } = useMockData();
  const { colors, typography, commonStyles } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  const alertNotification = notifications.find(n => n.category === 'inventory' && !n.read);
  const alertText =
    (alertNotification ? alertNotification.body : null) ||
    'Apple AirPods Pro stock is low (8 units). Reorder required.';

  const activeShipments = shipments
    .filter(s => s.status === 'in_transit' || s.status === 'pending')
    .slice(0, 2);

  const visibleTasks = tasks.slice(0, 3);
  const displayBalance = `$${Math.round(walletBalance).toLocaleString()}`;

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulating refresh since user load is now in App.tsx
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'in_transit') return { label: 'In Transit', color: colors.primary, bg: colors.primary + '20', border: colors.primary + '40' };
    if (status === 'received') return { label: 'Received', color: colors.success, bg: colors.successBg, border: colors.successBorder };
    return { label: 'Pending', color: colors.pending, bg: colors.pendingBg, border: colors.pendingBorder };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Wallet Balance Card — intentional branded gradient */}
        <LinearGradient
          colors={[INDIGO_START, INDIGO_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>{displayBalance}</Text>
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={styles.walletBtn}
              onPress={() => navigation.navigate('Withdraw')}
              activeOpacity={0.8}
            >
              <Text style={styles.walletBtnText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.walletBtn}
              onPress={() => navigation.navigate('AllTransactions')}
              activeOpacity={0.8}
            >
              <Text style={styles.walletBtnText}>History</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Low Stock Alert Banner */}
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('TasksAndAlerts')}
          activeOpacity={0.8}
        >
          <TriangleAlert size={14} color={colors.error} />
          <Text style={styles.alertText}>{alertText}</Text>
          <ChevronRight size={12} color={colors.error} />
        </TouchableOpacity>

        {/* Assigned Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleCompact}>Assigned Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TasksAndAlerts')} activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.taskList}>
            {visibleTasks.map((task) => {
              const done = task.status === 'completed';
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => toggleTaskStatus(task.id)}
                  activeOpacity={0.75}
                >
                  {done ? (
                    <CircleCheck size={18} color={colors.success} />
                  ) : (
                    <Circle size={18} color={colors.primary} strokeWidth={1.5} />
                  )}
                  <Text style={[styles.taskText, done && styles.taskTextDone]} numberOfLines={1}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {visibleTasks.length === 0 && (
              <Text style={styles.emptyText}>No tasks assigned</Text>
            )}
          </View>
        </View>

        {/* Shipment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleCompact}>Shipment Status</Text>
          <View style={styles.shipmentList}>
            {activeShipments.map((s) => {
              const badge = getStatusBadge(s.status);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.shipmentCard}
                  onPress={() => navigation.navigate('ShipmentDetail', { shipmentId: s.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.shipmentTopRow}>
                    <Text style={styles.shipmentCode}>{s.shipment_code}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.shipmentSupplier}>{s.supplier_name || s.supplier_country}</Text>
                  {s.arrival_date != null && (
                    <Text style={styles.shipmentEta}>ETA: {s.arrival_date}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
            {activeShipments.length === 0 && (
              <View style={styles.shipmentCard}>
                <Text style={styles.emptyText}>No active shipments</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Access Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleCompact}>Quick Access</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Customers')} activeOpacity={0.8}>
              <View style={styles.quickIconBox}><Users size={15} color={colors.primary} /></View>
              <View><Text style={styles.quickLabel}>Customers</Text><Text style={styles.quickSub}>{customers.length} accounts</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Orders')} activeOpacity={0.8}>
              <View style={styles.quickIconBox}><ShoppingBag size={15} color={colors.primary} /></View>
              <View><Text style={styles.quickLabel}>Orders</Text><Text style={styles.quickSub}>{orders.length} total</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Reports')} activeOpacity={0.8}>
              <View style={styles.quickIconBox}><FileText size={15} color={colors.primary} /></View>
              <View><Text style={styles.quickLabel}>Reports</Text><Text style={styles.quickSub}>Log a report</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('SyncCenter')} activeOpacity={0.8}>
              <View style={styles.quickIconBox}><RefreshCw size={15} color={colors.primary} /></View>
              <View><Text style={styles.quickLabel}>Sync Center</Text><Text style={styles.quickSub}>3 pending</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  container: { ...cs.container },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: 0 },

  // ── Wallet Card (branded gradient — colors are intentional) ─────────────────
  walletCard: { borderRadius: RADIUS.lg + 4, padding: SPACING.lg, marginBottom: SPACING.md },
  walletLabel: { fontSize: FONT_SIZE.sm, color: '#c6d2ff', lineHeight: 16 },
  walletAmount: { fontSize: 30, fontWeight: '700', color: '#ffffff', lineHeight: 36, marginTop: SPACING.xs, fontVariant: ['tabular-nums'] },
  walletActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  walletBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.lg, paddingVertical: SPACING.sm, alignItems: 'center' },
  walletBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#ffffff' },

  // ── Alert Banner ────────────────────────────────────────────────────────────
  alertBanner: { ...cs.alertBanner, marginBottom: 18 },
  alertText: { ...cs.alertText },

  // ── Sections ────────────────────────────────────────────────────────────────
  section: { marginBottom: 18 },
  sectionHeader: { ...cs.sectionHeader },
  sectionTitleCompact: { ...typo.sectionTitleCompact },
  viewAll: { ...typo.viewAllLink },

  // ── Tasks ───────────────────────────────────────────────────────────────────
  taskList: { gap: SPACING.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, ...cs.cardPadded, padding: SPACING.md },
  taskText: { flex: 1, fontSize: FONT_SIZE.body, color: colors.text, lineHeight: 18 },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.textDim, opacity: 0.7 },

  // ── Shipments ───────────────────────────────────────────────────────────────
  shipmentList: { gap: SPACING.sm },
  shipmentCard: { ...cs.cardPadded, padding: SPACING.md },
  shipmentTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shipmentCode: { ...typo.mono },
  shipmentSupplier: { fontSize: FONT_SIZE.body, fontWeight: '600', color: colors.text, marginTop: SPACING.xs },
  shipmentEta: { fontSize: FONT_SIZE.sm, color: colors.primary, marginTop: 3 },
  badge: { ...cs.badge },
  badgeText: { ...cs.badgeText },

  // ── Quick Access Grid ───────────────────────────────────────────────────────
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickCard: { width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: 10, ...cs.cardPadded, borderRadius: RADIUS.xl, padding: SPACING.md },
  quickIconBox: { ...cs.quickIconBox },
  quickLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text },
  quickSub: { fontSize: FONT_SIZE.sm, color: colors.primary, marginTop: 1 },

  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyText: { ...typo.emptyBody, paddingVertical: SPACING.sm },
});
