import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { AlertTriangle, ChevronDown } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AppButton from '../components/AppButton';
import SuccessOverlay from '../components/SuccessOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportShipment'>;

export default function ReportShipmentScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { shipments, addShipmentReport } = useMockData();
  const initialShipmentId = route.params?.shipmentId;

  const [shipmentId, setShipmentId] = useState(initialShipmentId || shipments[0]?.id || '');
  const [issueType, setIssueType] = useState('Delay');
  const [description, setDescription] = useState('');
  const [showShipmentPicker, setShowShipmentPicker] = useState(false);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedShipment = shipments.find(s => s.id === shipmentId);
  const issueTypes = ['Delay', 'Damage', 'Missing Items', 'Customs Hold', 'Other'];

  const handleSubmit = () => {
    if (!shipmentId || !issueType || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    addShipmentReport(shipmentId, issueType, description);

    setDescription('');
    setSuccessMsg(`Shipment issue report submitted for ${selectedShipment?.shipment_code || 'shipment'}.`);
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

      </ScrollView>
      <View style={styles.actionPad}>
        <AppButton
          label="Submit Shipment Report"
          onPress={handleSubmit}
          variant="primary"
          icon={<AlertTriangle size={20} color="#fff" />}
          fullWidth
        />
      </View>

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
