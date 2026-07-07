import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { supabase, withTimeout } from '../lib/supabase';
import { useTheme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import EmptyState from '../components/EmptyState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_debt: number;
};

export default function CustomersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const mockData = useMockData();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMockCustomers = () => {
    setCustomers(mockData.customers);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('customers')
          .select('id, name, phone, address, credit_accounts ( total_debt )')
          .order('name', { ascending: true })
      );

      if (error) {
        console.warn('Supabase error (customers):', error.message);
        throw error;
      }

      if (data && data.length > 0) {
        setCustomers(
          data.map(c => ({
            id: c.id,
            name: c.name || 'Unknown',
            phone: c.phone || '',
            address: c.address || '',
            total_debt: Number((c.credit_accounts as any)?.[0]?.total_debt || 0),
          }))
        );
      } else {
        loadMockCustomers();
      }
    } catch (e) {
      loadMockCustomers();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const filtered = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalDebt = customers.reduce((s, c) => s + c.total_debt, 0);
  const inDebtCount = customers.filter(c => c.total_debt > 0).length;

  const renderItem = ({ item: c, index: idx }: { item: Customer; index: number }) => (
    <TouchableOpacity
      key={c.id}
      style={[styles.row, idx < filtered.length - 1 && styles.divider]}
      onPress={() => navigation.navigate('CustomerDetail', { customerId: c.id })}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' },
        ]}
      >
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {c.name[0]?.toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{c.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {c.phone || '—'}
          {c.address ? ` • ${c.address}` : ''}
        </Text>
      </View>

      {c.total_debt > 0 ? (
        <View style={[styles.debtBadge, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
          <Text style={[styles.debtText, { color: colors.errorText }]}>
            −${c.total_debt.toLocaleString()}
          </Text>
        </View>
      ) : (
        <View style={[styles.clearBadge, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
          <Text style={[styles.clearText, { color: colors.successText }]}>✓ Clear</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ── Static header: stats + search ─────────────────────────────────── */}
      <View style={styles.staticHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{customers.length}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={[styles.statVal, { color: colors.error }]}>{inDebtCount}</Text>
            <Text style={styles.statLbl}>In Debt</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={[styles.statVal, { color: colors.error }]}>
              ${totalDebt.toLocaleString()}
            </Text>
            <Text style={styles.statLbl}>Total Owed</Text>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ── Scrollable list ───────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No customers found"
              message={search ? `No customers matching "${search}"` : 'No customers registered yet'}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Static header ──────────────────────────────────────────────────────────
    staticHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      overflow: 'hidden',
    },
    statBox: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
    statVal: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    statLbl: { fontSize: 11, color: colors.textDim, marginTop: 2, fontWeight: '500' },

    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,
      color: colors.text,
      fontSize: 14,
    },

    // ── List ──────────────────────────────────────────────────────────────────
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 36,
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      gap: 12,
    },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: '700' },

    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: colors.text },
    meta: { fontSize: 12, color: colors.textDim, marginTop: 2 },

    debtBadge: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
    debtText: { fontSize: 12, fontWeight: '700' },
    clearBadge: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
    clearText: { fontSize: 12, fontWeight: '700' },
  });
