import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ChevronRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { customers, orders } = useMockData();
  const { customerId } = route.params;

  const customer = customers.find((c) => c.id === customerId);
  const customerOrders = orders.filter((o) => o.customer_id === customerId);

  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Customer not found</Text>
      </View>
    );
  }

  // Format initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format customer code
  const getCustomerCode = (id: string) => {
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    return !isNaN(num) ? `CST-${String(num).padStart(3, '0')}` : `CST-${id.slice(0, 3).toUpperCase()}`;
  };

  // Get last order date
  const sortedOrders = [...customerOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastOrderDate = sortedOrders.length > 0 
    ? sortedOrders[0].created_at.split('T')[0] 
    : 'N/A';

  const accountType = customer.total_debt > 0 ? 'Credit' : 'Cash';

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: colors.successBg, border: colors.successBorder, text: colors.successText };
      case 'partial':
        return { bg: colors.pendingBg, border: colors.pendingBorder, text: colors.pendingText };
      default:
        return { bg: colors.errorBg, border: colors.errorBorder, text: colors.errorText };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Area */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerCode}>{getCustomerCode(customer.id)}</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{customerOrders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>
              ${customer.total_debt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statLabel}>Credit Balance</Text>
          </View>
        </View>

        {/* Details Table */}
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

        {/* View Orders Action Button */}
        <TouchableOpacity
          style={styles.viewOrdersBtn}
          onPress={() => navigation.navigate('Orders', { customerName: customer.name })}
          activeOpacity={0.8}
        >
          <Text style={styles.viewOrdersBtnText}>View Orders</Text>
        </TouchableOpacity>

        {/* Order History */}
        <Text style={styles.sectionTitle}>Order History</Text>

        {customerOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders recorded for this customer.</Text>
        ) : (
          customerOrders.map((item) => {
            const badge = getStatusBadgeStyle(item.payment_status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                activeOpacity={0.7}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderCode}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.orderAmount}>${item.total_amount.toFixed(2)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.statusText, { color: badge.text }]}>
                    {item.payment_status}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textDark} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { ...cs.container },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: 40,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    avatar: {
      ...cs.avatar,
      marginBottom: SPACING.sm,
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary + '40',
    },
    avatarText: {
      ...cs.avatarText,
      color: colors.primary,
    },
    customerName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    customerCode: {
      ...typo.meta,
      color: colors.textDim,
    },
    statsCard: {
      ...cs.card,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      marginBottom: SPACING.lg,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textDim,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
    },
    detailsTable: {
      ...cs.card,
      marginBottom: SPACING.lg,
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableLabel: {
      fontSize: FONT_SIZE.md,
      color: colors.textDim,
    },
    tableValue: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
    },
    viewOrdersBtn: {
      ...cs.button,
      backgroundColor: colors.primary,
      marginBottom: SPACING.xl,
    },
    viewOrdersBtnText: {
      ...cs.buttonText,
    },
    sectionTitle: {
      ...typo.sectionTitleCompact,
      fontSize: FONT_SIZE.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    orderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      ...cs.card,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    orderInfo: {
      flex: 1,
    },
    orderCode: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
      color: colors.text,
    },
    orderDate: {
      ...typo.meta,
      marginTop: 2,
    },
    orderAmount: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
      color: colors.text,
      marginRight: SPACING.sm,
    },
    statusBadge: {
      ...cs.badge,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      marginRight: SPACING.sm,
    },
    statusText: {
      ...cs.badgeText,
      fontSize: FONT_SIZE.xs,
      textTransform: 'uppercase',
    },
    emptyText: {
      ...typo.emptyBody,
      paddingVertical: SPACING.lg,
    },
  });
