import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { FileText, ArrowUpRight, ArrowDownLeft, Calendar, Info, CornerDownRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

export default function TransactionDetailScreen({ route, navigation }: Props) {
  const { colors, typography } = useTheme();
  const { walletTransactions } = useMockData();
  const { transactionId } = route.params;

  const transaction = walletTransactions.find((t) => t.id === transactionId);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    amountCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
    },
    typeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    amount: { fontSize: 28, fontWeight: '800' },
    status: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: 6 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    rowText: { fontSize: 14, color: colors.textDim },
    rowValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 'auto', flexShrink: 1, textAlign: 'right' },
    linkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
      padding: 12,
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
    },
    linkBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: colors.textDim, marginTop: 24, fontSize: 14 },
  });

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Transaction not found</Text>
      </View>
    );
  }

  const isCredit = transaction.type === 'credit';
  const iconBg = isCredit ? colors.successBg : colors.errorBg;
  const iconColor = isCredit ? colors.success : colors.error;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={[styles.typeIcon, { backgroundColor: iconBg }]}>
            {isCredit ? (
              <ArrowDownLeft size={24} color={iconColor} />
            ) : (
              <ArrowUpRight size={24} color={iconColor} />
            )}
          </View>
          <Text style={[styles.amount, { color: isCredit ? colors.success : colors.error }]}>
            {isCredit ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text style={[styles.status, { color: isCredit ? colors.success : colors.error }]}>
            {isCredit ? 'Credit / Commission' : 'Debit / Withdrawal'}
          </Text>
        </View>

        {/* Details List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowText}>Transaction ID</Text>
            <Text style={styles.rowValue}>{transaction.id}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowText}>Timestamp</Text>
            <Text style={styles.rowValue}>
              {new Date(transaction.created_at).toLocaleDateString([], {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowText}>Reason</Text>
            <Text style={styles.rowValue}>{transaction.reason}</Text>
          </View>

          {transaction.reference_id && (
            <View style={styles.row}>
              <Text style={styles.rowText}>Reference Ref</Text>
              <Text style={styles.rowValue}>{transaction.reference_id}</Text>
            </View>
          )}
        </View>

        {/* Order Link Action */}
        {transaction.reference_id && transaction.reference_id.startsWith('77777777') && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('OrderDetail', { orderId: transaction.reference_id! })}
            activeOpacity={0.8}
          >
            <FileText size={18} color={colors.primary} />
            <Text style={styles.linkBtnText}>View Associated Order Details</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
