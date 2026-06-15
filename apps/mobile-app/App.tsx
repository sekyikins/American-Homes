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
  BackHandler,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ── Primary Screens ────────────────────────────────────────────────────────────
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
import ScanScreen from './screens/ScanScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';

// ── Secondary Screens ──────────────────────────────────────────────────────────
import CustomersScreen from './screens/CustomersScreen';
import WalletScreen from './screens/WalletScreen';
import ShipmentsScreen from './screens/ShipmentsScreen';
import ActivityScreen from './screens/ActivityScreen';

// ── Supabase ───────────────────────────────────────────────────────────────────
import { supabase } from './lib/supabase';

// ── Theme ──────────────────────────────────────────────────────────────────────
import { ThemeProvider, useTheme } from './styles/theme';

// ── Types ──────────────────────────────────────────────────────────────────────
type TabType = 'home' | 'inventory' | 'scan' | 'orders' | 'profile';
type SecondaryScreenType = 'customers' | 'wallet' | 'shipments' | 'activity';
// No icon field — menu items are text-only for a clean look
type DropdownItem = { label: string; onPress: () => void };

const { width: screenWidth } = Dimensions.get('window');

const SECONDARY_TITLES: Record<SecondaryScreenType, string> = {
  customers: 'Customers',
  wallet:    'Wallet & Earnings',
  shipments: 'Shipments',
  activity:  'Activity Log',
};

const PAGE_TITLES: Record<TabType, string> = {
  home:      'AHV Mobile',
  inventory: 'Inventory',
  scan:      'Scan Serial',
  orders:    'Orders',
  profile:   'Profile',
};

import { Home, Package, ScanLine, FileText, User, ChevronLeft, MoreVertical } from 'lucide-react-native';

// ── Nav items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: { type: TabType; label: string; Icon: React.ComponentType<any> }[] = [
  { type: 'home',      label: 'Home',      Icon: Home },
  { type: 'inventory', label: 'Inventory', Icon: Package },
  { type: 'scan',      label: 'Scan',      Icon: ScanLine },
  { type: 'orders',    label: 'Orders',    Icon: FileText },
  { type: 'profile',   label: 'Profile',   Icon: User },
];

