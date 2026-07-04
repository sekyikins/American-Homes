import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ChevronLeft, DollarSign, Wallet, ArrowUpRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Withdraw'>;

const networks = ['MTN Mobile Money', 'Telecel Cash', 'Telecel Cash (Momo)', 'Bank Transfer'];

export default function WithdrawScreen({ navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { walletBalance, addWithdrawal } = useMockData();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState(networks[0]);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);

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

    if (value > walletBalance) {
      Alert.alert('Insufficient Balance', `Your current balance is $${walletBalance.toFixed(2)}`);
      return;
    }

    const success = addWithdrawal(value, network, phone);
    if (success) {
      setAmount('');
      setPhone('');
      navigation.navigate('ReportSuccess', {
        title: 'Withdrawal Initiated',
        message: `Your withdrawal of $${value.toFixed(2)} to ${network} (${phone}) has been submitted and is currently processing.`,
      });
    } else {
      Alert.alert('Error', 'Failed to initiate withdrawal');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: 'center',
      marginBottom: 20,
    },
    balanceLabel: { fontSize: 13, color: colors.textDim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    balanceValue: { fontSize: 28, fontWeight: '800', color: colors.primary, marginTop: 8 },
    formGroup: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
    pickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
    },
    pickerBtnText: { flex: 1, fontSize: 15, color: colors.text },
    input: { ...commonStyles.input },
    submitBtn: {
      ...commonStyles.button,
      marginTop: 20,
      flexDirection: 'row',
      gap: 8,
    },
    submitBtnText: { ...commonStyles.buttonText },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20,
      zIndex: 1000,
    },
    pickerModal: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
    },
    pickerItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerItemText: { fontSize: 15, color: colors.text },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>${walletBalance.toFixed(2)}</Text>
        </View>

        {/* Network Picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Payout Provider</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowNetworkPicker(true)}>
            <Text style={styles.pickerBtnText}>{network}</Text>
            <ChevronLeft size={20} color={colors.textDim} style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
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

        <TouchableOpacity style={styles.submitBtn} onPress={handleWithdraw} activeOpacity={0.8}>
          <ArrowUpRight size={20} color="#fff" />
          <Text style={styles.submitBtnText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </ScrollView>

      {showNetworkPicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNetworkPicker(false)}>
          <View style={styles.pickerModal}>
            {networks.map((net) => (
              <TouchableOpacity
                key={net}
                style={styles.pickerItem}
                onPress={() => {
                  setNetwork(net);
                  setShowNetworkPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{net}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
