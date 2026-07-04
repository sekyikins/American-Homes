import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Search } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderLookup'>;

export default function OrderLookupScreen({ navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { orders } = useMockData();
  const [orderId, setOrderId] = useState('');

  const handleLookUp = () => {
    if (!orderId.trim()) {
      Alert.alert('Error', 'Please enter an Order ID');
      return;
    }

    const trimmed = orderId.trim().toLowerCase();
    
    // Search order by exact ID or short ID slice
    const foundOrder = orders.find(
      (o) => o.id.toLowerCase() === trimmed || o.id.toLowerCase().startsWith(trimmed)
    );

    if (foundOrder) {
      navigation.navigate('OrderDetail', { orderId: foundOrder.id });
    } else {
      Alert.alert('Order Not Found', 'No order matched the provided ID/prefix.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    input: { ...commonStyles.input, marginBottom: 16 },
    button: { ...commonStyles.button, flexDirection: 'row', gap: 8 },
    buttonText: { ...commonStyles.buttonText },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Enter full or partial Order ID"
          value={orderId}
          onChangeText={setOrderId}
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleLookUp}>
          <Search size={18} color="#fff" />
          <Text style={styles.buttonText}>Look Up Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
