import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
import ScanScreen from './screens/ScanScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';

// Live Supabase Client
import { supabase } from './lib/supabase';

type TabType = 'home' | 'inventory' | 'scan' | 'orders' | 'profile';

const { width: screenWidth } = Dimensions.get('window');

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const scrollViewRef = useRef<ScrollView>(null);

  // Track dynamic width of screen container to avoid rotation or scaling issues
  const [containerWidth, setContainerWidth] = useState(screenWidth);
  // Track if scrolling is programmatic (via tab press) to prevent visual tab-bar flickering
  const isProgrammaticScroll = useRef(false);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const handleScroll = (event: any) => {
    if (isProgrammaticScroll.current) return;
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / containerWidth);
    const tabs: TabType[] = ['home', 'inventory', 'scan', 'orders', 'profile'];
    if (tabs[index] && currentTab !== tabs[index]) {
      setCurrentTab(tabs[index]);
    }
  };

  const handleMomentumScrollEnd = () => {
    isProgrammaticScroll.current = false;
  };

  // Shared Data States
  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [scannedHistory, setScannedHistory] = useState<string[]>([]);
  
  // UI Search & Registration States
  const [skuSearch, setSkuSearch] = useState('');
  const [scannedUnitSerial, setScannedUnitSerial] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  const loadData = async () => {
    try {
      // Fetch products, variants, batches, and scanned history in parallel
      const [variantsResult, batchesResult, unitsResult] = await Promise.all([
        supabase
          .from('product_variants')
          .select(`
            id,
            variant_name,
            sku,
            products ( id, name, has_serial )
          `),
        supabase
          .from('inventory_batches')
          .select(`
            id,
            product_id,
            remaining_quantity,
            products ( name, has_serial ),
            shipments ( shipment_code )
          `),
        supabase
          .from('inventory_units')
          .select('serial_number')
          .order('serial_number', { ascending: false })
          .limit(10)
      ]);

      const variantsData = variantsResult.data;
      const batchesData = batchesResult.data;
      const unitsData = unitsResult.data;

      // Map stock levels aggregates by product_id
      const stockMap: Record<string, number> = {};
      if (batchesData) {
        batchesData.forEach((b) => {
          if (b.product_id) {
            stockMap[b.product_id] = (stockMap[b.product_id] || 0) + (b.remaining_quantity || 0);
          }
        });
      }

      if (variantsData) {
        const mappedStock = variantsData.map((v) => {
          const prod = v.products as any;
          const prodId = prod?.id || '';
          return {
            id: v.id,
            product_id: prodId,
            name: prod ? `${prod.name} (${v.variant_name})` : v.variant_name,
            sku: v.sku || '',
            stock: stockMap[prodId] || 0,
            serialized: prod?.has_serial || false,
          };
        });
        setStockLevels(mappedStock);
      }

      // Filter active batches of serialized products for ScanScreen selection
      if (batchesData) {
        const filteredBatches = batchesData
          .filter((b) => (b.products as any)?.has_serial)
          .map((b) => ({
            id: b.id,
            product_id: b.product_id,
            product_name: (b.products as any)?.name || 'Unknown',
            remaining_quantity: b.remaining_quantity,
            shipment_code: (b.shipments as any)?.shipment_code || 'Direct Load',
          }));
        setActiveBatches(filteredBatches);
        if (filteredBatches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(filteredBatches[0].id);
        }
      }

      if (unitsData) {
        setScannedHistory(unitsData.map((u) => u.serial_number));
      }
    } catch (e) {
      console.warn('Error fetching Supabase data in App:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle registering a serial number from ScanScreen
  const handleRegisterSerial = async () => {
    if (!scannedUnitSerial.trim() || !selectedBatchId) return;

    const trimmedSerial = scannedUnitSerial.trim();
    setLoading(true);

    try {
      // 1. Check if serial already exists
      const { data: existing } = await supabase
        .from('inventory_units')
        .select('id')
        .eq('serial_number', trimmedSerial)
        .maybeSingle();

      if (existing) {
        alert('Serial number already registered!');
        setLoading(false);
        return;
      }

      // 2. Find target batch in local activeBatches list
      const targetBatch = activeBatches.find((b) => b.id === selectedBatchId);
      if (!targetBatch) {
        setLoading(false);
        return;
      }

      // 3. Register serial in inventory_units
      const { error: insertErr } = await supabase
        .from('inventory_units')
        .insert({
          batch_id: selectedBatchId,
          serial_number: trimmedSerial,
          status: 'available',
        });

      if (insertErr) throw insertErr;

      // 4. Increment remaining_quantity in inventory_batches
      const newQty = (targetBatch.remaining_quantity || 0) + 1;
      const { error: batchErr } = await supabase
        .from('inventory_batches')
        .update({ remaining_quantity: newQty })
        .eq('id', selectedBatchId);

      if (batchErr) throw batchErr;

      // 5. Add incoming entry to inventory_ledger
      const { error: ledgerErr } = await supabase
        .from('inventory_ledger')
        .insert({
          product_id: targetBatch.product_id,
          batch_id: selectedBatchId,
          type: 'IN',
          quantity: 1,
          reference_id: `Serial registration: ${trimmedSerial}`,
        });

      if (ledgerErr) throw ledgerErr;

      // 6. Log audit entry
      await supabase.from('audit_logs').insert({
        action: 'SERIAL_SCANNED',
        details: {
          serial_number: trimmedSerial,
          batch_id: selectedBatchId,
          product_name: targetBatch.product_name,
        },
      });

      // Clear input
      setScannedUnitSerial('');

      // Reload state
      await loadData();
    } catch (err) {
      console.warn('Error registering serial in Supabase:', err);
      alert('Failed to register serial number.');
      setLoading(false);
    }
  };

  const handleTabPress = (tab: TabType, index: number) => {
    isProgrammaticScroll.current = true;
    setCurrentTab(tab);
    scrollViewRef.current?.scrollTo({ x: index * containerWidth, animated: true });
  };

  // Render active screen
  const renderScreen = (type: TabType) => {
    switch (type) {
      case 'home':
        return <HomeScreen />;
      case 'inventory':
        return (
          <InventoryScreen
            stockLevels={stockLevels}
            skuSearch={skuSearch}
            setSkuSearch={setSkuSearch}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            activeBatches={activeBatches}
            scannedUnitSerial={scannedUnitSerial}
            setScannedUnitSerial={setScannedUnitSerial}
            selectedBatchId={selectedBatchId}
            setSelectedBatchId={setSelectedBatchId}
            scannedHistory={scannedHistory}
            handleRegisterSerial={handleRegisterSerial}
          />
        );
      case 'orders':
        return <OrdersScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Define Nav Items
  const navItems: { type: TabType; label: string; icon: string }[] = [
    { type: 'home', label: 'Home', icon: '⎔' },
    { type: 'inventory', label: 'Inventory', icon: '▩' },
    { type: 'scan', label: 'Scan', icon: '⚡' },
    { type: 'orders', label: 'Orders', icon: '⧉' },
    { type: 'profile', label: 'Profile', icon: '⚙' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#09090b" />
      
      {/* Page-Dependent Clean Header */}
      <View style={styles.header}>
        {currentTab === 'home' ? (
          <>
            <View style={styles.brandRow}>
              <View style={styles.brandSquare}>
                <Text style={styles.brandLetter}>A</Text>
              </View>
              <Text style={styles.headerTitle}>AHV Mobile</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>WAREHOUSE HUB</Text>
              </View>
              <TouchableOpacity style={styles.menuButton}>
                <Text style={styles.menuButtonText}>⋮</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headerTitlePage}>
              {currentTab === 'inventory'
                ? 'Inventory'
                : currentTab === 'scan'
                ? 'Scan Serial'
                : currentTab === 'orders'
                ? 'Orders'
                : 'Profile'}
            </Text>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuButtonText}>⋮</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Main Screen Content */}
      <View style={styles.mainContent} onLayout={handleLayout}>
        {loading && stockLevels.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Synchronizing inventory...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            style={styles.pager}
            contentContainerStyle={styles.pagerContent}
          >
            {navItems.map((item) => (
              <View key={item.type} style={{ width: containerWidth, flex: 1 }}>
                {renderScreen(item.type)}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {navItems.map((item, index) => {
          const isActive = currentTab === item.type;
          return (
            <TouchableOpacity
              key={item.type}
              style={styles.tabButton}
              onPress={() => handleTabPress(item.type, index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // Zinc 955 Dark
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fafafa',
  },
  headerTitlePage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fafafa',
  },
  menuButton: {
    padding: 4,
    borderRadius: 6,
    width: 28,
    height: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  menuButtonText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '700',
    margin: -2,
  },
  activeTag: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  activeTagText: {
    fontSize: 9,
    color: '#a1a1aa',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexDirection: 'row',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10, // Account for iOS home indicator
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    color: '#71717a',
    marginBottom: 4,
  },
  tabIconActive: {
    color: '#6366f1',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  tabLabelActive: {
    color: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 12,
  },
});
