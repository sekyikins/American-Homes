import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData, CustomerLedgerEntry } from '../context/MockDataContext';
import { ChevronRight, ShoppingCart, CreditCard, TrendingUp, TrendingDown, Receipt } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import StickyScrollView from '../components/StickyScrollView';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

// ─── Activity timeline helpers ────────────────────────────────────────────────

type OrderItem = {
  _source: 'order';
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
};

type LedgerItem = {
  _source: 'ledger';
} & CustomerLedgerEntry;

type ActivityItem = OrderItem | LedgerItem;

const ENTRY_CONFIG: Record<string, { label: string; colorKey: 'primary' | 'success' | 'error' | 'pending'; Icon: any }> = {
  PURCHASE:             { label: 'Purchase',             colorKey: 'primary',  Icon: ShoppingCart },
  PAYMENT:              { label: 'Payment Received',      colorKey: 'success',  Icon: CreditCard },
  ADJUSTMENT_INCREASE:  { label: 'Debt Increased',        colorKey: 'error',    Icon: TrendingUp },
  ADJUSTMENT_DECREASE:  { label: 'Balance Reduced',       colorKey: 'success',  Icon: TrendingDown },
};

const ORDER_STATUS_STYLE = (status: string, colors: any) => {
  switch (status) {
    case 'paid':    return { bg: colors.successBg, border: colors.successBorder, text: colors.successText, label: 'Paid' };
    case 'partial': return { bg: colors.pendingBg, border: colors.pendingBorder, text: colors.pendingText, label: 'Partial' };
    case 'credit':  return { bg: colors.errorBg,   border: colors.errorBorder,   text: colors.errorText,   label: 'Credit' };
    default:        return { bg: colors.errorBg,   border: colors.errorBorder,   text: colors.errorText,   label: status };
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerDetailScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { customers, orders, customerLedger } = useMockData();
  const { customerId } = route.params;

  const [showAllActivity, setShowAllActivity] = useState(false);
  const styles = React.useMemo(
    () => createStyles(colors, commonStyles, typography),
    [colors, commonStyles, typography]
  );

  const customer = customers.find((c) => c.id === customerId);
  const customerOrders = orders.filter((o) => o.customer_id === customerId);
  const ledgerEntries = customerLedger.filter((e) => e.customer_id === customerId);

  // Unified timeline sorted newest-first
  const timeline = useMemo<ActivityItem[]>(() => {
    const orderItems: OrderItem[] = customerOrders.map((o) => ({
      _source: 'order',
      id: o.id,
      created_at: o.created_at,
      total_amount: o.total_amount,
      payment_status: o.payment_status,
    }));
    const ledgerItems: LedgerItem[] = ledgerEntries.map((e) => ({
      _source: 'ledger',
      ...e,
    }));
    return [...orderItems, ...ledgerItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [customerOrders, ledgerEntries]);

  const visibleActivity = showAllActivity ? timeline : timeline.slice(0, 3);

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Customer not found</Text>
      </View>
    );
  }

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getCustomerCode = (id: string) => {
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    return !isNaN(num) ? `CST-${String(num).padStart(3, '0')}` : `CST-${id.slice(0, 3).toUpperCase()}`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const sortedOrders = [...customerOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].created_at.split('T')[0] : 'N/A';
  const accountType = customer.total_debt > 0 ? 'Credit' : 'Cash';

  // ── Activity item renderer ─────────────────────────────────────────────────
  const renderActivityItem = (item: ActivityItem, idx: number) => {
    const isLast = idx === visibleActivity.length - 1;

    if (item._source === 'order') {
      const s = ORDER_STATUS_STYLE(item.payment_status, colors);
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.activityRow, !isLast && styles.activityRowBorder]}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          activeOpacity={0.7}
        >
          <View style={[styles.activityIconBox, { backgroundColor: colors.primary + '18' }]}>
            <Receipt size={15} color={colors.primary} />
          </View>
          <View style={styles.activityBody}>
            <Text style={styles.activityTitle}>Order</Text>
            <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={[styles.activityAmount, { color: colors.primary }]}>
            ${item.total_amount.toFixed(2)}
          </Text>
          <View style={[styles.activityBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
            <Text style={[styles.activityBadgeText, { color: s.text }]}>{s.label}</Text>
          </View>
          <ChevronRight size={14} color={colors.textDark} />
        </TouchableOpacity>
      );
    }

    // Ledger entry
    const cfg = ENTRY_CONFIG[item.type] || ENTRY_CONFIG.PURCHASE;
    const accent = colors[cfg.colorKey] as string;
    const IconComp = cfg.Icon;
    const isDebt = item.type === 'PURCHASE' || item.type === 'ADJUSTMENT_INCREASE';

    return (
      <View
        key={item.id}
        style={[styles.activityRow, !isLast && styles.activityRowBorder]}
      >
        <View style={[styles.activityIconBox, { backgroundColor: accent + '18' }]}>
          <IconComp size={15} color={accent} />
        </View>
        <View style={styles.activityBody}>
          <Text style={styles.activityTitle}>{cfg.label}</Text>
          {item.description ? (
            <Text style={styles.activityNote} numberOfLines={1}>{item.description}</Text>
          ) : (
            <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text>
          )}
        </View>
        <Text style={[styles.activityAmount, { color: accent }]}>
          {isDebt ? '+' : '−'}${Math.abs(item.amount).toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StickyScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Profile ── */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerCode}>{getCustomerCode(customer.id)}</Text>
        </View>

        {/* ── Stat Cards ── */}
        <View style={styles.splitCardsRow}>
          <View style={styles.statCardHalf}>
            <Text style={styles.statNumber}>{customerOrders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          <TouchableOpacity
            style={[styles.statCardHalf, customer.total_debt !== 0 && styles.clickableCard]}
            disabled={customer.total_debt === 0}
            onPress={() => navigation.navigate('CustomerDebtManagement', { customerId: customer.id })}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.statNumber,
              customer.total_debt > 0 && { color: colors.error },
              customer.total_debt < 0 && { color: colors.success },
            ]}>
              ${customer.total_debt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statLabel}>
              {customer.total_debt > 0 ? 'Debt Balance' : customer.total_debt < 0 ? 'Prepaid Credit' : 'Credit Balance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Details Table ── */}
        <View style={styles.detailsTable}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Phone</Text>
            <Text style={styles.tableValue}>{customer.phone}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Address</Text>
            <Text style={[styles.tableValue, { maxWidth: '70%', textAlign: 'right' }]} numberOfLines={1}>
              {customer.address}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Last Order</Text>
            <Text style={styles.tableValue}>{lastOrderDate}</Text>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.tableLabel}>Account Type</Text>
            <Text style={styles.tableValue}>{accountType}</Text>
          </View>
        </View>

        {/* ── Activity Section ── */}
        <SectionHeader
          title="Activity"
          variant="compact"
          viewAllLabel={showAllActivity ? 'SHOW LESS' : `VIEW ALL (${timeline.length})`}
          onViewAll={timeline.length > 3 ? () => setShowAllActivity(v => !v) : undefined}
        />

        <View style={styles.activityCard}>
          {timeline.length === 0
            ? <EmptyState message="No activity yet" style={{ paddingVertical: SPACING.lg }} />
            : visibleActivity.map((item, idx) => renderActivityItem(item, idx))
          }
        </View>

      </StickyScrollView>

      {/* ── Bottom Action ── */}
      {customer.total_debt !== 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('CustomerDebtManagement', { customerId: customer.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.manageBtnText}>Manage Balance</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { ...cs.container },
    scrollContent: { padding: SPACING.lg },

    // Profile
    profileSection: { alignItems: 'center', marginBottom: SPACING.lg },
    avatar: {
      ...cs.avatar,
      marginBottom: SPACING.sm,
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary + '40',
    },
    avatarText: { ...cs.avatarText, color: colors.primary },
    customerName: { fontSize: FONT_SIZE.title, fontWeight: '700', color: colors.text, marginBottom: SPACING.xs },
    customerCode: { ...typo.meta, color: colors.textDim },

    // Stat cards
    splitCardsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
    statCardHalf: {
      flex: 1, ...cs.card, padding: SPACING.md, alignItems: 'center', justifyContent: 'center',
    },
    clickableCard: { borderColor: colors.primary, borderWidth: 1 },
    statNumber: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: colors.text },
    statLabel: {
      fontSize: FONT_SIZE.xs, color: colors.textDim, textTransform: 'uppercase', fontWeight: '600',
    },

    // Details table
    detailsTable: { ...cs.card, marginBottom: SPACING.sm },
    tableRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tableLabel: { fontSize: FONT_SIZE.md, color: colors.textDim },
    tableValue: { fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text },

    // Activity list
    activityCard: { ...cs.card, marginBottom: SPACING.lg },
    activityRow: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md, gap: SPACING.sm,
    },
    activityRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    activityIconBox: {
      width: 30, height: 30, borderRadius: RADIUS.sm,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    activityBody: { flex: 1 },
    activityTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text },
    activityDate: { fontSize: FONT_SIZE.xs, color: colors.textDim},
    activityNote: { fontSize: FONT_SIZE.xs, color: colors.textDim},
    activityAmount: { fontSize: FONT_SIZE.md, fontWeight: '700', flexShrink: 0 },
    activityBadge: {
      borderWidth: 1, borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.sm, flexShrink: 0,
    },
    activityBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase' },

    // Footer
    footer: { padding: SPACING.lg },
    manageBtn: { ...cs.button, backgroundColor: colors.primary },
    manageBtnText: { ...cs.buttonText },

    emptyText: { ...typo.emptyBody, paddingVertical: SPACING.lg },

    // kept for unused-but-defined style safety
    manageLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', marginTop: SPACING.xs },
    statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  });
