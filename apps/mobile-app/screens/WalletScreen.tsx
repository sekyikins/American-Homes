import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { supabase, withTimeout } from '../lib/supabase';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import AppButton from '../components/AppButton';

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
  const navigation = useNavigation<any>();
  const { colors, commonStyles, typography } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);
  const mockData = useMockData();
  const { currentUser } = mockData;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallets = async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    // Derive fallback agents from the single source of truth in MockDataContext
    const mockAgents: Agent[] = mockData.users
      .filter(u => ['admin', 'manager', 'agent'].includes(u.role))
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        commission_type: u.commission_type || 'flat',
        commission_rate: u.commission_rate || 0,
        balance: u.balance,
      }));

    try {
      const [agentsRes, txRes] = await withTimeout(
        Promise.all([
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
        ])
      );

      if (agentsRes.error)
        console.warn('Supabase error (agents/wallets):', agentsRes.error.message);
      if (txRes.error)
        console.warn('Supabase error (wallet_transactions):', txRes.error.message);

      const fetchedAgents: Agent[] =
        agentsRes.data && agentsRes.data.length > 0
          ? agentsRes.data.map(a => ({
              id: a.id,
              name: a.name || 'Unknown',
              email: a.email || '',
              role: a.role,
              commission_type: a.commission_type || 'flat',
              commission_rate: Number(a.commission_rate) || 0,
              balance: Number((a.wallets as any)?.[0]?.balance) || 0,
            }))
          : mockAgents;

      const fetchedTransactions: Transaction[] =
        txRes.data && txRes.data.length > 0
          ? (txRes.data as Transaction[])
          : mockData.walletTransactions.map(tx => ({
              id: tx.id,
              amount: tx.amount,
              type: tx.type,
              reason: tx.reason,
              created_at: tx.created_at,
            }));

      setAgents(fetchedAgents);
      setTransactions(fetchedTransactions);
    } catch (e) {
      console.warn('Error fetching wallet data:', e);
      setAgents(mockAgents);
      setTransactions(mockData.walletTransactions);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets(true);
    setRefreshing(false);
  };

  const myBalance = currentUser?.balance ?? 0;

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
          <Text style={styles.bannerLabel}>My Balance</Text>
          <Text style={styles.bannerValue}>
            ${myBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          {currentUser?.role === 'admin' && (
            <Text style={styles.bannerSub}>
              {agents.length} registered wallet{agents.length !== 1 ? 's' : ''}
            </Text>
          )}
          <AppButton
            label="Withdraw Funds"
            onPress={() => navigation.navigate('Withdraw')}
            variant="secondary"
            style={{ backgroundColor: '#ffffff', borderColor: '#ffffff', marginTop: SPACING.md }}
            fullWidth
          />
        </View>
      </View>

      {/* Scrollable list content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Agent wallet cards (Admin only) */}
        {currentUser?.role === 'admin' && (
          <>
            <SectionHeader title="Agent Wallets" variant="compact" />

            {agents.map(a => (
              <TouchableOpacity key={a.id} style={styles.agentCard} activeOpacity={0.8} onPress={() => navigation.navigate('AgentWallet', { agentId: a.id })}>
                <View style={styles.agentLeft}>
                  <View style={[styles.avatarSmall, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.avatarTextSmall, { color: colors.primary }]}>
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
              </TouchableOpacity>
            ))}

            {agents.length === 0 && (
              <EmptyState message="No agents registered yet" />
            )}
          </>
        )}

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <>
            <SectionHeader
              title="Recent Transactions"
              variant="compact"
              onViewAll={() => navigation.navigate('AllTransactions')}
              viewAllLabel="VIEW ALL"
              style={{ marginTop: SPACING.lg }}
            />
            <View style={styles.txCard}>
              {transactions.map((tx, idx) => (
                <TouchableOpacity
                  key={tx.id}
                  style={[
                    styles.txRow,
                    idx < transactions.length - 1 && styles.txDivider,
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
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    // ── Layout ────────────────────────────────────────────────────────────────
    container: { ...cs.container },
    staticHeader: { padding: SPACING.lg, paddingBottom: SPACING.xs },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: 10, paddingBottom: 40 },
    center: { ...cs.center, paddingTop: 80 },

    // ── Banner ────────────────────────────────────────────────────────────────
    banner: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      padding: 22,
    },
    bannerLabel: {
      fontSize: FONT_SIZE.xs,
      color: '#ffffff99',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    bannerValue: {
      fontSize: 38,
      fontWeight: '800',
      color: '#ffffff',
      fontVariant: ['tabular-nums'],
    },
    bannerSub: { fontSize: FONT_SIZE.md, color: '#ffffffaa' },
    walletBtn: {
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.lg,
      marginTop: SPACING.md,
      width: '100%',
    },
    walletBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: colors.primary },

    // ── Agent Cards ───────────────────────────────────────────────────────────
    agentCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...cs.cardPadded,
      padding: SPACING.xl - 6,
      marginBottom: 10,
    },
    agentLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      flex: 1,
    },
    avatarSmall: { ...cs.avatarSmall },
    avatarTextSmall: { ...cs.avatarTextSmall },
    agentInfo: { flex: 1 },
    agentName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text },
    agentMeta: { ...typo.meta, marginTop: 2 },

    // ── Balance ───────────────────────────────────────────────────────────────
    balanceBox: { alignItems: 'flex-end' },
    balanceVal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    balanceLbl: { fontSize: FONT_SIZE.xs, color: colors.textDim, marginTop: 2 },

    // ── Transactions ──────────────────────────────────────────────────────────
    txCard: { ...cs.card },
    txRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl - 6, gap: SPACING.md },
    txDivider: { ...cs.listItemDivider },
    txDot: { ...cs.statusDot },
    txInfo: { flex: 1 },
    txReason: { fontSize: FONT_SIZE.body, color: colors.text, fontWeight: '500' },
    txDate: { ...typo.meta, marginTop: 2 },
    txAmount: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
  });
