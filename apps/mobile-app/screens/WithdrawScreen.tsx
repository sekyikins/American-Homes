import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SPACING, RADIUS, FONT_SIZE, useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ArrowUpRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';
import ModalPicker, { ModalPickerTrigger } from '../components/ModalPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'Withdraw'>;

const networks = ['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Bank Transfer'];

export default function WithdrawScreen({ navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const mockData = useMockData();
  const { currentUser, addWithdrawal } = mockData;

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState(networks[0]);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const myBalance = currentUser?.balance ?? 0;

  const handleWithdraw = () => {
    if (!amount || !phone || !network) {
      Alert.alert('Error', 'Please enter amount, phone number and select network');
      return;
    }

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    if (value > myBalance) {
      Alert.alert('Insufficient Balance', `Your current balance is $${myBalance.toFixed(2)}`);
      return;
    }

    const success = addWithdrawal(value, network, phone);
    if (success) {
      setSuccessMsg(`Your withdrawal of $${value.toFixed(2)} to ${network} (${phone}) has been submitted and is currently processing.`);
      setAmount('');
      setPhone('');
      setSuccessVisible(true);
    } else {
      Alert.alert('Error', 'Failed to initiate withdrawal');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: SPACING.lg },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    balanceLabel: { fontSize: FONT_SIZE.body, color: colors.textDim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    balanceValue: { fontSize: FONT_SIZE.hero, fontWeight: '800', color: colors.primary, marginTop: SPACING.sm },
    formGroup: { marginBottom: SPACING.md },
    label: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.textMuted, marginBottom: SPACING.sm },
    pickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    pickerBtnText: { flex: 1, fontSize: FONT_SIZE.xl, color: colors.text },
    input: { ...commonStyles.input },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: SPACING.xl,
      zIndex: 1000,
    },
    pickerModal: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.sm,
    },
    pickerItem: {
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerItemText: { fontSize: FONT_SIZE.xl, color: colors.text },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>${myBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* Network Picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Payout Provider</Text>
          <ModalPickerTrigger label={network} onPress={() => setShowNetworkPicker(true)} />
        </View>

        {/* Phone number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Recipient Phone Number / Account</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +1 (512) 555-0199"
            placeholderTextColor={colors.textDim}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Amount */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount to Withdraw ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter withdrawal amount"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </ScrollView>

      <View style={{padding: SPACING.lg}}>
        <AppButton
          label="Withdraw Funds"
          onPress={handleWithdraw}
          variant="primary"
          icon={<ArrowUpRight size={20} color="#fff" />}
          fullWidth
        />
      </View>

      <ModalPicker
        visible={showNetworkPicker}
        title="Select Payout Provider"
        options={networks}
        selected={network}
        onSelect={(net) => { setNetwork(net); setShowNetworkPicker(false); }}
        onClose={() => setShowNetworkPicker(false)}
      />

      <SuccessOverlay
        visible={successVisible}
        title="Withdrawal Initiated"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