// ─────────────────────────────────────────────────────────────────────────────
function AppInner() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // ── Keyboard visibility ────────────────────────────────────────────────────
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Primary navigation ─────────────────────────────────────────────────────
  const [currentTab, setCurrentTab]           = useState<TabType>('home');
  const [secondaryScreen, setSecondaryScreen] = useState<SecondaryScreenType | null>(null);
  const scrollViewRef                         = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth]   = useState(screenWidth);
  const isProgrammaticScroll                  = useRef(false);

  // ── Dropdown ───────────────────────────────────────────────────────────────
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // ── Shared inventory data ──────────────────────────────────────────────────
  const [stockLevels, setStockLevels]         = useState<any[]>([]);
  const [activeBatches, setActiveBatches]     = useState<any[]>([]);
  const [scannedHistory, setScannedHistory]   = useState<string[]>([]);
  const [skuSearch, setSkuSearch]             = useState('');
  const [scannedUnitSerial, setScannedUnitSerial] = useState('');
  const [selectedBatchId, setSelectedBatchId]   = useState('');
  const [loading, setLoading]                   = useState(true);
  const [isRefreshing, setIsRefreshing]         = useState(false);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const openDropdown = () => {
    setDropdownVisible(true);
    dropdownAnim.setValue(0);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setDropdownVisible(false));
  };

  const toggleDropdown = () => {
    if (dropdownVisible) closeDropdown(); else openDropdown();
  };

  const navigateTo = (screen: SecondaryScreenType) => {
    closeDropdown();
    // Small delay so close animation plays before unmounting
    setTimeout(() => setSecondaryScreen(screen), 120);
  };

  const goBack = () => setSecondaryScreen(null);

  // ── Pull-to-refresh handler (passed to prop-driven screens) ────────────────
  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // ── Dropdown items (navigation only — no refresh items) ────────────────────
  const tabDropdownItems: Record<TabType, DropdownItem[]> = {
    home: [
      { label: 'All Activity',      onPress: () => navigateTo('activity') },
    ],
    inventory: [
      { label: 'Customers',         onPress: () => navigateTo('customers') },
      { label: 'Shipments',         onPress: () => navigateTo('shipments') },
    ],
    scan: [
      { label: 'Activity Log',      onPress: () => navigateTo('activity') },
    ],
    orders: [
      { label: 'Activity Log',      onPress: () => navigateTo('activity') },
    ],
    profile: [
      { label: 'Wallet & Earnings', onPress: () => navigateTo('wallet') },
      { label: 'Shipments',         onPress: () => navigateTo('shipments') },
    ],
  };

  // Secondary screens have no dropdown — ⋮ button is hidden on those pages
  const currentDropdownItems: DropdownItem[] = secondaryScreen
    ? []
    : tabDropdownItems[currentTab];

  // ── Pager scroll helpers ───────────────────────────────────────────────────
  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) setContainerWidth(width);
  };

  const handleScroll = (event: any) => {
    if (isProgrammaticScroll.current) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / containerWidth);
    if (NAV_ITEMS[index] && currentTab !== NAV_ITEMS[index].type) {
      setCurrentTab(NAV_ITEMS[index].type);
    }
  };

  const handleMomentumScrollEnd = () => {
    isProgrammaticScroll.current = false;
  };

  const handleTabPress = (tab: TabType, index: number) => {
    isProgrammaticScroll.current = true;
    setCurrentTab(tab);
    setSecondaryScreen(null);
    scrollViewRef.current?.scrollTo({ x: index * containerWidth, animated: true });
  };

  // ── Android hardware back button ───────────────────────────────────────────
  useEffect(() => {
    const onBack = () => {
      // 1. Secondary screen open → close it and stay on current tab
      if (secondaryScreen) {
        goBack();
        return true;
      }
      // 2. Non-home tab → navigate to Home
      if (currentTab !== 'home') {
        handleTabPress('home', 0);
        return true;
      }
      // 3. Home → let the OS handle it (exit / minimise)
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [secondaryScreen, currentTab]);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [variantsResult, batchesResult, unitsResult] = await Promise.all([
        supabase
          .from('product_variants')
          .select('id, variant_name, sku, products ( id, name, has_serial )'),
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
          .limit(10),
      ]);

      if (variantsResult.error)
        console.warn('Supabase error (product_variants):', variantsResult.error.message);
      if (batchesResult.error)
        console.warn('Supabase error (inventory_batches):', batchesResult.error.message);
      if (unitsResult.error)
        console.warn('Supabase error (inventory_units):', unitsResult.error.message);

      const variantsData = variantsResult.data;
      const batchesData  = batchesResult.data;
      const unitsData    = unitsResult.data;

      // Aggregate stock by product_id
      const stockMap: Record<string, number> = {};
      if (batchesData) {
        batchesData.forEach(b => {
          if (b.product_id)
            stockMap[b.product_id] = (stockMap[b.product_id] || 0) + (b.remaining_quantity || 0);
        });
      }

      if (variantsData) {
        setStockLevels(
          variantsData.map(v => {
            const prod  = v.products as any;
            const prodId = prod?.id || '';
            return {
              id: v.id,
              product_id: prodId,
              name: prod ? `${prod.name} (${v.variant_name})` : v.variant_name,
              sku: v.sku || '',
              stock: stockMap[prodId] || 0,
              serialized: prod?.has_serial || false,
            };
          })
        );
      }

      if (batchesData) {
        const filtered = batchesData
          .filter(b => (b.products as any)?.has_serial)
          .map(b => ({
            id: b.id,
            product_id: b.product_id,
            product_name: (b.products as any)?.name || 'Unknown',
            remaining_quantity: b.remaining_quantity,
            shipment_code: (b.shipments as any)?.shipment_code || 'Direct Load',
          }));
        setActiveBatches(filtered);
        if (filtered.length > 0 && !selectedBatchId) setSelectedBatchId(filtered[0].id);
      }

      if (unitsData) setScannedHistory(unitsData.map(u => u.serial_number));
    } catch (e) {
      console.warn('Error fetching Supabase data in App:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Serial registration ────────────────────────────────────────────────────
  const handleRegisterSerial = async () => {
    if (!scannedUnitSerial.trim() || !selectedBatchId) return;
    const trimmedSerial = scannedUnitSerial.trim();
    setLoading(true);

    try {
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

      const targetBatch = activeBatches.find(b => b.id === selectedBatchId);
      if (!targetBatch) { setLoading(false); return; }

      const { error: insertErr } = await supabase
        .from('inventory_units')
        .insert({ batch_id: selectedBatchId, serial_number: trimmedSerial, status: 'available' });
      if (insertErr) throw insertErr;

      const newQty = (targetBatch.remaining_quantity || 0) + 1;
      const { error: batchErr } = await supabase
        .from('inventory_batches')
        .update({ remaining_quantity: newQty })
        .eq('id', selectedBatchId);
      if (batchErr) throw batchErr;

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

      await supabase.from('audit_logs').insert({
        action: 'SERIAL_SCANNED',
        details: {
          serial_number: trimmedSerial,
          batch_id: selectedBatchId,
          product_name: targetBatch.product_name,
        },
      });

      setScannedUnitSerial('');
      await loadData();
    } catch (err) {
      console.warn('Error registering serial in Supabase:', err);
      alert('Failed to register serial number.');
      setLoading(false);
    }
  };

  // ── Screen rendering ───────────────────────────────────────────────────────
  const renderSecondaryScreen = () => {
    switch (secondaryScreen) {
      case 'customers': return <CustomersScreen />;
      case 'wallet':    return <WalletScreen />;
      case 'shipments': return <ShipmentsScreen />;
      case 'activity':  return <ActivityScreen />;
      default:          return null;
    }
  };

  const renderTabScreen = (type: TabType) => {
    switch (type) {
      case 'home':
        return <HomeScreen />;
      case 'inventory':
        return (
          <InventoryScreen
            stockLevels={stockLevels}
            skuSearch={skuSearch}
            setSkuSearch={setSkuSearch}
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
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
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
          />
        );
      case 'orders':
        return <OrdersScreen />;
      case 'profile':
        return (
          <ProfileScreen
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {secondaryScreen ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
              <ChevronLeft size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{SECONDARY_TITLES[secondaryScreen]}</Text>
            <View style={styles.menuButtonPlaceholder} />
          </>
        ) : currentTab === 'home' ? (
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
              <TouchableOpacity style={styles.menuButton} onPress={toggleDropdown}>
                <MoreVertical size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>{PAGE_TITLES[currentTab]}</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleDropdown}
            >
              <MoreVertical size={20} color={colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Dropdown anchor ─────────────────────────────────────────────────────
          Zero-height view placed right after the header in the normal flow.
          Its top edge aligns with the header's bottom — no measurement needed.
          Children use position:absolute and overflow naturally below the anchor. */}
      {dropdownVisible && (
        <View style={styles.dropdownAnchor}>
          {/* Full-screen dismiss overlay */}
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={closeDropdown}
          />
          {/* Animated panel emerges from the header's bottom edge */}
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                opacity: dropdownAnim,
                transform: [{
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                }],
              },
            ]}
          >
            {currentDropdownItems.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.dropdownItem,
                  idx < currentDropdownItems.length - 1 && styles.dropdownItemBorder,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      )}


      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <View style={styles.mainContent} onLayout={handleLayout}>

        {/* Pager — always mounted so scroll position survives secondary navigation.
            Hidden (but not unmounted) when a secondary screen is active. */}
        <View style={[styles.pagerLayer, secondaryScreen ? styles.hidden : styles.visible]}>
          {loading && stockLevels.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
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
              {NAV_ITEMS.map(item => (
                <View key={item.type} style={{ width: containerWidth, flex: 1 }}>
                  {renderTabScreen(item.type)}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Secondary screen — rendered on top when active */}
        {secondaryScreen && (
          <View style={styles.secondaryLayer}>
            {renderSecondaryScreen()}
          </View>
        )}

      </View>

      {/* ── Bottom Tab Bar (hidden on secondary screens and keyboard) ──────── */}
      {!secondaryScreen && !keyboardVisible && (
        <View style={styles.tabBar}>
          {NAV_ITEMS.map((item, index) => {
            const isActive = currentTab === item.type;
            const IconComponent = item.Icon;
            return (
              <TouchableOpacity
                key={item.type}
                style={styles.tabButton}
                onPress={() => handleTabPress(item.type, index)}
                activeOpacity={0.7}
              >
                <IconComponent
                  size={20}
                  color={isActive ? colors.primary : colors.textDim}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Root wrapper with ThemeProvider ────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      minHeight: 52,
    },
    backButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
    },
    backIcon: {
      color: colors.primary,
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 28,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandSquare: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandLetter: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    menuButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: colors.card,
    },
    menuButtonText: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
      marginTop: -2,
    },
    // Keeps header layout balanced when ⋮ is hidden on secondary screens
    menuButtonPlaceholder: { width: 36, height: 36 },
    activeTag: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    activeTagText: {
      fontSize: 9,
      color: colors.text,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    // ── Dropdown ──────────────────────────────────────────────────────────────
    // Zero-height anchor in normal flow — sits right below the header
    dropdownAnchor: {
      height: 0,
      zIndex: 200,
      elevation: 20,
      overflow: 'visible',
    },
    // Overlay: stretches to fill everything above (into safe area) and below
    dropdownOverlay: {
      position: 'absolute',
      top: -200,      // reach far up (covers header area for taps outside panel)
      left: -500,
      right: -500,
      bottom: -2000,  // reach far down
      zIndex: 100,
    },
    // Panel: positioned at the anchor's origin (= header bottom edge)
    dropdownMenu: {
      position: 'absolute',
      top: 4,         // small gap below header bottom edge
      right: 10,
      zIndex: 200,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 20,
      minWidth: 190,
      overflow: 'hidden',
    },
    dropdownItem: {
      paddingVertical: 15,
      paddingHorizontal: 18,
    },
    dropdownItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },

    // ── Main content ──────────────────────────────────────────────────────────
    mainContent: { flex: 1 },
    // Pager layer: always mounted, toggled visible/hidden so scroll position persists
    pagerLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    visible: { display: 'flex' },
    hidden:  { display: 'none' },
    // Secondary screen sits on top of the (hidden) pager
    secondaryLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    pager: { flex: 1 },
    pagerContent: { flexDirection: 'row' },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: { color: colors.textMuted, fontSize: 14, marginTop: 12 },

    // ── Tab bar ───────────────────────────────────────────────────────────────
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 10,
      paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    },
    tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabIcon: { fontSize: 18, color: colors.textDim, marginBottom: 4 },
    tabIconActive: { color: colors.primary },
    tabLabel: { fontSize: 11, fontWeight: '600', color: colors.textDim },
    tabLabelActive: { color: colors.primary },
  });
