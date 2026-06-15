import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../styles/theme';

type Agent = {
  id: string;
  name: string;
  email: string;
  role: string;
  commission_type: string;
  commission_rate: number;
  balance: number;
};

type Transaction = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string | null;
  created_at: string;
};

export default function WalletScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    const [agentsRes, txRes] = await Promise.all([
      supabase
        .from('users')
        .select(
          'id, name, email, role, commission_type, commission_rate, wallets ( balance )'
        )
        .in('role', ['admin', 'manager', 'agent'])
        .order('name'),
      supabase
        .from('wallet_transactions')
        .select('id, amount, type, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (agentsRes.error)
      console.warn('Supabase error (agents/wallets):', agentsRes.error.message);
    if (txRes.error)
      console.warn('Supabase error (wallet_transactions):', txRes.error.message);

    if (agentsRes.data) {
      setAgents(
        agentsRes.data.map(a => ({
          id: a.id,
          name: a.name || 'Unknown',
          email: a.email || '',
          role: a.role,
          commission_type: a.commission_type,
          commission_rate: Number(a.commission_rate) || 0,
          balance: Number((a.wallets as any)?.[0]?.balance) || 0,
        }))
      );
    }
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets();
    setRefreshing(false);
  };

  const totalBalance = agents.reduce((s, a) => s + a.balance, 0);

  const commissionLabel = (a: Agent) => {
    if (a.commission_type === 'percentage')
      return `${(a.commission_rate * 100).toFixed(1)}% per sale`;
    if (a.commission_type === 'flat') return `$${a.commission_rate} flat`;
    return 'Variant-specific';
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total balance banner stays static at top */}
      <View style={styles.staticHeader}>
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>TOTAL COMMISSION POOL</Text>
          <Text style={styles.bannerValue}>
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.bannerSub}>
            {agents.length} registered wallet{agents.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Scrollable list content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Agent wallet cards */}
        <Text style={styles.sectionTitle}>Agent Wallets</Text>

        {agents.map(a => (
          <View key={a.id} style={styles.agentCard}>
            <View style={styles.agentLeft}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {initials(a.name)}
                </Text>
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{a.name}</Text>
                <Text style={styles.agentMeta}>
                  {a.role.charAt(0).toUpperCase() + a.role.slice(1)} ·{' '}
                  {commissionLabel(a)}
                </Text>
              </View>
            </View>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceVal}>
                ${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.balanceLbl}>Balance</Text>
            </View>
          </View>
        ))}

        {agents.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No agents registered yet</Text>
          </View>
        )}

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Recent Transactions
            </Text>
            <View style={styles.txCard}>
              {transactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    idx < transactions.length - 1 && styles.txDivider,
                  ]}
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
                        color:
                          tx.type === 'credit' ? colors.success : colors.error,
                      },
                    ]}
                  >
                    {tx.type === 'credit' ? '+' : '−'}$
                    {Math.abs(tx.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    staticHeader: { padding: 16, paddingBottom: 4 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },

    banner: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 22,
      alignItems: 'center',
    },
    bannerLabel: {
      fontSize: 10,
      color: '#ffffff99',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    bannerValue: {
      fontSize: 38,
      fontWeight: '800',
      color: '#ffffff',
      marginTop: 6,
      fontVariant: ['tabular-nums'],
    },
    bannerSub: { fontSize: 12, color: '#ffffffaa', marginTop: 6 },

    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    agentCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    agentLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 15, fontWeight: '700' },
    agentInfo: { flex: 1 },
    agentName: { fontSize: 14, fontWeight: '700', color: colors.text },
    agentMeta: { fontSize: 11, color: colors.textDim, marginTop: 2 },

    balanceBox: { alignItems: 'flex-end' },
    balanceVal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    balanceLbl: { fontSize: 10, color: colors.textDim, marginTop: 2 },

    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: colors.textDim, fontSize: 14 },

    txCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    txRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    txDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    txDot: { width: 8, height: 8, borderRadius: 4 },
    txInfo: { flex: 1 },
    txReason: { fontSize: 13, color: colors.text, fontWeight: '500' },
    txDate: { fontSize: 11, color: colors.textDim, marginTop: 2 },
    txAmount: {
      fontSize: 15,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
  });
