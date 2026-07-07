import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { PackagePlus, ChevronDown } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiveStock'>;

export default function ReceiveStockScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { shipments, products, receiveShipmentStock } = useMockData();
  
  const initialShipmentId = route.params?.shipmentId;
  const activeShipments = shipments.filter(s => s.status !== 'received');

  const [shipmentId, setShipmentId] = useState(
    initialShipmentId || (activeShipments.length > 0 ? activeShipments[0].id : '')
  );
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qtyReceived, setQtyReceived] = useState('');
  const [costPrice, setCostPrice] = useState('');
  
  const [showShipmentPicker, setShowShipmentPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedShipment = shipments.find(s => s.id === shipmentId);
  const selectedProduct = products.find(p => p.id === productId);

  const handleReceive = () => {
    if (!shipmentId || !productId || !qtyReceived || !costPrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const qty = parseInt(qtyReceived);
    const cost = parseFloat(costPrice);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Quantity must be greater than zero');
      return;
    }

    if (isNaN(cost) || cost < 0) {
      Alert.alert('Error', 'Cost price must be positive');
      return;
    }

    receiveShipmentStock(shipmentId, productId, qty, cost);

    setQtyReceived('');
    setCostPrice('');
    setSuccessMsg(`Stock successfully logged into inventory. Registered ${qty} units of ${selectedProduct?.name || 'product'} under batch.`);
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
        {/* Shipment Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Shipment</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowShipmentPicker(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedShipment ? `${selectedShipment.shipment_code} (${selectedShipment.supplier_country})` : 'Choose shipment'}
            </Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Product Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Product</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowProductPicker(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedProduct ? selectedProduct.name : 'Choose product'}
            </Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Quantity */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantity Received</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            value={qtyReceived}
            onChangeText={setQtyReceived}
          />
        </View>

        {/* Cost Price */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Cost Price per Unit ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 24.50"
            placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            value={costPrice}
            onChangeText={setCostPrice}
          />
        </View>

        <AppButton
          label="Confirm Reception"
          onPress={handleReceive}
          variant="primary"
          icon={<PackagePlus size={20} color="#fff" />}
          fullWidth
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      {/* Shipment Modal */}
      {showShipmentPicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowShipmentPicker(false)}>
          <View style={styles.pickerModal}>
            {activeShipments.length === 0 ? (
              <View style={styles.pickerItem}><Text style={styles.pickerItemText}>No shipments in transit</Text></View>
            ) : (
              <FlatList
                data={activeShipments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setShipmentId(item.id);
                      setShowShipmentPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.shipment_code} - {item.supplier_country}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      )}

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
        title="Stock Received"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
