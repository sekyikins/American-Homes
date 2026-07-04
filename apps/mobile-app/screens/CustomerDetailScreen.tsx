import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Phone, MapPin, DollarSign, Calendar, ChevronRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ route, navigation }: Props) {
  const { colors, typography } = useTheme();
  const { customers, orders } = useMockData();
  const { customerId } = route.params;

  const customer = customers.find((c) => c.id === customerId);

  const customerOrders = orders.filter((o) => o.customer_id === customerId);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 20,
    },
    customerName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    rowText: { fontSize: 14, color: colors.textMuted, marginLeft: 8 },
    debtContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    debtLabel: { fontSize: 14, fontWeight: '600', color: colors.textDim },
    debtValue: { fontSize: 16, fontWeight: '700', color: colors.error, marginLeft: 'auto' },
    sectionTitle: { ...typography.sectionTitle, marginTop: 10, marginBottom: 12 },
    orderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    orderInfo: { flex: 1 },
    orderCode: { fontSize: 14, fontWeight: '700', color: colors.text },
    orderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    orderMetaText: { fontSize: 12, color: colors.textDim, marginLeft: 4 },
    orderAmount: { fontSize: 15, fontWeight: '700', color: colors.text, marginRight: 8 },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      fontSize: 11,
      fontWeight: '700',
    },
    emptyText: { textAlign: 'center', color: colors.textDim, marginTop: 24, fontSize: 14 },
  });

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Customer not found</Text>
      </View>
    );
  }

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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <View style={styles.row}>
            <Phone size={16} color={colors.textDim} />
            <Text style={styles.rowText}>{customer.phone}</Text>
          </View>
          <View style={styles.row}>
            <MapPin size={16} color={colors.textDim} />
            <Text style={styles.rowText}>{customer.address}</Text>
          </View>
          <View style={styles.debtContainer}>
            <DollarSign size={18} color={colors.error} />
            <Text style={styles.debtLabel}>Outstanding Credit Balance</Text>
            <Text style={styles.debtValue}>${customer.total_debt.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order History ({customerOrders.length})</Text>

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
                  <View style={styles.orderMeta}>
                    <Calendar size={12} color={colors.textDim} />
                    <Text style={styles.orderMetaText}>
                      {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderAmount}>${item.total_amount.toFixed(2)}</Text>
                <View
                  style={[
                    {
                      backgroundColor: badge.bg,
                      borderColor: badge.border,
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      marginRight: 8,
                    },
                  ]}
                >
                  <Text style={{ color: badge.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
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
