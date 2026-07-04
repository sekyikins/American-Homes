import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AllTransactions'>;

export default function AllTransactionsScreen({ navigation }: Props) {
  const { colors, typography } = useTheme();
  const { walletTransactions } = useMockData();
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: 16 },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
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
    reason: { fontSize: 14, fontWeight: '700', color: colors.text },
    date: { fontSize: 12, color: colors.textDim, marginTop: 4 },
    amount: { fontSize: 16, fontWeight: '700' },
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={walletTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
                  <ArrowDownLeft size={20} color={iconColor} />
                ) : (
                  <ArrowUpRight size={20} color={iconColor} />
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
      />
    </View>
  );
}
