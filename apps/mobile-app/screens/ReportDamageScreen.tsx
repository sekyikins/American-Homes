import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Hammer, ChevronDown } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportDamage'>;

export default function ReportDamageScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { products, units, batches, addDamageReport } = useMockData();
  const initialProductId = route.params?.productId;

  const [productId, setProductId] = useState(initialProductId || products[0]?.id || '');
  const [serialNumber, setSerialNumber] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showSerialPicker, setShowSerialPicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedProduct = products.find(p => p.id === productId);
  const severities = ['Low', 'Medium', 'High'];

  // Available serials for this product
  const availableSerials = units.filter(u => {
    if (u.status !== 'available') return false;
    const batch = batches.find(b => b.id === u.batch_id);
    return batch?.product_id === productId;
  });

  const handleSubmit = () => {
    if (!productId || !severity || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (selectedProduct?.has_serial && !serialNumber) {
      Alert.alert('Error', 'Please select a serial number for this product');
      return;
    }

    addDamageReport(productId, serialNumber || '', severity as any, description);

    setDescription('');
    setSerialNumber('');
    setSuccessMsg(`Damage report logged. Adjusted inventory for ${selectedProduct?.name || 'product'}.`);
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
    severityContainer: { flexDirection: 'row', gap: SPACING.sm },
    severityBtn: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    severityBtnActive: {
      borderColor: colors.error,
      backgroundColor: colors.error + '15',
    },
    severityText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: colors.text },
    severityTextActive: { color: colors.error, fontWeight: '700' },
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Damaged Product</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowProductPicker(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedProduct ? selectedProduct.name : 'Choose a product'}
            </Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {selectedProduct?.has_serial && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Serial Number</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSerialPicker(true)}>
              <Text style={styles.pickerBtnText}>
                {serialNumber ? serialNumber : 'Choose a serial number'}
              </Text>
              <ChevronDown size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Damage Severity</Text>
          <View style={styles.severityContainer}>
            {severities.map((sev) => {
              const isActive = severity === sev;
              return (
                <TouchableOpacity
                  key={sev}
                  style={[styles.severityBtn, isActive && styles.severityBtnActive]}
                  onPress={() => setSeverity(sev)}
                >
                  <Text style={[styles.severityText, isActive && styles.severityTextActive]}>{sev}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description of Damage</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the physical damage..."
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>

      <View style={styles.actionPad}>
        <AppButton
          label="Submit Damage Report"
          onPress={handleSubmit}
          variant="primary"
          icon={<Hammer size={20} color="#fff" />}
          fullWidth
          style={{ backgroundColor: colors.error, borderColor: colors.error }}
        />
      </View>

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
                    setSerialNumber('');
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

      {/* Serial Modal */}
      {showSerialPicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSerialPicker(false)}>
          <View style={styles.pickerModal}>
            {availableSerials.length === 0 ? (
              <View style={styles.pickerItem}><Text style={styles.pickerItemText}>No available serial units found in stock</Text></View>
            ) : (
              <FlatList
                data={availableSerials}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSerialNumber(item.serial_number);
                      setShowSerialPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.serial_number}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      )}

      <SuccessOverlay
        visible={successVisible}
        title="Damage Logged"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
