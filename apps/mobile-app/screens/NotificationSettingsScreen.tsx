import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen({ navigation }: Props) {
  const { colors, typography } = useTheme();
  const [lowStock, setLowStock] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [shipmentAlerts, setShipmentAlerts] = useState(true);
  const [walletActivity, setWalletActivity] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [tastReminders, setTastReminders] = useState(true);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 10 },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingText: { fontSize: 16, fontWeight: '500', color: colors.text },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Low Stock Alerts</Text>
          <Switch value={lowStock} onValueChange={setLowStock} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={lowStock ? colors.primary : colors.textDim} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Order Updates</Text>
          <Switch value={orderUpdates} onValueChange={setOrderUpdates} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={orderUpdates ? colors.primary : colors.textDim} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Shipment Alerts</Text>
          <Switch value={shipmentAlerts} onValueChange={setShipmentAlerts} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={shipmentAlerts ? colors.primary : colors.textDim} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Wallet Activity</Text>
          <Switch value={walletActivity} onValueChange={setWalletActivity} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={walletActivity ? colors.primary : colors.textDim} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Task Reminders</Text>
          <Switch value={tastReminders} onValueChange={setTastReminders} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={tastReminders ? colors.primary : colors.textDim} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Promotions & Offers</Text>
          <Switch value={promotions} onValueChange={setPromotions} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={promotions ? colors.primary : colors.textDim} />
        </View>
      </View>
    </View>
  );
}
