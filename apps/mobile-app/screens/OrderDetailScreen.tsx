import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { supabase, withTimeout } from '../lib/supabase';
import { FileText } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { orders, orderItems, products, customers } = useMockData();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  useEffect(() => {
    let active = true;
    const fetchOrderDetail = async () => {
      setLoading(true);
      try {
        // Try fetching from Supabase first
        const [orderRes, itemsRes] = await withTimeout(
          Promise.all([
            supabase
              .from('orders')
              .select('id, total_amount, payment_status, created_at, customer_id, customers ( name, phone )')
              .eq('id', orderId)
              .single(),
            supabase
              .from('order_items')
              .select('id, quantity, unit_price, products ( name )')
              .eq('order_id', orderId)
          ])
        );

        const orderData = orderRes.data;
        const itemsData = itemsRes.data;

        if (active) {
          if (orderData) {
            setOrder({
              id: orderData.id,
              total_amount: Number(orderData.total_amount) || 0,
              payment_status: orderData.payment_status,
              created_at: orderData.created_at,
              customer_name: orderData.customers?.name || 'Walk-in Customer',
              customer_phone: orderData.customers?.phone || '',
              customer_id: orderData.customer_id,
            });
            if (itemsData) {
              setItems(itemsData.map((item: any) => ({
                id: item.id,
                name: item.products?.name || 'Unknown Product',
                quantity: item.quantity,
                unit_price: Number(item.unit_price) || 0,
              })));
            }
          } else {
            throw new Error('Order not found');
          }
        }
      } catch (err) {
        console.warn('Error fetching order details:', err);
        // Fallback to Mock Data
        if (active) {
          const mockOrder = orders.find(o => o.id === orderId);
          if (mockOrder) {
            const customer = mockOrder.customer_id ? customers.find(c => c.id === mockOrder.customer_id) : null;
            setOrder({
              id: mockOrder.id,
              total_amount: mockOrder.total_amount,
              payment_status: mockOrder.payment_status,
              created_at: mockOrder.created_at,
              customer_name: customer?.name || 'Walk-in Customer',
              customer_phone: customer?.phone || '',
              customer_id: mockOrder.customer_id,
            });

            const mockItems = orderItems.filter(oi => oi.order_id === orderId);
            setItems(mockItems.map(item => {
              const prod = products.find(p => p.id === item.product_id);
              return {
                id: item.id,
                name: prod?.name || 'Unknown Product',
                quantity: item.quantity,
                unit_price: item.unit_price,
              };
            }));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrderDetail();
    return () => {
      active = false;
    };
  }, [orderId, orders, orderItems, products, customers]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Order not found</Text>
      </View>
    );
  }

  // Format order code like ORD-2024-1204
  const getOrderCode = (id: string, dateStr: string) => {
    if (id.startsWith('ORD-')) return id;
    const year = new Date(dateStr).getFullYear() || 2026;
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && num < 100) {
      return `ORD-${year}-${1200 + num}`;
    }
    return `ORD-${year}-${id.slice(0, 4).toUpperCase()}`;
  };

  // Paid and Balance calculation logic
  let paidAmount = 0;
  if (order.payment_status === 'paid') {
    paidAmount = order.total_amount;
  } else if (order.payment_status === 'partial') {
    paidAmount = order.total_amount * 0.5; // default 50% paid
  } else if (order.payment_status === 'credit') {
    paidAmount = 0;
  }

  const balanceAmount = order.total_amount - paidAmount;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order ID & Status Badge */}
        <View style={styles.orderHeaderRow}>
          <Text style={styles.orderTitle}>{getOrderCode(order.id, order.created_at)}</Text>
          <StatusBadge status={order.payment_status} />
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Customer</Text>
            {order.customer_id ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('CustomerDetail', { customerId: order.customer_id })}
                activeOpacity={0.7}
              >
                <Text style={styles.tableValueLink}>{order.customer_name}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.tableValue}>{order.customer_name}</Text>
            )}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Date</Text>
            <Text style={styles.tableValue}>
              {order.created_at.split('T')[0]}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Total</Text>
            <Text style={styles.tableValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Paid</Text>
            <Text style={styles.tableValue}>${paidAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.tableLabel}>Balance</Text>
            <Text style={styles.tableValue}>${balanceAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Items List */}
        <SectionHeader title={`Items (${items.length})`} variant="compact" />
        <View style={styles.itemsCard}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index === items.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
              </Text>
              <Text style={styles.itemPrice}>
                ${(item.quantity * item.unit_price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.receiptBtn} activeOpacity={0.8}>
          <FileText size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.receiptBtnText}>View Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { ...cs.container },
    center: { ...cs.center },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: 40,
    },
    orderHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    orderTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    detailsCard: {
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
    tableValueLink: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
      color: colors.primary,
    },
    itemsCard: {
      ...cs.card,
      marginBottom: SPACING.xl,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemName: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
      maxWidth: '75%',
    },
    itemPrice: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
    },
    receiptBtn: {
      ...cs.button,
      flexDirection: 'row',
      backgroundColor: colors.primary,
    },
    receiptBtnText: {
      ...cs.buttonText,
    },
    emptyText: {
      ...typo.emptyBody,
      paddingVertical: SPACING.lg,
    },
  });
