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
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
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

  const [filterMode, setFilterMode] = useState<'all' | 'they_owe' | 'we_owe'>('all');

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
  }, [mockData.customers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  // Filter based on state search query AND filter mode
  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    if (!matchesSearch) return false;
    
    if (filterMode === 'they_owe') return c.total_debt > 0;
    if (filterMode === 'we_owe') return c.total_debt < 0;
    return true;
  });

  const theyOweCount = customers.filter(c => c.total_debt > 0).length;
  const weOweCount = customers.filter(c => c.total_debt < 0).length;
  
  const totalTheyOweAmount = customers.filter(c => c.total_debt > 0).reduce((s, c) => s + c.total_debt, 0);
  const totalWeOweAmount = customers.filter(c => c.total_debt < 0).reduce((s, c) => s + Math.abs(c.total_debt), 0);

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
            Owes Us: ${c.total_debt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
        </View>
      ) : c.total_debt < 0 ? (
        <View style={[styles.clearBadge, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
          <Text style={[styles.clearText, { color: colors.successText }]}>
            Credit: ${Math.abs(c.total_debt).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
        </View>
      ) : (
        <Text style={{ color: colors.textDim, fontSize: FONT_SIZE.body, fontWeight: '600', marginRight: SPACING.sm }}>
          Clear
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ── Static header: stats + search ─────────────────────────────────── */}
      <View style={styles.staticHeader}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statBox, filterMode === 'all' && { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.statVal, filterMode === 'all' && { color: colors.primary }]}>{customers.length}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statBox, styles.statBorder, filterMode === 'they_owe' && { backgroundColor: colors.errorBg, borderColor: colors.error }]}
            onPress={() => setFilterMode('they_owe')}
            activeOpacity={0.8}
          >
            <Text style={[styles.statVal, { color: colors.error }]}>{theyOweCount}</Text>
            <Text style={styles.statLbl}>Credits</Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.error, fontWeight: '600' }}>
              ${totalTheyOweAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statBox, styles.statBorder, filterMode === 'we_owe' && { backgroundColor: colors.successBg, borderColor: colors.success }]}
            onPress={() => setFilterMode('we_owe')}
            activeOpacity={0.8}
          >
            <Text style={[styles.statVal, { color: colors.success }]}>{weOweCount}</Text>
            <Text style={styles.statLbl}>Credits</Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.success, fontWeight: '600'}}>
              ${totalWeOweAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </TouchableOpacity>
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
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING.lg,
      overflow: 'hidden',
    },
    statBox: { flex: 1, paddingVertical: SPACING.lg, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
    statVal: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    statLbl: { fontSize: FONT_SIZE.sm, color: colors.textDim, fontWeight: '500' },

    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      paddingVertical: 11,
      paddingHorizontal: SPACING.lg,
      color: colors.text,
      fontSize: FONT_SIZE.lg,
    },

    // ── List ──────────────────────────────────────────────────────────────────
    listContent: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.sm,
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      gap: SPACING.md,
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
    avatarText: { fontSize: FONT_SIZE.lg, fontWeight: '700' },

    info: { flex: 1 },
    name: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text },
    meta: { fontSize: FONT_SIZE.md, color: colors.textDim },

    debtBadge: { borderRadius: RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
    debtText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
    clearBadge: { borderRadius: RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
    clearText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  });
