import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { FileSpreadsheet } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';
import ModalPicker, { ModalPickerTrigger } from '../components/ModalPicker';
import StickyScrollView from '../components/StickyScrollView';

type Props = NativeStackScreenProps<RootStackParamList, 'DiscrepancyReport'>;

export default function DiscrepancyReportScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { products, addDiscrepancyReport } = useMockData();
  const initialProductId = route.params?.productId;

  const [productId, setProductId] = useState(initialProductId || products[0]?.id || '');
  const [expectedQty, setExpectedQty] = useState('');
  const [actualQty, setActualQty] = useState('');
  const [notes, setNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = () => {
    if (!productId || !expectedQty || !actualQty) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const expected = parseInt(expectedQty);
    const actual = parseInt(actualQty);

    if (isNaN(expected) || isNaN(actual)) {
      Alert.alert('Error', 'Quantities must be numeric');
      return;
    }

    addDiscrepancyReport(productId, expected, actual, notes);
    
    // Clear and navigate
    setExpectedQty('');
    setActualQty('');
    setNotes('');
    setSuccessMsg('Your discrepancy report has been logged and inventory adjustments applied successfully.');
    setSuccessVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: SPACING.lg },
    formGroup: { marginBottom: SPACING.xl },
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
    textArea: {
      ...commonStyles.input,
      height: 100,
      textAlignVertical: 'top',
    },
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
      maxHeight: '60%',
      padding: SPACING.sm,
    },
    pickerItem: {
      padding: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerItemText: { fontSize: FONT_SIZE.xl, color: colors.text },
    actionPad: { padding: SPACING.lg },
  });

  return (
    <View style={styles.container}>
      <StickyScrollView contentContainerStyle={styles.content}>
        {/* Product selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Product</Text>
          <ModalPickerTrigger
            label={selectedProduct ? selectedProduct.name : ''}
            onPress={() => setShowPicker(true)}
          />
        </View>

        {/* Expected Qty */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Expected Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            value={expectedQty}
            onChangeText={setExpectedQty}
          />
        </View>

        {/* Actual Qty */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Actual Physical Count</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 48"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            value={actualQty}
            onChangeText={setActualQty}
          />
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Explanation / Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the discrepancy reason (e.g. damaged unit, miscount, theft, registry error)"
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

      </StickyScrollView>
      <View style={styles.actionPad}>
        <AppButton
          label="Submit Discrepancy Report"
          onPress={handleSubmit}
          variant="primary"
          icon={<FileSpreadsheet size={20} color="#fff" />}
          fullWidth
        />
      </View>

      <ModalPicker
        visible={showPicker}
        title="Select Product"
        options={products.map(p => p.name)}
        selected={selectedProduct ? selectedProduct.name : ''}
        onSelect={(name) => {
          const prod = products.find(p => p.name === name);
          if (prod) setProductId(prod.id);
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />

      <SuccessOverlay
        visible={successVisible}
        title="Discrepancy Logged"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
