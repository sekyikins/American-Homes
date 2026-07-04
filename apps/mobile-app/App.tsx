import React, { useState, useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Home, Package, ScanLine, FileText, User, ChevronLeft, Truck, Wallet } from 'lucide-react-native';

// ── Theme ──────────────────────────────────────────────────────────────────────
import { ThemeProvider, useTheme } from './styles/theme';

// ── Mock Data ─────────────────────────────────────────────────────────────────
import { MockDataProvider } from './context/MockDataContext';

// ── Auth Screens ──────────────────────────────────────────────────────────────
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';

// ── Main Tab Screens ──────────────────────────────────────────────────────────
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
import ScanScreen from './screens/ScanScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';

// ── Stack Screens ─────────────────────────────────────────────────────────────
import ActivityScreen from './screens/ActivityScreen';
import CustomersScreen from './screens/CustomersScreen';
import WalletScreen from './screens/WalletScreen';
import ShipmentsScreen from './screens/ShipmentsScreen';
import AllTransactionsScreen from './screens/AllTransactionsScreen';
import CustomerDetailScreen from './screens/CustomerDetailScreen';
import DiscrepancyReportScreen from './screens/DiscrepancyReportScreen';
import InventoryCountScreen from './screens/InventoryCountScreen';
import InventoryCountStep2Screen from './screens/InventoryCountStep2Screen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ReceiveStockScreen from './screens/ReceiveStockScreen';
import ReportDamageScreen from './screens/ReportDamageScreen';
import ReportShipmentScreen from './screens/ReportShipmentScreen';
import ReportsScreen from './screens/ReportsScreen';
import ShipmentDetailScreen from './screens/ShipmentDetailScreen';
import StockAdjustScreen from './screens/StockAdjustScreen';
import TasksAndAlertsScreen from './screens/TasksAndAlertsScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import SyncCenterScreen from './screens/SyncCenterScreen';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import OrderLookupScreen from './screens/OrderLookupScreen';
import ProductSearchScreen from './screens/ProductSearchScreen';
import ReportSuccessScreen from './screens/ReportSuccessScreen';
import WithdrawScreen from './screens/WithdrawScreen';

// ── Nav types ─────────────────────────────────────────────────────────────────
import { RootStackParamList, MainTabParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

// ─────────────────────────────────────────────────────────────────────────────
// Custom Header Component
// ─────────────────────────────────────────────────────────────────────────────
function CustomHeader({ route, navigation, options }: any) {
  const { colors } = useTheme();
  const pt = Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  const title = options.title || route.name;
  const canGoBack = navigation.canGoBack();

  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      paddingTop: pt,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 6,
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
      marginLeft: 10,
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
    activeTag: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      justifyContent: 'center',
    },
    activeTagText: {
      fontSize: 9,
      color: colors.text,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    rightPlaceholder: { width: 36 },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {canGoBack ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <ChevronLeft size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.rightPlaceholder} />
          </>
        ) : route.name === 'HomeTab' ? (
          <>
            <View style={styles.brandRow}>
              <View style={styles.brandSquare}>
                <Text style={styles.brandLetter}>A</Text>
              </View>
              <Text style={styles.headerTitle}>AHV Mobile</Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>WAREHOUSE HUB</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.rightPlaceholder} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom tab navigator (5 tabs)
// ─────────────────────────────────────────────────────────────────────────────
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={({ route }) => ({
        headerShown: true,
        header: (props) => <CustomHeader {...props} />,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 70,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, React.ComponentType<any>> = {
            HomeTab:      Home,
            InventoryTab: Package,
            ShipmentsTab: Truck,
            WalletTab:    Wallet,
            ProfileTab:   User,
          };
          const Icon = icons[route.name];
          return Icon ? <Icon size={size} color={color} /> : null;
        },
      })}
    >
      <Tab.Screen name="HomeTab"      component={HomeScreen}      options={{ title: 'Home', headerShown: false }} />
      <Tab.Screen name="InventoryTab" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Tab.Screen name="ShipmentsTab" component={ShipmentsScreen} options={{ title: 'Shipments' }} />
      <Tab.Screen name="WalletTab"    component={WalletScreen}    options={{ title: 'Wallet' }} />
      <Tab.Screen name="ProfileTab"   component={ProfileScreen}   options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth flow screens (wrapped to inject navigation-based callbacks)
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeWrapper({ navigation }: any) {
  return <WelcomeScreen onGetStarted={() => navigation.navigate('SignIn')} />;
}

function SignInWrapper({ navigation }: any) {
  return (
    <SignInScreen
      onSignInSuccess={() =>
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root navigator
// ─────────────────────────────────────────────────────────────────────────────
function RootNavigator() {
  return (
    <Stack.Navigator
      id="root-navigator"
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      {/* ── Auth ─────────────────────────────────────────── */}
      <Stack.Screen name="Welcome" component={WelcomeWrapper} />
      <Stack.Screen name="SignIn"  component={SignInWrapper} />

      {/* ── Main App ─────────────────────────────────────── */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* ── Secondary full-screen stacks ─────────────────── */}
      <Stack.Screen
        name="Activity"
        component={ActivityScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Activity Log' }}
      />
      <Stack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Customers' }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Wallet & Earnings' }}
      />
      <Stack.Screen
        name="Shipments"
        component={ShipmentsScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Shipments' }}
      />
      <Stack.Screen
        name="AllTransactions"
        component={AllTransactionsScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'All Transactions' }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Customer Detail' }}
      />
      <Stack.Screen
        name="DiscrepancyReport"
        component={DiscrepancyReportScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Discrepancy Report' }}
      />
      <Stack.Screen
        name="InventoryCount"
        component={InventoryCountScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Audit Cycle Count' }}
      />
      <Stack.Screen
        name="InventoryCountStep2"
        component={InventoryCountStep2Screen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Cycle Count' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Order Detail' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Product Detail' }}
      />
      <Stack.Screen
        name="ReceiveStock"
        component={ReceiveStockScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Receive Stock' }}
      />
      <Stack.Screen
        name="ReportDamage"
        component={ReportDamageScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Report Damage' }}
      />
      <Stack.Screen
        name="ReportShipment"
        component={ReportShipmentScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Report Shipment' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Operations Reports' }}
      />
      <Stack.Screen
        name="ShipmentDetail"
        component={ShipmentDetailScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Shipment Detail' }}
      />
      <Stack.Screen
        name="StockAdjust"
        component={StockAdjustScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Stock Adjustment' }}
      />
      <Stack.Screen
        name="TasksAndAlerts"
        component={TasksAndAlertsScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Tasks & Alerts' }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Transaction Detail' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Change Password' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Notifications' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Notification Settings' }}
      />
      <Stack.Screen
        name="SyncCenter"
        component={SyncCenterScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Sync Center' }}
      />
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Select Language' }}
      />
      <Stack.Screen
        name="OrderLookup"
        component={OrderLookupScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Order Lookup' }}
      />
      <Stack.Screen
        name="ProductSearch"
        component={ProductSearchScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Product Search' }}
      />
      <Stack.Screen
        name="ReportSuccess"
        component={ReportSuccessScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Report Submitted' }}
      />
      <Stack.Screen
        name="Withdraw"
        component={WithdrawScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Withdraw' }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Orders' }}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Scan' }}
      />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <MockDataProvider>
        <AppShell />
      </MockDataProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { isDark } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}
