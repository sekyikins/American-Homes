import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';

import { useTheme } from '../styles/theme';

import { useMockData } from '../context/MockDataContext';

export default function ScanScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { products, batches, units, registerSerial, shipments } = useMockData();
  const [scannedUnitSerial, setScannedUnitSerial] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
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
      };
    });

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
      alert('Serial registered successfully!');
    } else {
      alert('Serial number already exists!');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
  const displayLabel = selectedBatch
    ? `${selectedBatch.product_name}  ·  ${selectedBatch.shipment_code}`
    : activeBatches.length === 0
      ? 'No active batches available'
      : 'Select product batch…';

  const close = () => setDropdownOpen(false);

  // Wire up the button action below
  const handleRegisterSerial = handleRegister;

  return (
    <TouchableWithoutFeedback onPress={close}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onScrollBeginDrag={close}
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
            onFocus={close}
          />

          {/* 2. Batch dropdown — floats over content below via zIndex */}
          <Text style={styles.fieldLabel}>Product Batch</Text>
          <View style={styles.dropdownWrapper}>
            {/* Outside-tap dismiss overlay — invisible, full-screen, behind panel */}
            {dropdownOpen && (
              <TouchableWithoutFeedback onPress={close}>
                <View style={styles.dropdownOverlay} />
              </TouchableWithoutFeedback>
            )}

            {/* Trigger row */}
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                dropdownOpen && styles.dropdownTriggerOpen,
                activeBatches.length === 0 && styles.dropdownTriggerDisabled,
              ]}
              onPress={() => activeBatches.length > 0 && setDropdownOpen(v => !v)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownTriggerText,
                  !selectedBatch && styles.dropdownTriggerPlaceholder,
                ]}
                numberOfLines={1}
              >
                {displayLabel}
              </Text>
              {dropdownOpen ? (
                <ChevronUp size={16} color={colors.textDim} />
              ) : (
                <ChevronDown size={16} color={colors.textDim} />
              )}
            </TouchableOpacity>

            {/* Floating panel — position absolute so it overlays content below */}
            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {activeBatches.map((batch, idx) => {
                  const isSelected = batch.id === selectedBatchId;
                  return (
                    <TouchableOpacity
                      key={batch.id}
                      style={[
                        styles.dropdownOption,
                        idx < activeBatches.length - 1 && styles.dropdownOptionBorder,
                        isSelected && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedBatchId(batch.id);
                        setDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownOptionInner}>
                        <Text
                          style={[
                            styles.dropdownOptionName,
                            isSelected && { color: colors.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {batch.product_name}
                        </Text>
                        <Text style={styles.dropdownOptionMeta}>
                          {batch.shipment_code}  ·  {batch.remaining_quantity} remaining
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={18} color={colors.primary} style={styles.dropdownCheck} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Spacer only shown when dropdown is closed so button stays consistent */}
          <View style={styles.dropdownSpacer} />

          {/* 3. Register button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              (!selectedBatchId || activeBatches.length === 0) && styles.actionBtnDisabled,
            ]}
            onPress={handleRegisterSerial}
            activeOpacity={0.8}
            disabled={!selectedBatchId || activeBatches.length === 0}
          >
            <Text style={styles.actionBtnText}>Register Serial Number</Text>
          </TouchableOpacity>
        </View>

        {/* ── Scans Log ── */}
        <Text style={styles.sectionTitle}>Recent Scans Log</Text>
        <View style={styles.card}>
          <View style={styles.logContainer}>
            {scannedHistory.map((sn, idx) => (
              <View
                key={idx}
                style={[
                  styles.logItem,
                  idx < scannedHistory.length - 1 && styles.logItemDivider,
                ]}
              >
                <Check size={16} color={colors.success} style={styles.logIconComponent} />
                <Text style={styles.logText}>
                  Registered: <Text style={styles.boldText}>{sn}</Text>
                </Text>
              </View>
            ))}
            {scannedHistory.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No registered serials yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const TRIGGER_HEIGHT = 48; // approximate height of the trigger button

const createStyles = (colors: any) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: 20,
  },

  // ── Batch dropdown ─────────────────────────────────────────────────────────
  dropdownWrapper: {
    // This is the positioning context for the floating panel
    zIndex: 100,
    marginBottom: 0,
  },

  // Full-screen invisible overlay behind the panel: tap anywhere outside → close
  dropdownOverlay: {
    position: 'absolute',
    top: -2000,
    left: -2000,
    right: -2000,
    bottom: -2000,
    zIndex: 1,            // behind the panel
  },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    height: TRIGGER_HEIGHT,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,  // merged with list top border
  },
  dropdownTriggerDisabled: { opacity: 0.45 },
  dropdownTriggerText: { flex: 1, fontSize: 15, color: colors.text, marginRight: 8 },
  dropdownTriggerPlaceholder: { color: colors.textDim },

  // Floating panel — sits on top of content below via absolute + zIndex
  dropdownList: {
    position: 'absolute',
    top: TRIGGER_HEIGHT - 1,   // overlap trigger's bottom border by 1px
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  dropdownOptionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownOptionSelected: { backgroundColor: colors.primary + '14' },
  dropdownOptionInner: { flex: 1 },
  dropdownOptionName: { fontSize: 14, fontWeight: '600', color: colors.text },
  dropdownOptionMeta: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  dropdownCheck: { marginLeft: 8 },

  // Fixed spacer so card height stays consistent whether dropdown is open or not
  dropdownSpacer: { height: 20 },

  // ── Register button ────────────────────────────────────────────────────────
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { backgroundColor: colors.border },
  actionBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // ── Scan log ──────────────────────────────────────────────────────────────
  logContainer: { flexDirection: 'column' },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  logItemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  logIconComponent: { marginRight: 2 },
  logText: { fontSize: 14, color: colors.textMuted },
  boldText: { color: colors.text, fontWeight: '700' },
  emptyContainer: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: colors.textDim, fontSize: 14 },
});
