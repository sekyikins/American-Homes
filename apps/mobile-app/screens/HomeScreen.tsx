import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import { useTheme } from '../styles/theme';
import {
  Bell,
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [userName, setUserName] = useState('Kwame Asante');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const alertNotification = notifications.find(n => n.category === 'inventory' && !n.read);
  const alertText =
    (alertNotification ? alertNotification.body : null) ||
    'Apple AirPods Pro stock is low (8 units). Reorder required.';

  const activeShipments = shipments
    .filter(s => s.status === 'in_transit' || s.status === 'pending')
    .slice(0, 2);

  const visibleTasks = tasks.slice(0, 3);
  const displayBalance = `$${Math.round(walletBalance).toLocaleString()}`;

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      if (profile?.name) setUserName(profile.name);
    } catch (e) {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'in_transit') return { label: 'In Transit', color: colors.primary, bg: colors.primary + '20', border: colors.primary + '40' };
    if (status === 'received') return { label: 'Received', color: colors.success, bg: colors.successBg, border: colors.successBorder };
    return { label: 'Pending', color: colors.pending, bg: colors.pendingBg, border: colors.pendingBorder };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Greeting Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSub}>{greeting()}</Text>
            <Text style={styles.greetingName}>{loading ? '...' : userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.75}
          >
            <Bell size={17} color={colors.text} />
            {unreadCount > 0 && <View style={styles.bellBadge} />}
          </TouchableOpacity>
        </View>

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
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.8}
        >
          <TriangleAlert size={14} color={colors.error} />
          <Text style={styles.alertText}>{alertText}</Text>
          <ChevronRight size={12} color={colors.error} />
        </TouchableOpacity>

        {/* Assigned Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Tasks</Text>
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
          <Text style={styles.sectionTitle}>Shipment Status</Text>
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
          <Text style={styles.sectionTitle}>Quick Access</Text>
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
              <View><Text style={styles.quickLabel}>Reports</Text><Text style={styles.quickSub}>Supervisor only</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('SyncCenter')} activeOpacity={0.8}>
              <View style={styles.quickIconBox}><RefreshCw size={15} color={colors.primary} /></View>
              <View><Text style={styles.quickLabel}>Sync Center</Text><Text style={styles.quickSub}>3 pending</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  greetingSub: { fontSize: 11, color: colors.textDim, lineHeight: 16 },
  greetingName: { fontSize: 17, fontWeight: '700', color: colors.text, lineHeight: 24 },
  bellBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#fb2c36', borderWidth: 1, borderColor: colors.background },
  walletCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  walletLabel: { fontSize: 11, color: '#c6d2ff', lineHeight: 16 },
  walletAmount: { fontSize: 30, fontWeight: '700', color: '#ffffff', lineHeight: 36, marginTop: 4, fontVariant: ['tabular-nums'] },
  walletActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  walletBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  walletBtnText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  alertBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 12, padding: 12, marginBottom: 18 },
  alertText: { flex: 1, fontSize: 12, fontWeight: '500', color: colors.errorText, lineHeight: 16 },
  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 20, marginBottom: 8 },
  viewAll: { fontSize: 12, fontWeight: '500', color: colors.primary, marginBottom: 8 },
  taskList: { gap: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  taskText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.textDim, opacity: 0.7 },
  shipmentList: { gap: 8 },
  shipmentCard: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  shipmentTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shipmentCode: { fontSize: 12, color: colors.textDim, fontFamily: 'monospace' },
  shipmentSupplier: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  shipmentEta: { fontSize: 11, color: colors.primary, marginTop: 3 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  quickIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  quickSub: { fontSize: 11, color: colors.primary, marginTop: 1 },
  emptyText: { fontSize: 13, color: colors.textDim, textAlign: 'center', paddingVertical: 8 },
});
