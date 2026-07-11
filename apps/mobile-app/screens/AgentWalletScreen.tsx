import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import { Inbox } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'AgentWallet'>;

export default function AgentWalletScreen({ route, navigation }: Props) {
  const { agentId } = route.params;
  const { colors, commonStyles, typography } = useTheme();
  const { users, walletTransactions } = useMockData();

  const styles = React.useMemo(
    () => createStyles(colors, commonStyles, typography),
    [colors, commonStyles, typography]
  );

  const agent = users.find(u => u.id === agentId);

  if (!agent) {
    return (
      <View style={styles.center}>
        <EmptyState icon={Inbox} title="Agent not found" message="This agent's wallet data could not be loaded." />
      </View>
    );
  }

  // In production this would be filtered by agent's wallet_id from Supabase.
  // For now we show all transactions as a demo — in a real app filter by owner.
  const agentTransactions = walletTransactions;

  const initials = agent.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const commissionLabel = () => {
    if (agent.commission_type === 'percentage')
      return `${((agent.commission_rate ?? 0) * 100).toFixed(1)}% per sale`;
    if (agent.commission_type === 'flat') return `$${agent.commission_rate ?? 0} flat`;
    return 'Variant-specific';
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <View style={styles.container}>
      {/* Balance Banner */}
      <View style={styles.bannerWrapper}>
        <View style={styles.banner}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '25' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentMeta}>
              {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)} · {commissionLabel()}
            </Text>
          </View>
          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>
              ${agent.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction History */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Transaction History" variant="compact" />

        {agentTransactions.length === 0 ? (
          <EmptyState icon={Inbox} title="No transactions" message="No transactions found for this agent." />
        ) : (
          <View style={styles.txCard}>
            {agentTransactions.map((tx, idx) => (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.txRow,
                  idx < agentTransactions.length - 1 && styles.txDivider,
                ]}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.txDot,
                    {
                      backgroundColor:
                        tx.type === 'credit' ? colors.success : colors.error,
                    },
                  ]}
                />
                <View style={styles.txInfo}>
                  <Text style={styles.txReason}>{tx.reason || tx.type}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: tx.type === 'credit' ? colors.success : colors.error,
                    },
                  ]}
                >
                  {tx.type === 'credit' ? '+' : '−'}$
                  {Math.abs(tx.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    bannerWrapper: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      backgroundColor: colors.background,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '800',
    },
    bannerInfo: { flex: 1 },
    agentName: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      color: colors.text,
    },
    agentMeta: {
      fontSize: FONT_SIZE.sm,
      color: colors.textDim,
    },
    balanceBlock: { alignItems: 'flex-end' },
    balanceLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.textDim,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '600',
    },
    balanceValue: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '800',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },

    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.sm,
    },

    txCard: { ...cs.card },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    txDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    txDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    txInfo: { flex: 1 },
    txReason: {
      fontSize: FONT_SIZE.body,
      color: colors.text,
      fontWeight: '500',
    },
    txDate: {
      fontSize: FONT_SIZE.sm,
      color: colors.textDim,
    },
    txAmount: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
  });
