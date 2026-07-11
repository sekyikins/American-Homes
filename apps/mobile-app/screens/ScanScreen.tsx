import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import ModalPicker, { ModalPickerTrigger } from '../components/ModalPicker';

export default function ScanScreen() {
  const { colors, commonStyles, typography } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  const { products, batches, units, registerSerial, shipments } = useMockData();
  const [scannedUnitSerial, setScannedUnitSerial] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Map batches of serialized products
  const activeBatches = batches
    .filter(b => {
      const prod = products.find(p => p.id === b.product_id);
      return prod?.has_serial;
    })
    .map(b => {
      const prod = products.find(p => p.id === b.product_id);
      const shp = shipments.find(s => s.id === b.shipment_id);
      return {
        id: b.id,
        product_id: b.product_id,
        product_name: prod ? prod.name : 'Unknown Product',
        remaining_quantity: b.remaining_quantity,
        shipment_code: shp ? shp.shipment_code : 'Direct Load',
        label: `${prod?.name ?? 'Unknown'} · ${shp?.shipment_code ?? 'Direct'}`,
      };
    });

  // Build option labels for the modal picker
  const batchOptions = activeBatches.map(b => b.label);

  // Default selected batch if empty
  useEffect(() => {
    if (activeBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(activeBatches[0].id);
    }
  }, [batches]);

  // Derived scanned history of units in the selected batch
  const scannedHistory = units
    .filter(u => u.batch_id === selectedBatchId)
    .map(u => u.serial_number);

  const handleRegister = () => {
    if (!scannedUnitSerial.trim() || !selectedBatchId) return;
    const success = registerSerial(selectedBatchId, scannedUnitSerial.trim());
    if (success) {
      setScannedUnitSerial('');
      // show inline confirmation instead of blocking alert
    } else {
      // handled inline via duplicate detection below
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
  const selectedLabel = selectedBatch?.label ?? '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Registration Card ── */}
      <View style={styles.card}>
        {/* 1. Serial number input */}
        <Text style={styles.fieldLabel}>Serial Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Scan / type serial number (e.g. SN-…)"
          placeholderTextColor={colors.textDim}
          value={scannedUnitSerial}
          onChangeText={setScannedUnitSerial}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        {/* 2. Batch selector */}
        <Text style={styles.fieldLabel}>Product Batch</Text>
        <ModalPickerTrigger
          label={selectedLabel}
          placeholder={activeBatches.length === 0 ? 'No active batches' : 'Select product batch…'}
          onPress={() => activeBatches.length > 0 && setShowBatchPicker(true)}
          disabled={activeBatches.length === 0}
        />

        <View style={{ height: SPACING.xl }} />

        {/* 3. Register button */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            (!selectedBatchId || activeBatches.length === 0) && styles.actionBtnDisabled,
          ]}
          onPress={handleRegister}
          activeOpacity={0.8}
          disabled={!selectedBatchId || activeBatches.length === 0}
        >
          <Text style={styles.actionBtnText}>Register Serial Number</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scans Log ── */}
      <SectionHeader title="Recent Scans Log" variant="compact" style={{ paddingTop: SPACING.lg }} />
      <View style={styles.card}>
        <View style={styles.logContainer}>
          {scannedHistory.map((sn, idx) => (
            <View
              key={idx}
              style={[styles.logItem, idx < scannedHistory.length - 1 && styles.logItemDivider]}
            >
              <Check size={16} color={colors.success} />
              <Text style={styles.logText}>
                Registered: <Text style={styles.boldText}>{sn}</Text>
              </Text>
            </View>
          ))}
          {scannedHistory.length === 0 && (
            <EmptyState message="No registered serials yet" style={{ paddingVertical: SPACING.md }} />
          )}
        </View>
      </View>

      {/* ── Batch Modal Picker ── */}
      <ModalPicker
        visible={showBatchPicker}
        title="Select Product Batch"
        options={batchOptions}
        selected={selectedLabel}
        onSelect={(label) => {
          const batch = activeBatches.find(b => b.label === label);
          if (batch) setSelectedBatchId(batch.id);
          setShowBatchPicker(false);
        }}
        onClose={() => setShowBatchPicker(false)}
      />
    </ScrollView>
  );
}

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  scroll: { ...cs.scroll },
  content: { ...cs.content },

  card: {
    ...cs.card,
    padding: SPACING.xl,
  },

  fieldLabel: { ...typo.fieldLabel },

  input: {
    ...cs.input,
    marginBottom: SPACING.lg,
  },

  // ── Register button ────────────────────────────────────────────────────────
  actionBtn: { ...cs.button, padding: 0 },
  actionBtnDisabled: { ...cs.buttonDisabled },
  actionBtnText: { ...cs.buttonText },

  // ── Scan log ──────────────────────────────────────────────────────────────
  logContainer: { flexDirection: 'column' },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.sm },
  logItemDivider: { ...cs.listItemDivider },
  logText: { fontSize: FONT_SIZE.lg, color: colors.textMuted },
  boldText: { color: colors.text, fontWeight: '700' },
});
