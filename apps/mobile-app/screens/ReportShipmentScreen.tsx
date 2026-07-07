import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { AlertTriangle, ChevronDown } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportShipment'>;

const issueTypes = [
  'Incomplete inventory count',
  'Damaged shipment container',
  'Supplier delay',
  'Customs block / hold',
  'Wrong products inside packaging',
  'Pricing / invoice mismatch',
  'Other issue',
];

export default function ReportShipmentScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { shipments, addShipmentReport } = useMockData();

  const initialShipmentId = route.params?.shipmentId;

  const [shipmentId, setShipmentId] = useState(initialShipmentId || shipments[0]?.id || '');
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [description, setDescription] = useState('');

  const [showShipmentPicker, setShowShipmentPicker] = useState(false);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedShipment = shipments.find(s => s.id === shipmentId);

  const handleSubmit = () => {
    if (!shipmentId || !issueType || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    addShipmentReport(shipmentId, issueType, description);

    setDescription('');
    setSuccessMsg(`Your report regarding shipment ${selectedShipment?.shipment_code || ''} has been sent to operations control.`);
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
        {/* Shipment Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Affected Shipment</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowShipmentPicker(true)}>
            <Text style={styles.pickerBtnText}>
              {selectedShipment ? `${selectedShipment.shipment_code} (${selectedShipment.supplier_country})` : 'Choose shipment'}
            </Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Issue Type Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Issue Category</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowIssuePicker(true)}>
            <Text style={styles.pickerBtnText}>{issueType}</Text>
            <ChevronDown size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Detailed Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide tracking details, discrepancies, packaging damage details, carrier notes..."
            placeholderTextColor={colors.textDim}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <AppButton
          label="Submit Shipment Report"
          onPress={handleSubmit}
          variant="primary"
          icon={<AlertTriangle size={20} color="#fff" />}
          fullWidth
          style={{ marginTop: 20, backgroundColor: colors.pending }}
        />
      </ScrollView>

      {/* Shipment Modal */}
      {showShipmentPicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowShipmentPicker(false)}>
          <View style={styles.pickerModal}>
            <FlatList
              data={shipments}
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
          </View>
        </TouchableOpacity>
      )}

      {/* Issue Modal */}
      {showIssuePicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowIssuePicker(false)}>
          <View style={styles.pickerModal}>
            <FlatList
              data={issueTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setIssueType(item);
                    setShowIssuePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      )}

      <SuccessOverlay
        visible={successVisible}
        title="Shipment Issue Logged"
        message={successMsg}
        onDone={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
