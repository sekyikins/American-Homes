import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface ActiveBatch {
  id: string;
  product_id: string;
  product_name: string;
  remaining_quantity: number;
  shipment_code: string;
}

interface ScanScreenProps {
  activeBatches: ActiveBatch[];
  scannedUnitSerial: string;
  setScannedUnitSerial: (text: string) => void;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  scannedHistory: string[];
  handleRegisterSerial: () => void;
}

export default function ScanScreen({
  activeBatches,
  scannedUnitSerial,
  setScannedUnitSerial,
  selectedBatchId,
  setSelectedBatchId,
  scannedHistory,
  handleRegisterSerial,
}: ScanScreenProps) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageSubtitle}>Scan and log serial numbers for incoming shipment batches.</Text>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Select Target Product Batch:</Text>
        <View style={styles.selectorRow}>
          {activeBatches.map((batch) => {
            const isActive = selectedBatchId === batch.id;
            return (
              <TouchableOpacity
                key={batch.id}
                style={[styles.selectorBtn, isActive && styles.selectorBtnActive]}
                onPress={() => setSelectedBatchId(batch.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectorBtnText,
                    isActive && styles.selectorBtnTextActive,
                  ]}
                >
                  {batch.product_name} ({batch.shipment_code})
                </Text>
              </TouchableOpacity>
            );
          })}
          {activeBatches.length === 0 && (
            <Text style={styles.emptyText}>No active serialized product batches found.</Text>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Scan / Type Serial Number (e.g. SN-...)"
          placeholderTextColor="#71717a"
          value={scannedUnitSerial}
          onChangeText={setScannedUnitSerial}
        />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleRegisterSerial}
          activeOpacity={0.8}
          disabled={activeBatches.length === 0}
        >
          <Text style={styles.actionBtnText}>Register Serial Number</Text>
        </TouchableOpacity>
      </View>

      {/* Scans Log Card */}
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
              <Text style={styles.logIcon}>✓</Text>
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
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 6,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a1a1aa',
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 10,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  selectorBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  selectorBtnText: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    color: '#fafafa',
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#fafafa',
    fontSize: 15,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '700',
  },
  logContainer: {
    flexDirection: 'column',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  logItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  logIcon: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logText: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  boldText: {
    color: '#fafafa',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
  },
});
