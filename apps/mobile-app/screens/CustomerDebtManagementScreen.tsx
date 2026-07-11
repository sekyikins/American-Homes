import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';
import FilterBar from '../components/FilterBar';
import ModalPicker, { ModalPickerTrigger } from '../components/ModalPicker';
import { RefreshCw, AlertCircle, Square, CheckSquare } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDebtManagement'>;

const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'];

export default function CustomerDebtManagementScreen({ route, navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const { customers, orders, recordCustomerPayment, adjustCustomerDebt } = useMockData();
  const { customerId } = route.params;

  const customer = customers.find((c) => c.id === customerId);

  const [activeTab, setActiveTab] = useState<'payment' | 'adjustment'>('payment');

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Adjustment Form States
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // Success overlay
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const styles = useMemo(() => createStyles(colors, commonStyles), [colors, commonStyles]);

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={40} color={colors.error} />
        <Text style={styles.errorText}>Customer not found</Text>
      </View>
    );
  }

  // Unpaid / partial orders for this customer (these are what a payment would cover)
  const unpaidOrders = orders
    .filter(o => o.customer_id === customerId && (o.payment_status === 'credit' || o.payment_status === 'partial'))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Auto-fill amount from selected orders
  const selectedOrdersTotal = unpaidOrders
    .filter(o => selectedOrderIds.includes(o.id))
    .reduce((sum, o) => sum + o.total_amount, 0);

  const handleRecordPayment = () => {
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount greater than 0.');
      return;
    }

    const orderNote = selectedOrderIds.length > 0
      ? `Orders: ${selectedOrderIds.map(id => '#' + id.slice(0, 8).toUpperCase()).join(', ')}`
      : '';
    const fullNotes = [orderNote, paymentNotes].filter(Boolean).join(' | ');

    recordCustomerPayment(customer.id, parsedAmount, selectedMethod, fullNotes);
    setSuccessMsg(
      `Logged payment of $${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} via ${selectedMethod}. Balance updated.`
    );
    setSuccessVisible(true);
  };

  const handleApplyAdjustment = () => {
    const parsedAmount = parseFloat(adjustmentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid adjustment amount greater than 0.');
      return;
    }
    if (!adjustmentNotes.trim()) {
      Alert.alert('Description Required', 'Please enter a description for this adjustment.');
      return;
    }

    const amountChange = adjustmentType === 'increase' ? parsedAmount : -parsedAmount;
    adjustCustomerDebt(customer.id, amountChange, adjustmentNotes.trim());
    setSuccessMsg(
      `Applied ${amountChange > 0 ? '+' : ''}$${amountChange.toLocaleString(undefined, { minimumFractionDigits: 2 })} adjustment. Balance updated.`
    );
    setSuccessVisible(true);
  };

  const currentDebt = customer.total_debt;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'credit': return 'Credit';
      case 'partial': return 'Partial';
      default: return status;
    }
  };
  const getStatusColor = (status: string) => status === 'partial' ? colors.pending : colors.error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Balance Summary ── */}
          <View style={styles.balanceCard}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={[
              styles.balanceVal,
              currentDebt > 0 && { color: colors.error },
              currentDebt < 0 && { color: colors.success },
              currentDebt === 0 && { color: colors.textDim },
            ]}>
              ${currentDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.balanceLbl}>
              {currentDebt > 0 ? 'Debt Balance (Owes Us)' : currentDebt < 0 ? 'Prepaid Credit (We Owe)' : 'Clear Balance'}
            </Text>
          </View>

          {/* ── Tab Selector ── */}
          <FilterBar
            options={[
              { key: 'payment', label: 'Record Payment' },
              { key: 'adjustment', label: 'Adjust Balance' },
            ]}
            activeKey={activeTab}
            onChange={(key: any) => setActiveTab(key)}
            isSegmented={true}
            style={styles.tabContainer}
          />

          {/* ── Payment Tab ── */}
          {activeTab === 'payment' ? (
            <View>

              {/* Order selection */}
              {unpaidOrders.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Link to Orders (Optional)</Text>
                  <Text style={styles.sublabel}>Select orders this payment covers</Text>
                  <View style={styles.orderList}>
                    {unpaidOrders.map((o, idx) => {
                      const isSelected = selectedOrderIds.includes(o.id);
                      const isLast = idx === unpaidOrders.length - 1;
                      const statusColor = getStatusColor(o.payment_status);
                      return (
                        <TouchableOpacity
                          key={o.id}
                          style={[
                            styles.orderRow,
                            !isLast && styles.orderRowBorder,
                            isSelected && { backgroundColor: colors.primary + '0C' },
                          ]}
                          onPress={() => {
                            toggleOrder(o.id);
                            // auto-fill total from selected orders
                            const newIds = selectedOrderIds.includes(o.id)
                              ? selectedOrderIds.filter(id => id !== o.id)
                              : [...selectedOrderIds, o.id];
                            const total = unpaidOrders
                              .filter(ord => newIds.includes(ord.id))
                              .reduce((sum, ord) => sum + ord.total_amount, 0);
                            if (total > 0) setPaymentAmount(total.toFixed(2));
                          }}
                          activeOpacity={0.7}
                        >
                          {isSelected
                            ? <CheckSquare size={18} color={colors.primary} />
                            : <Square size={18} color={colors.textDim} />
                          }
                          <View style={styles.orderRowBody}>
                            <Text style={styles.orderRowCode}>
                              #{o.id.slice(0, 10).toUpperCase()}
                            </Text>
                            <Text style={styles.orderRowDate}>
                              {new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          <Text style={[styles.orderRowAmount, { color: statusColor }]}>
                            ${o.total_amount.toFixed(2)}
                          </Text>
                          <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '55' }]}>
                            <Text style={[styles.statusPillText, { color: statusColor }]}>
                              {getStatusLabel(o.payment_status)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedOrderIds.length > 0 && (
                    <Text style={[styles.sublabel, { color: colors.primary, marginTop: SPACING.xs }]}>
                      Selected total: ${selectedOrdersTotal.toFixed(2)}
                    </Text>
                  )}
                </View>
              )}

              {/* Payment Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 150.00"
                  placeholderTextColor={colors.textDim}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                />
              </View>

              {/* Payment Method — modal dropdown */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <ModalPickerTrigger
                  label={selectedMethod}
                  onPress={() => setShowMethodPicker(true)}
                />
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes / Reference</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="e.g. Payment for Order #F23A"
                  placeholderTextColor={colors.textDim}
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                />
              </View>
            </View>
          ) : (
            /* ── Adjustment Tab ── */
            <View>
              {/* Adjustment Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adjustment Action</Text>
                <View style={styles.grid}>
                  <TouchableOpacity
                    style={[styles.optionBtn, adjustmentType === 'decrease' && styles.optionBtnActive]}
                    onPress={() => setAdjustmentType('decrease')}
                    activeOpacity={0.75}
                  >
                    <RefreshCw size={16} color={adjustmentType === 'decrease' ? colors.primary : colors.textDim} />
                    <Text style={[styles.optionText, adjustmentType === 'decrease' && styles.optionTextActive]}>
                      Issue Credit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionBtn, adjustmentType === 'increase' && styles.optionBtnActive]}
                    onPress={() => setAdjustmentType('increase')}
                    activeOpacity={0.75}
                  >
                    <RefreshCw size={16} color={adjustmentType === 'increase' ? colors.primary : colors.textDim} />
                    <Text style={[styles.optionText, adjustmentType === 'increase' && styles.optionTextActive]}>
                      Increase Debt
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Adjustment Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adjustment Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 50.00"
                  placeholderTextColor={colors.textDim}
                  value={adjustmentAmount}
                  onChangeText={setAdjustmentAmount}
                />
              </View>

              {/* Reason */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason / Description (Required)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="e.g. Cleared dispute for missing shipment box"
                  placeholderTextColor={colors.textDim}
                  value={adjustmentNotes}
                  onChangeText={setAdjustmentNotes}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Footer Action ── */}
        <View style={styles.footer}>
          {activeTab === 'payment' ? (
            <AppButton label="Log Customer Payment" onPress={handleRecordPayment} variant="primary" fullWidth />
          ) : (
            <AppButton label="Apply Debt Adjustment" onPress={handleApplyAdjustment} variant="primary" fullWidth />
          )}
        </View>
      </View>

      {/* ── Payment Method Picker ── */}
      <ModalPicker
        visible={showMethodPicker}
        title="Select Payment Method"
        options={PAYMENT_METHODS}
        selected={selectedMethod}
        onSelect={(v) => { setSelectedMethod(v); setShowMethodPicker(false); }}
        onClose={() => setShowMethodPicker(false)}
      />

      <SuccessOverlay
        visible={successVisible}
        title="Transaction Completed"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, cs: any) => StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  errorText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text },

  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: SPACING.lg },

  // Balance card
  balanceCard: {
    backgroundColor: colors.card, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: colors.border, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.xl,
  },
  customerName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text, marginBottom: SPACING.xs },
  balanceVal: { fontSize: FONT_SIZE.hero + 8, fontWeight: '800', marginVertical: SPACING.sm },
  balanceLbl: { fontSize: FONT_SIZE.sm, color: colors.textDim, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },

  tabContainer: { marginBottom: SPACING.lg },

  // Forms
  formGroup: { marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
  sublabel: { fontSize: FONT_SIZE.xs, color: colors.textDim, marginBottom: SPACING.sm },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.lg, color: colors.text,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Order list
  orderList: { ...cs.card, overflow: 'hidden' },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  orderRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  orderRowBody: { flex: 1 },
  orderRowCode: { fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text },
  orderRowDate: { fontSize: FONT_SIZE.xs, color: colors.textDim },
  orderRowAmount: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  statusPill: {
    borderWidth: 1, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  statusPillText: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase' },

  // Adjustment type grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: RADIUS.md, paddingVertical: SPACING.md, gap: SPACING.sm, minWidth: '45%',
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  optionText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: '700' },

  // Footer
  footer: { padding: SPACING.lg, backgroundColor: colors.background },
});
