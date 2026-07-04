import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { FileText, User, CreditCard, Calendar, ShoppingBag } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { colors, typography } = useTheme();
  const { orders, orderItems, products, customers } = useMockData();
  const { orderId } = route.params;

  const order = orders.find((o) => o.id === orderId);

  const itemsForOrder = orderItems.filter((oi) => oi.order_id === orderId);

  const customerObj = order ? customers.find((c) => c.id === order.customer_id) : null;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    rowText: { fontSize: 14, color: colors.textMuted, marginLeft: 8 },
    rowValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 'auto' },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      marginLeft: 'auto',
    },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
    itemQty: { fontSize: 13, color: colors.textDim, marginTop: 2 },
    itemSubtotal: { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 12 },
    totalBlock: { marginTop: 12, paddingTop: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
    totalLabel: { fontSize: 14, color: colors.textDim },
    totalValue: { fontSize: 15, fontWeight: '600', color: colors.text },
    grandTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    grandTotalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
    emptyText: { textAlign: 'center', color: colors.textDim, marginTop: 24, fontSize: 14 },
  });

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Order not found</Text>
      </View>
    );
  }

  const getStatusBadgeColors = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: colors.successBg, border: colors.successBorder, text: colors.successText };
      case 'partial':
        return { bg: colors.pendingBg, border: colors.pendingBorder, text: colors.pendingText };
      default:
        return { bg: colors.errorBg, border: colors.errorBorder, text: colors.errorText };
    }
  };

  const badge = getStatusBadgeColors(order.payment_status);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary Info</Text>
          <View style={styles.row}>
            <Calendar size={16} color={colors.textDim} />
            <Text style={styles.rowText}>Order Date</Text>
            <Text style={styles.rowValue}>
              {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.row}>
            <CreditCard size={16} color={colors.textDim} />
            <Text style={styles.rowText}>Payment Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text style={[styles.statusText, { color: badge.text }]}>{order.payment_status}</Text>
            </View>
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          {customerObj ? (
            <TouchableOpacity onPress={() => navigation.navigate('CustomerDetail', { customerId: customerObj.id })}>
              <View style={styles.row}>
                <User size={16} color={colors.textDim} />
                <Text style={[styles.rowText, { color: colors.primary, fontWeight: '700' }]}>{customerObj.name}</Text>
                <Text style={[styles.rowValue, { color: colors.primary }]}>View Customer</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.rowText, { marginLeft: 24 }]}>{customerObj.phone}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.row}>
              <User size={16} color={colors.textDim} />
              <Text style={styles.rowText}>Anonymous Walk-in Customer</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {itemsForOrder.map((item) => {
            const prod = products.find((p) => p.id === item.product_id);
            return (
              <View key={item.id} style={styles.itemRow}>
                <ShoppingBag size={18} color={colors.textDim} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{prod ? prod.name : 'Unknown Product'}</Text>
                  <Text style={styles.itemQty}>
                    {item.quantity} x ${item.unit_price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>${(item.quantity * item.unit_price).toFixed(2)}</Text>
              </View>
            );
          })}

          {/* Totals */}
          <View style={styles.totalBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (0%)</Text>
              <Text style={styles.totalValue}>$0.00</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalValue}>${order.total_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
