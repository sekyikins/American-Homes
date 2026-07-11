import React, { useState, useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Home, Package, User, ChevronLeft, Truck, Bell, Sliders } from 'lucide-react-native';

// ── Theme ──────────────────────────────────────────────────────────────────────
import { ThemeProvider, useTheme } from './styles/theme';

// ── Mock Data ─────────────────────────────────────────────────────────────────
import { MockDataProvider, useMockData } from './context/MockDataContext';
import { supabase, withTimeout } from './lib/supabase';

// ── Auth Screens ──────────────────────────────────────────────────────────────
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';

// ── Main Tab Screens ──────────────────────────────────────────────────────────
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
import InventoryListScreen from './screens/InventoryListScreen';
import ScanScreen from './screens/ScanScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';
import OperationsScreen from './screens/OperationsScreen';

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
import CustomerDebtManagementScreen from './screens/CustomerDebtManagementScreen';
import ReportSuccessScreen from './screens/ReportSuccessScreen';
import WithdrawScreen from './screens/WithdrawScreen';
import AgentWalletScreen from './screens/AgentWalletScreen';

// ── Nav types ─────────────────────────────────────────────────────────────────
import { RootStackParamList, MainTabParamList } from './navigation/types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

// ─────────────────────────────────────────────────────────────────────────────
// Custom Header Component
// ─────────────────────────────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
};

function CustomHeader({ route, navigation, options }: any) {
  const { colors, typography, commonStyles } = useTheme();
  const pt = Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  const title = options.title || route.name;
  const canGoBack = navigation.canGoBack();
  const isTabScreen = ['HomeTab', 'InventoryTab', 'ShipmentsTab', 'OperationsTab', 'ProfileTab'].includes(route.name);
  const showBackButton = canGoBack && !isTabScreen;

  const isHome = route.name === 'HomeTab';
  const mockData = useMockData();
  const unreadCount = mockData ? mockData.notifications.filter(n => !n.read).length : 0;

  const [userName, setUserName] = useState(mockData?.currentUser?.name || 'Kwame Asante');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    if (mockData?.currentUser) {
      setUserName(mockData.currentUser.name);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await withTimeout(supabase.auth.getUser());
        if (!user || !active) return;
        const { data: profile } = await withTimeout(
          supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single()
        );
        if (profile?.name && active) {
          setUserName(profile.name);
        }
      } catch (e) {
        // silently ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, [isHome, mockData?.currentUser]);

  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      paddingTop: pt,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: isHome ? 8 : 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      minHeight: isHome ? 60 : 52,
      gap: 6,
    },
    backButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      marginLeft: -5,
    },
    headerTitle: { ...typography.headerTitle },
    homeHeaderContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    homeTextCol: {
      flexDirection: 'column',
    },
    greetingSub: { ...typography.greetingSub },
    greetingName: { ...typography.greetingName },
    bellBtn: { ...commonStyles.iconButton },
    bellBadge: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#fb2c36',
      borderWidth: 1,
      borderColor: colors.background,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft size={26} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {isHome ? (
          <View style={styles.homeHeaderContent}>
            <View style={styles.homeTextCol}>
              <Text style={styles.greetingSub}>{greeting()}</Text>
              <Text style={styles.greetingName}>{loading ? '...' : userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.75}
            >
              <Bell size={17} color={colors.text} />
              {unreadCount > 0 && <View style={styles.bellBadge} />}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
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
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 80 : 65,
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
            OperationsTab: Sliders,
            ProfileTab:   User,
          };
          const Icon = icons[route.name];
          return Icon ? <Icon size={size} color={color} /> : null;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="InventoryTab" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Tab.Screen name="ShipmentsTab" component={ShipmentsScreen} options={{ title: 'Shipments' }} />
      <Tab.Screen name="OperationsTab" component={OperationsScreen} options={{ title: 'Operations' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
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
  const { colors } = useTheme();
  const mockData = useMockData();
  const [checking, setChecking] = React.useState(true);
  const [hasUser, setHasUser] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      if (mockData?.currentUser) {
        setHasUser(true);
        setChecking(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setHasUser(true);
        }
      } catch (e) {
        // ignore
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, [mockData?.currentUser]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      id="root-navigator"
      initialRouteName={hasUser ? "Main" : "Welcome"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        cardStyle: { backgroundColor: colors.background },
      }}
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
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Transactions History' }}
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
        name="InventoryList"
        component={InventoryListScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Inventory' }}
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
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Notifications' }}
      />
      <Stack.Screen
        name="SyncCenter"
        component={SyncCenterScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Sync Center' }}
      />
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Language' }}
      />
      <Stack.Screen
        name="CustomerDebtManagement"
        component={CustomerDebtManagementScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Manage Balances' }}
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
      <Stack.Screen
        name="AgentWallet"
        component={AgentWalletScreen}
        options={{ headerShown: true, header: (props) => <CustomHeader {...props} />, title: 'Agent Wallet' }}
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
  const { isDark, colors } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
