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
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';

export default function ScanScreen() {
  const { colors, commonStyles, typography } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);
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

  return (
    <TouchableWithoutFeedback onPress={close}>
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
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={!selectedBatchId || activeBatches.length === 0}
          >
            <Text style={styles.actionBtnText}>Register Serial Number</Text>
          </TouchableOpacity>
        </View>

        {/* ── Scans Log ── */}
        <SectionHeader title="Recent Scans Log" />
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
              <EmptyState message="No registered serials yet" style={{ paddingVertical: SPACING.md }} />
            )}
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const TRIGGER_HEIGHT = 48; // approximate height of the trigger button

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  scroll: { ...cs.scroll },
  content: { ...cs.content },

  card: {
    ...cs.card,
    padding: SPACING.xl,
  },

  fieldLabel: {
    ...typo.fieldLabel,
  },

  input: {
    ...cs.input,
    marginBottom: SPACING.xl,
  },

  // ── Batch dropdown ─────────────────────────────────────────────────────────
  dropdownWrapper: {
    zIndex: 100,
    marginBottom: 0,
  },

  dropdownOverlay: {
    position: 'absolute',
    top: -2000,
    left: -2000,
    right: -2000,
    bottom: -2000,
    zIndex: 1,
  },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    height: TRIGGER_HEIGHT,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerDisabled: { opacity: 0.45 },
  dropdownTriggerText: { flex: 1, fontSize: FONT_SIZE.xl, color: colors.text, marginRight: SPACING.sm },
  dropdownTriggerPlaceholder: { color: colors.textDim },

  dropdownList: {
    position: 'absolute',
    top: TRIGGER_HEIGHT - 1,
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  dropdownOptionBorder: { ...cs.listItemDivider },
  dropdownOptionSelected: { backgroundColor: colors.primary + '14' },
  dropdownOptionInner: { flex: 1 },
  dropdownOptionName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: colors.text },
  dropdownOptionMeta: { fontSize: FONT_SIZE.md, color: colors.textDim, marginTop: 2 },
  dropdownCheck: { marginLeft: SPACING.sm },

  dropdownSpacer: { height: 20 },

  // ── Register button ────────────────────────────────────────────────────────
  actionBtn: {
    ...cs.button,
  },
  actionBtnDisabled: { ...cs.buttonDisabled },
  actionBtnText: { ...cs.buttonText },

  // ── Scan log ──────────────────────────────────────────────────────────────
  logContainer: { flexDirection: 'column' },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: 10 },
  logItemDivider: { ...cs.listItemDivider },
  logIconComponent: { marginRight: 2 },
  logText: { fontSize: FONT_SIZE.lg, color: colors.textMuted },
  boldText: { color: colors.text, fontWeight: '700' },
});
