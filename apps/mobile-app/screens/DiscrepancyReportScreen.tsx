import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { FileSpreadsheet, ChevronDown } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

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
      <ScrollView contentContainerStyle={styles.content}>
        {/* Product selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Product</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedProduct ? selectedProduct.name : 'Choose a product'}
            </Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
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

        <AppButton
          label="Submit Discrepancy Report"
          onPress={handleSubmit}
          variant="primary"
          icon={<FileSpreadsheet size={20} color="#fff" />}
          fullWidth
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      {showPicker && (
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerModal}>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setProductId(item.id);
                    setShowPicker(false);
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
