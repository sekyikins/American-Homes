import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'AllTransactions'>;

export default function AllTransactionsScreen({ navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const { walletTransactions } = useMockData();
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    statsRow: {
      padding: SPACING.md,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    statBox: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      backgroundColor: colors.card,
    },
    statVal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    statLbl: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    listContent: { padding: SPACING.sm, paddingBottom: 32 },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    detailsContainer: { flex: 1 },
    reason: { fontSize: FONT_SIZE.body, fontWeight: '700', color: colors.text },
    date: { fontSize: FONT_SIZE.md, color: colors.textDim, marginTop: 4 },
    amount: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const totalEarned = walletTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = walletTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>
            ${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statLbl}>Total Earned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>
            ${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statLbl}>Withdrawn</Text>
        </View>
      </View>
      <FlatList
        data={walletTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const isCredit = item.type === 'credit';
          const iconBg = isCredit ? colors.successBg : colors.errorBg;
          const iconColor = isCredit ? colors.success : colors.error;

          return (
            <TouchableOpacity
              style={styles.transactionCard}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                {isCredit ? (
                  <ArrowUpRight size={20} color={iconColor} />
                ) : (
                  <ArrowDownRight size={20} color={iconColor} />
                )}
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.reason} numberOfLines={1}>
                  {item.reason}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={[styles.amount, { color: isCredit ? colors.success : colors.error }]}>
                {isCredit ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon={Inbox} title="No transactions" message="Your transaction ledger is empty." />
        }
      />
    </View>
  );
}
