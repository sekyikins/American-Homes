import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Mock data representing local cache on phone
const CACHED_ITEMS = [
  { id: '1', name: 'Smart Inverter Fridge', sku: 'REF-INV-001', stock: 120, serialized: true },
  { id: '2', name: 'Premium Sofa Set', sku: 'SOF-SET-002', stock: 45, serialized: false },
  { id: '3', name: 'UHD Smart TV 55"', sku: 'TV-UHD-003', stock: 8, serialized: true }
];

export default function App() {
  const [skuSearch, setSkuSearch] = React.useState('');
  const [scannedUnitSerial, setScannedUnitSerial] = React.useState('');
  const [selectedProductId, setSelectedProductId] = React.useState('1');
  const [stockLevels, setStockLevels] = React.useState(CACHED_ITEMS);
  const [scannedHistory, setScannedHistory] = React.useState<string[]>([
    'SN-FRIDGE-99218-A',
    'SN-FRIDGE-88310-B'
  ]);

  // Simulate scanning code
  const handleRegisterSerial = () => {
    if (!scannedUnitSerial) return;
    setScannedHistory(prev => [scannedUnitSerial, ...prev]);
    
    // Update stock levels
    setStockLevels(prev => prev.map(item => {
      if (item.id === selectedProductId) {
        return { ...item, stock: item.stock + 1 };
      }
      return item;
    }));

    setScannedUnitSerial('');
  };

  const filteredItems = stockLevels.filter(item => 
    item.name.toLowerCase().includes(skuSearch.toLowerCase()) || 
    item.sku.toLowerCase().includes(skuSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ICOS Mobile Stock</Text>
        <View style={styles.activeTag}>
          <Text style={styles.activeTagText}>INVENTORY UNIT</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        
        {/* Section 1: Quick Search */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Stock Checker</Text>
          <Text style={styles.cardSubtitle}>Query current remaining stock derived from ledger.</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Search by SKU or Product Name..." 
            placeholderTextColor="#64748b"
            value={skuSearch}
            onChangeText={setSkuSearch}
          />

          <View style={styles.listContainer}>
            {filteredItems.map(item => (
              <View key={item.id} style={styles.listItem}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>SKU: {item.sku} {item.serialized ? '• Serialized' : ''}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockBadgeText}>{item.stock}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: Barcode Serial Registration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inbound Serial Registration</Text>
          <Text style={styles.cardSubtitle}>Scan and log serial numbers for incoming shipment batches.</Text>

          <Text style={styles.fieldLabel}>Select Target Product Batch:</Text>
          <View style={styles.selectorRow}>
            {stockLevels.filter(i => i.serialized).map(item => (
              <TouchableOpacity 
                key={item.id}
                style={[styles.selectorBtn, selectedProductId === item.id && styles.selectorBtnActive]}
                onPress={() => setSelectedProductId(item.id)}
              >
                <Text style={[styles.selectorBtnText, selectedProductId === item.id && styles.selectorBtnTextActive]}>
                  {item.sku}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput 
            style={styles.input} 
            placeholder="Scan / Type Serial Number (e.g. SN-...)" 
            placeholderTextColor="#64748b"
            value={scannedUnitSerial}
            onChangeText={setScannedUnitSerial}
          />

          <TouchableOpacity style={styles.actionBtn} onPress={handleRegisterSerial}>
            <Text style={styles.actionBtnText}>Register Serial Number</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Scan Log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Scans Log</Text>
          <View style={styles.logContainer}>
            {scannedHistory.map((sn, idx) => (
              <View key={idx} style={styles.logItem}>
                <Text style={styles.logIcon}>✓</Text>
                <Text style={styles.logText}>Registered: <Text style={styles.boldText}>{sn}</Text></Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Dark navy background
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  activeTag: {
    backgroundColor: '#1e1b4b',
    borderColor: '#3730a3',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeTagText: {
    fontSize: 9,
    color: '#818cf8',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 13,
  },
  listContainer: {
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  itemName: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  itemSku: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  stockBadge: {
    backgroundColor: '#064e3b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  selectorBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  selectorBtnActive: {
    backgroundColor: '#4f46e5',
  },
  selectorBtnText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    color: '#ffffff',
  },
  actionBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  logContainer: {
    gap: 10,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logIcon: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  logText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
