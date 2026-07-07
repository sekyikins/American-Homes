import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { ArrowUpDown, ChevronDown, Plus, Minus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'StockAdjust'>;

export default function StockAdjustScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { products, adjustStock } = useMockData();

  const initialProductId = route.params?.productId;

  const [productId, setProductId] = useState(initialProductId || products[0]?.id || '');
  const [direction, setDirection] = useState<'add' | 'remove'>('add');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  const handleAdjust = () => {
    if (!productId || !qty || !reason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const adjustmentAmount = parseInt(qty);
    if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
      Alert.alert('Error', 'Quantity must be a positive number');
      return;
    }

    const signedQty = direction === 'add' ? adjustmentAmount : -adjustmentAmount;

    adjustStock(productId, signedQty, reason);

    setQty('');
    setReason('');
    setSuccessMsg(`Stock level adjusted successfully. System records updated by ${signedQty > 0 ? '+' : ''}${signedQty} units for ${selectedProduct?.name || ''}.`);
    setSuccessVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
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
    directionContainer: { flexDirection: 'row', gap: 12 },
    directionBtn: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      gap: 6,
    },
    directionBtnActiveAdd: {
      borderColor: colors.success,
      backgroundColor: colors.success + '15',
    },
    directionBtnActiveRemove: {
      borderColor: colors.error,
      backgroundColor: colors.error + '15',
    },
    directionText: { fontSize: 14, fontWeight: '600', color: colors.text },
    directionTextActiveAdd: { color: colors.success, fontWeight: '700' },
    directionTextActiveRemove: { color: colors.error, fontWeight: '700' },
    input: { ...commonStyles.input },
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
      maxHeight: '60%',
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Product</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowProductPicker(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedProduct ? selectedProduct.name : 'Choose a product'}
            </Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Direction Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Adjustment Type</Text>
          <View style={styles.directionContainer}>
            <TouchableOpacity
              style={[styles.directionBtn, direction === 'add' && styles.directionBtnActiveAdd]}
              onPress={() => setDirection('add')}
            >
              <Plus size={16} color={direction === 'add' ? colors.success : colors.textDim} />
              <Text style={[styles.directionText, direction === 'add' && styles.directionTextActiveAdd]}>Add Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.directionBtn, direction === 'remove' && styles.directionBtnActiveRemove]}
              onPress={() => setDirection('remove')}
            >
              <Minus size={16} color={direction === 'remove' ? colors.error : colors.textDim} />
              <Text style={[styles.directionText, direction === 'remove' && styles.directionTextActiveRemove]}>Deduct Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Adjustment Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 10"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
          />
        </View>

        {/* Reason */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason / Reference</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Inbound supplier correction, restock, scrap audit"
            placeholderTextColor={colors.textDim}
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <AppButton
          label="Apply Adjustment"
          onPress={handleAdjust}
          variant="primary"
          icon={<ArrowUpDown size={20} color="#fff" />}
          fullWidth
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      {/* Product Modal */}
      {showProductPicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProductPicker(false)}>
          <View style={styles.pickerModal}>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setProductId(item.id);
                    setShowProductPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      )}

      <SuccessOverlay
        visible={successVisible}
        title="Adjustment Logged"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
