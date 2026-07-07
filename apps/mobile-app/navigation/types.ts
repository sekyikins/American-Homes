import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Activity: undefined;
  Customers: undefined;
  Wallet: undefined;
  Shipments: undefined;
  AllTransactions: undefined;
  AgentWallet: { agentId: string };
  CustomerDetail: { customerId: string };
  DiscrepancyReport: { productId?: string };
  InventoryCount: undefined;
  InventoryCountStep2: { category: string; location: string };
  OrderDetail: { orderId: string };
  ProductDetail: { productId: string };
  ReceiveStock: { shipmentId?: string };
  ReportDamage: { productId?: string };
  ReportShipment: { shipmentId?: string };
  Reports: undefined;
  ShipmentDetail: { shipmentId: string };
  StockAdjust: { productId?: string };
  TasksAndAlerts: { initialTab?: 'tasks' | 'alerts' } | undefined;
  TransactionDetail: {transactionId: string};
  ChangePassword: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  SyncCenter: undefined;
  LanguageSelection: undefined;
  OrderLookup: undefined;
  ProductSearch: undefined;
  ReportSuccess: { title?: string; message: string };
  Withdraw: undefined;
  Orders: { customerName?: string } | undefined;
  Scan: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  InventoryTab: undefined;
  ShipmentsTab: undefined;
  WalletTab: undefined;
  ProfileTab: undefined;
};
