import React, { createContext, useContext, useState } from 'react';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_debt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  has_serial: boolean;
  description: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  barcode: string;
  retail_price: number;
  wholesale_price: number;
  commission_amount: number;
}

export interface Shipment {
  id: string;
  shipment_code: string;
  supplier_name?: string;
  supplier_location?: string;
  units_count?: number;
  skus_count?: number;
  supplier_country: string;
  status: 'pending' | 'in_transit' | 'received';
  arrival_date: string | null;
  total_cost: number;
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  product_id: string;
  quantity: number;
  cost_price: number;
}

export interface InventoryBatch {
  id: string;
  product_id: string;
  shipment_id: string | null;
  quantity_received: number;
  remaining_quantity: number;
  cost_price: number;
  created_at: string;
}

export interface InventoryUnit {
  id: string;
  batch_id: string;
  serial_number: string;
  status: 'available' | 'sold' | 'damaged';
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  total_amount: number;
  payment_status: 'paid' | 'partial' | 'credit' | 'pending_resolution';
  created_by: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  batch_id: string | null;
  unit_id: string | null;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  method: string;
  reference_id: string | null;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  network: string;
  phone: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  due_date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'inventory' | 'orders' | 'shipments' | 'general';
  read: boolean;
  time: string;
}

export interface AlertItem {
  id: string;
  title: string;
  body: string;
  category: 'inventory_low' | 'inventory_out' | 'credit' | 'shipment';
  time: string;
  read: boolean;
}

export interface DiscrepancyReport {
  id: string;
  product_id: string;
  expected_qty: number;
  actual_qty: number;
  notes: string;
  created_at: string;
}

export interface DamageReport {
  id: string;
  product_id: string;
  serial_number: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  created_at: string;
}

export interface ShipmentReport {
  id: string;
  shipment_id: string;
  issue_type: string;
  description: string;
  created_at: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent' | 'warehouse_operator';
  commission_type?: string;
  commission_rate?: number;
  balance: number;
}

export interface OfflineActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'stock' | 'order' | 'scan';
}

// ─── Context Type ────────────────────────────────────────────────────────────

interface MockDataContextType {
  customers: Customer[];
  products: Product[];
  variants: ProductVariant[];
  shipments: Shipment[];
  batches: InventoryBatch[];
  units: InventoryUnit[];
  orders: Order[];
  orderItems: OrderItem[];
  walletTransactions: WalletTransaction[];
  withdrawals: Withdrawal[];
  tasks: Task[];
  notifications: NotificationItem[];
  alerts: AlertItem[];
  discrepancyReports: DiscrepancyReport[];
  damageReports: DamageReport[];
  shipmentReports: ShipmentReport[];
  walletBalance: number;
  users: MockUser[];
  currentUser: MockUser | null;
  offlineActivities: OfflineActivity[];

  // Actions
  addOrder: (customerId: string | null, total: number, paymentStatus: Order['payment_status'], items: Omit<OrderItem, 'id' | 'order_id'>[]) => void;
  addWithdrawal: (amount: number, network: string, phone: string) => boolean;
  registerSerial: (batchId: string, serialNumber: string) => boolean;
  adjustStock: (productId: string, quantityChange: number, reason: string) => void;
  addDiscrepancyReport: (productId: string, expected: number, actual: number, notes: string) => void;
  addDamageReport: (productId: string, serialNumber: string, severity: DamageReport['severity'], description: string) => void;
  addShipmentReport: (shipmentId: string, issueType: string, description: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  toggleAlertReadStatus: (alertId: string) => void;
  markNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  receiveShipmentStock: (shipmentId: string, productId: string, qty: number, cost: number) => void;
  signInMockUser: (email: string, password: string) => boolean;
  signOutMockUser: () => void;
  syncActivities: (ids: string[]) => void;
  resetActivities: () => void;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

// ─── Provider Component ──────────────────────────────────────────────────────

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  // Pre-populate with seed data matching 20260608000001_seed_data.sql
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '11111111-0000-0000-0000-000000000001', name: 'Marcus Reynolds', phone: '+1-512-555-0101', address: '402 Lavaca St, Austin, TX 78701', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000002', name: 'Sandra Okafor', phone: '+1-512-555-0102', address: '815 Congress Ave, Austin, TX 78701', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000003', name: 'Derek Nguyen', phone: '+1-512-555-0103', address: '1200 Barton Springs Rd, Austin, TX 78704', total_debt: 799.99 },
    { id: '11111111-0000-0000-0000-000000000004', name: 'Priya Mehta', phone: '+1-512-555-0104', address: '300 W 6th St, Austin, TX 78701', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000005', name: 'Luis Castellano', phone: '+1-512-555-0105', address: '950 E 11th St, Austin, TX 78702', total_debt: 1099.99 },
    { id: '11111111-0000-0000-0000-000000000006', name: 'Claire Bouchard', phone: '+1-512-555-0106', address: '2301 S Lamar Blvd, Austin, TX 78704', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000007', name: 'Anthony Osei', phone: '+1-512-555-0107', address: '6000 Middle Fiskville Rd, Austin, TX 78752', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000008', name: 'Fatima Al-Rashid', phone: '+1-512-555-0108', address: '5501 Airport Blvd, Austin, TX 78751', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000009', name: 'James Whitfield', phone: '+1-512-555-0109', address: '7901 Cameron Rd, Austin, TX 78754', total_debt: 0 },
    { id: '11111111-0000-0000-0000-000000000010', name: 'Yuki Tanaka', phone: '+1-512-555-0110', address: '11501 Domain Dr, Austin, TX 78758', total_debt: 0 },
  ]);

  const [products] = useState<Product[]>([
    { id: '22222222-0000-0000-0000-000000000001', name: 'Samsung 65" 4K QLED TV', category: 'Electronics', has_serial: true, description: 'Samsung QN65QN90B Neo QLED 4K Smart TV with Quantum Matrix Technology' },
    { id: '22222222-0000-0000-0000-000000000002', name: 'LG Refrigerator 28 cu ft', category: 'Appliances', has_serial: true, description: 'LG LRMVS3006S French Door Refrigerator with InstaView Door-in-Door' },
    { id: '22222222-0000-0000-0000-000000000003', name: 'Whirlpool Washer/Dryer Set', category: 'Appliances', has_serial: true, description: 'Whirlpool WFW5000HW 4.5 Cu Ft front load washer and dryer combo' },
    { id: '22222222-0000-0000-0000-000000000004', name: 'Dyson V15 Detect Vacuum', category: 'Electronics', has_serial: true, description: 'Dyson V15 Detect Absolute cordless vacuum with laser dust detection' },
    { id: '22222222-0000-0000-0000-000000000005', name: 'Apple MacBook Air M3 13"', category: 'Computers', has_serial: true, description: 'Apple MacBook Air with M3 chip, 8GB unified memory, 256GB SSD' },
    { id: '22222222-0000-0000-0000-000000000006', name: 'Bamboo Cutting Board Set', category: 'Kitchen', has_serial: false, description: 'Premium 3-piece bamboo cutting board set with juice grooves' },
    { id: '22222222-0000-0000-0000-000000000007', name: 'Memory Foam Pillow', category: 'Bedding', has_serial: false, description: 'Queen size cooling gel memory foam pillow, 2-pack' },
    { id: '22222222-0000-0000-0000-000000000008', name: 'Cast Iron Skillet 12"', category: 'Kitchen', has_serial: false, description: 'Pre-seasoned Lodge cast iron skillet, 12 inch with assist handle' },
    { id: '22222222-0000-0000-0000-000000000009', name: 'LED Smart Bulb 4-Pack', category: 'Lighting', has_serial: false, description: 'Govee RGBIC Smart Bulbs, 60W equivalent, works with Alexa & Google' },
    { id: '22222222-0000-0000-0000-000000000010', name: 'Weighted Blanket 15lb', category: 'Bedding', has_serial: false, description: 'YnM 15lb weighted blanket for adults, 60x80 inches, cotton outer shell' }
  ]);

  const [variants] = useState<ProductVariant[]>([
    { id: '33333333-0000-0000-0000-000000000001', product_id: '22222222-0000-0000-0000-000000000001', variant_name: '65" QLED - Black', sku: 'SAMS-TV-65-BLK', barcode: '0887276766669', retail_price: 1299.99, wholesale_price: 890.00, commission_amount: 45.00 },
    { id: '33333333-0000-0000-0000-000000000002', product_id: '22222222-0000-0000-0000-000000000002', variant_name: '28 cu ft - Steel', sku: 'LG-FRG-28-STL', barcode: '0048231781234', retail_price: 1899.99, wholesale_price: 1350.00, commission_amount: 60.00 },
    { id: '33333333-0000-0000-0000-000000000003', product_id: '22222222-0000-0000-0000-000000000003', variant_name: 'Washer+Dryer Set', sku: 'WHP-WD-SET-WHT', barcode: '0883049486312', retail_price: 1599.99, wholesale_price: 1100.00, commission_amount: 55.00 },
    { id: '33333333-0000-0000-0000-000000000004', product_id: '22222222-0000-0000-0000-000000000004', variant_name: 'V15 Detect - Gold', sku: 'DYS-V15-GOLD', barcode: '0885609024783', retail_price: 749.99, wholesale_price: 520.00, commission_amount: 25.00 },
    { id: '33333333-0000-0000-0000-000000000005', product_id: '22222222-0000-0000-0000-000000000005', variant_name: 'M3 8GB / 256GB SSD - Midnight', sku: 'APL-MBA-M3-256-MN', barcode: '0194253767572', retail_price: 1099.99, wholesale_price: 850.00, commission_amount: 35.00 },
    { id: '33333333-0000-0000-0000-000000000006', product_id: '22222222-0000-0000-0000-000000000005', variant_name: 'M3 16GB / 512GB SSD - Silver', sku: 'APL-MBA-M3-512-SL', barcode: '0194253767589', retail_price: 1499.99, wholesale_price: 1180.00, commission_amount: 50.00 },
    { id: '33333333-0000-0000-0000-000000000007', product_id: '22222222-0000-0000-0000-000000000006', variant_name: '3-Piece Set - Natural', sku: 'KIT-CB-3PC-NAT', barcode: '0763720249841', retail_price: 34.99, wholesale_price: 18.00, commission_amount: 0.00 },
    { id: '33333333-0000-0000-0000-000000000008', product_id: '22222222-0000-0000-0000-000000000007', variant_name: 'Queen - White 2-Pack', sku: 'BED-MFP-QN-WHT', barcode: '0840018400012', retail_price: 59.99, wholesale_price: 32.00, commission_amount: 0.00 },
    { id: '33333333-0000-0000-0000-000000000009', product_id: '22222222-0000-0000-0000-000000000008', variant_name: '12" - Black Seasoned', sku: 'KIT-CI-12-BLK', barcode: '0078742064482', retail_price: 44.99, wholesale_price: 24.00, commission_amount: 0.00 },
    { id: '33333333-0000-0000-0000-000000000010', product_id: '22222222-0000-0000-0000-000000000009', variant_name: 'A19 RGBIC 4-Pack', sku: 'LIT-LED-4PK-RGB', barcode: '0840095800142', retail_price: 39.99, wholesale_price: 20.00, commission_amount: 0.00 },
    { id: '33333333-0000-0000-0000-000000000011', product_id: '22222222-0000-0000-0000-000000000010', variant_name: '15lb 60x80 - Dark Grey', sku: 'BED-WB-15-GRY', barcode: '0760158400012', retail_price: 69.99, wholesale_price: 38.00, commission_amount: 0.00 }
  ]);

  const [shipments, setShipments] = useState<Shipment[]>([
    { id: '44444444-0000-0000-0000-000000000001', shipment_code: 'SHP-2024-018', supplier_name: 'Shanghai Electronics Co.', supplier_location: 'Shanghai, CN', units_count: 180, skus_count: 6, supplier_country: 'China', status: 'in_transit', arrival_date: '2024-06-25', total_cost: 28500.00 },
    { id: '44444444-0000-0000-0000-000000000002', shipment_code: 'SHP-2024-017', supplier_name: 'HK Tech Imports', supplier_location: 'Hong Kong, HK', units_count: 90, skus_count: 3, supplier_country: 'Hong Kong', status: 'in_transit', arrival_date: '2024-06-18', total_cost: 15200.00 },
    { id: '44444444-0000-0000-0000-000000000003', shipment_code: 'SHP-2024-016', supplier_name: 'Euro Home Direct', supplier_location: 'Amsterdam, NL', units_count: 60, skus_count: 4, supplier_country: 'Netherlands', status: 'received', arrival_date: '2024-06-10', total_cost: 34800.00 },
    { id: '44444444-0000-0000-0000-000000000004', shipment_code: 'SHP-2024-015', supplier_name: 'Euro Distributors', supplier_location: 'Munich, DE', units_count: 120, skus_count: 5, supplier_country: 'Germany', status: 'received', arrival_date: '2024-05-20', total_cost: 18000.00 }
  ]);

  const [batches, setBatches] = useState<InventoryBatch[]>([
    { id: '55555555-0000-0000-0000-000000000001', product_id: '22222222-0000-0000-0000-000000000001', shipment_id: '44444444-0000-0000-0000-000000000001', quantity_received: 8, remaining_quantity: 6, cost_price: 890.00, created_at: '2025-11-12T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000002', product_id: '22222222-0000-0000-0000-000000000002', shipment_id: '44444444-0000-0000-0000-000000000001', quantity_received: 5, remaining_quantity: 4, cost_price: 1350.00, created_at: '2025-11-12T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000003', product_id: '22222222-0000-0000-0000-000000000003', shipment_id: '44444444-0000-0000-0000-000000000002', quantity_received: 6, remaining_quantity: 5, cost_price: 1100.00, created_at: '2025-12-03T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000004', product_id: '22222222-0000-0000-0000-000000000004', shipment_id: '44444444-0000-0000-0000-000000000002', quantity_received: 10, remaining_quantity: 8, cost_price: 520.00, created_at: '2025-12-03T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000005', product_id: '22222222-0000-0000-0000-000000000005', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received: 12, remaining_quantity: 10, cost_price: 850.00, created_at: '2026-01-15T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000006', product_id: '22222222-0000-0000-0000-000000000006', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received: 80, remaining_quantity: 72, cost_price: 18.00, created_at: '2026-01-15T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000007', product_id: '22222222-0000-0000-0000-000000000007', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received: 60, remaining_quantity: 55, cost_price: 32.00, created_at: '2026-01-15T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000008', product_id: '22222222-0000-0000-0000-000000000008', shipment_id: '44444444-0000-0000-0000-000000000001', quantity_received: 40, remaining_quantity: 33, cost_price: 24.00, created_at: '2025-11-12T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000009', product_id: '22222222-0000-0000-0000-000000000009', shipment_id: '44444444-0000-0000-0000-000000000002', quantity_received: 100, remaining_quantity: 88, cost_price: 20.00, created_at: '2025-12-03T10:00:00Z' },
    { id: '55555555-0000-0000-0000-000000000010', product_id: '22222222-0000-0000-0000-000000000010', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received: 50, remaining_quantity: 44, cost_price: 38.00, created_at: '2026-01-15T10:00:00Z' }
  ]);

  const [units, setUnits] = useState<InventoryUnit[]>([
    { id: '66666666-0000-0000-0000-000000000001', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-001', status: 'sold', updated_at: '2025-11-20T09:15:00Z' },
    { id: '66666666-0000-0000-0000-000000000002', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-002', status: 'sold', updated_at: '2026-01-22T13:20:00Z' },
    { id: '66666666-0000-0000-0000-000000000003', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-003', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000004', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-004', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000005', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-005', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000006', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-006', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000007', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-007', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000008', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-008', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000009', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-001', status: 'sold', updated_at: '2025-11-22T14:30:00Z' },
    { id: '66666666-0000-0000-0000-000000000010', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-002', status: 'available', updated_at: '2025-11-12T10:00:00Z' },
    { id: '66666666-0000-0000-0000-000000000020', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-001', status: 'sold', updated_at: '2025-12-10T16:45:00Z' },
    { id: '66666666-0000-0000-0000-000000000030', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-001', status: 'sold', updated_at: '2026-01-18T10:00:00Z' }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: '77777777-0000-0000-0000-000000000001', customer_id: '11111111-0000-0000-0000-000000000001', total_amount: 1299.99, payment_status: 'paid', created_by: null, created_at: '2025-11-20T09:15:00Z' },
    { id: '77777777-0000-0000-0000-000000000002', customer_id: '11111111-0000-0000-0000-000000000002', total_amount: 1899.99, payment_status: 'paid', created_by: null, created_at: '2025-11-22T14:30:00Z' },
    { id: '77777777-0000-0000-0000-000000000003', customer_id: '11111111-0000-0000-0000-000000000003', total_amount: 1599.99, payment_status: 'partial', created_by: null, created_at: '2025-12-05T11:00:00Z' },
    { id: '77777777-0000-0000-0000-000000000004', customer_id: '11111111-0000-0000-0000-000000000004', total_amount: 749.99, payment_status: 'paid', created_by: null, created_at: '2025-12-10T16:45:00Z' },
    { id: '77777777-0000-0000-0000-000000000005', customer_id: '11111111-0000-0000-0000-000000000005', total_amount: 1099.99, payment_status: 'credit', created_by: null, created_at: '2026-01-18T10:00:00Z' },
    { id: '77777777-0000-0000-0000-000000000006', customer_id: '11111111-0000-0000-0000-000000000006', total_amount: 1299.99, payment_status: 'paid', created_by: null, created_at: '2026-01-22T13:20:00Z' },
  ]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: 'oi-1', order_id: '77777777-0000-0000-0000-000000000001', product_id: '22222222-0000-0000-0000-000000000001', quantity: 1, unit_price: 1299.99, batch_id: '55555555-0000-0000-0000-000000000001', unit_id: '66666666-0000-0000-0000-000000000001' },
    { id: 'oi-2', order_id: '77777777-0000-0000-0000-000000000002', product_id: '22222222-0000-0000-0000-000000000002', quantity: 1, unit_price: 1899.99, batch_id: '55555555-0000-0000-0000-000000000002', unit_id: '66666666-0000-0000-0000-000000000009' },
    { id: 'oi-3', order_id: '77777777-0000-0000-0000-000000000003', product_id: '22222222-0000-0000-0000-000000000003', quantity: 1, unit_price: 1599.99, batch_id: '55555555-0000-0000-0000-000000000003', unit_id: null },
    { id: 'oi-4', order_id: '77777777-0000-0000-0000-000000000004', product_id: '22222222-0000-0000-0000-000000000004', quantity: 1, unit_price: 749.99, batch_id: '55555555-0000-0000-0000-000000000004', unit_id: '66666666-0000-0000-0000-000000000020' },
    { id: 'oi-5', order_id: '77777777-0000-0000-0000-000000000005', product_id: '22222222-0000-0000-0000-000000000005', quantity: 1, unit_price: 1099.99, batch_id: '55555555-0000-0000-0000-000000000005', unit_id: '66666666-0000-0000-0000-000000000030' },
    { id: 'oi-6', order_id: '77777777-0000-0000-0000-000000000006', product_id: '22222222-0000-0000-0000-000000000001', quantity: 1, unit_price: 1299.99, batch_id: '55555555-0000-0000-0000-000000000001', unit_id: '66666666-0000-0000-0000-000000000002' },
  ]);

  const [walletBalance, setWalletBalance] = useState<number>(1840.00);
  const [currentUser, setCurrentUser] = useState<MockUser | null>({
    id: 'u-1',
    name: 'Kwame Asante',
    email: 'kwame@americanhomeventures.com',
    role: 'agent',
    commission_type: 'percentage',
    commission_rate: 0.05,
    balance: 1840.00,
  });

  const [offlineActivities, setOfflineActivities] = useState<OfflineActivity[]>([
    {
      id: '1',
      title: 'Stock Adjustment',
      description: 'Added 5 units of AirPods Pro to inventory',
      timestamp: '10:24 AM',
      type: 'stock',
    },
    {
      id: '2',
      title: 'Scan Serial Number',
      description: 'Registered serial number SN-12345 to batch B-987',
      timestamp: '10:18 AM',
      type: 'scan',
    },
    {
      id: '3',
      title: 'Order Status Update',
      description: 'Marked ORD-2024-1205 as "shipped"',
      timestamp: '10:05 AM',
      type: 'order',
    },
  ]);

  const mockUsers: MockUser[] = [
    {
      id: 'u-1',
      name: 'Kwame Asante',
      email: 'kwame@americanhomeventures.com',
      role: 'agent',
      commission_type: 'percentage',
      commission_rate: 0.05,
      balance: walletBalance,
    },
    {
      id: 'u-2',
      name: 'James Cole',
      email: 'james@americanhomeventures.com',
      role: 'warehouse_operator',
      commission_type: 'flat',
      commission_rate: 0,
      balance: 0.00,
    },
    {
      id: 'u-3',
      name: 'Marcus Reynolds',
      email: 'marcus@americanhomeventures.com',
      role: 'admin',
      commission_type: 'flat',
      commission_rate: 0,
      balance: 500.00,
    }
  ];

  const signInMockUser = (email: string, password: string): boolean => {
    const found = mockUsers.find(u => u.email === email && password === 'password123');
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const signOutMockUser = () => {
    setCurrentUser(null);
  };

  const syncActivities = (ids: string[]) => {
    setOfflineActivities(prev => prev.filter(act => !ids.includes(act.id)));
  };

  const resetActivities = () => {
    setOfflineActivities([
      {
        id: '1',
        title: 'Stock Adjustment',
        description: 'Added 5 units of AirPods Pro to inventory',
        timestamp: '10:24 AM',
        type: 'stock',
      },
      {
        id: '2',
        title: 'Scan Serial Number',
        description: 'Registered serial number SN-12345 to batch B-987',
        timestamp: '10:18 AM',
        type: 'scan',
      },
      {
        id: '3',
        title: 'Order Status Update',
        description: 'Marked ORD-2024-1205 as "shipped"',
        timestamp: '10:05 AM',
        type: 'order',
      },
    ]);
  };

  const resolvedCurrentUser = currentUser && currentUser.id === 'u-1'
    ? { ...currentUser, balance: walletBalance }
    : currentUser;
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: 't-1', wallet_id: 'w-1', amount: 840.00, type: 'credit', reason: 'Commission on Samsung TV referral', status: 'pending', method: "Auto-credit", reference_id: '77777777-0000-0000-0000-000000000001', created_at: '2024-06-20T09:15:00Z' },
    { id: 't-2', wallet_id: 'w-1', amount: 1000.00, type: 'credit', reason: 'Direct Referral Commission Bonus', status: 'completed', method: "Auto-credit", reference_id: null, created_at: '2024-06-22T14:30:00Z' },
    { id: 't-3', wallet_id: 'w-1', amount: 1000.00, type: 'debit', reason: 'Withdrawal to Mobile Money', status: 'completed', method: "MTN Momo", reference_id: null, created_at: '2024-06-22T15:30:00Z' },
  ]);

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([
    { id: 'wd-1', user_id: 'u-1', amount: 150.00, network: 'MTN Mobile Money', phone: '+1-512-555-0101', status: 'completed', created_at: '2024-06-10T10:00:00Z' },
    { id: 'wd-2', user_id: 'u-1', amount: 50.00, network: 'Telecel Cash', phone: '+1-512-555-0101', status: 'pending', created_at: '2024-06-15T15:30:00Z' }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 'task-1', title: 'Confirm delivery for SHP-2024-016', description: 'Confirm that all items for shipment SHP-2024-016 have been correctly received and stocked.', priority: 'high', status: 'completed', due_date: '2024-06-10' },
    { id: 'task-2', title: 'Stock count — Electronics section', description: 'Conduct a physical inventory count of all products in the electronics category.', priority: 'high', status: 'pending', due_date: '2024-06-14' },
    { id: 'task-3', title: 'Process order ORD-2024-1205', description: 'Reconcile and process the pending payment status for order ORD-2024-1205.', priority: 'medium', status: 'pending', due_date: '2024-06-14' },
    { id: 'task-4', title: 'Update pricing for Footwear category', description: 'Review and update retail and wholesale pricing for footwear items.', priority: 'low', status: 'pending', due_date: '2024-06-15' },
    { id: 'task-5', title: 'Verify batch BCH-2024-041 serial numbers', description: 'Double check the physical serial numbers on the shipment block BCH-2024-041.', priority: 'medium', status: 'pending', due_date: '2024-06-16' },
    { id: 'task-6', title: 'Submit June expense report', description: 'Compile and submit operations expense spreadsheet for June.', priority: 'low', status: 'pending', due_date: '2024-06-30' },
    { id: 'task-7', title: 'Reorder AirPods Pro — below threshold', description: 'Apple AirPods Pro stock is low. Submit reorder request.', priority: 'high', status: 'pending', due_date: '2024-06-14' },
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'Low Stock Alert: Apple AirPods Pro', body: 'Apple AirPods Pro stock is low (8 units). Reorder required.', category: 'inventory', read: false, time: '2h ago' },
    { id: '2', title: 'New Credit Order Synced', body: 'Order #77777777 has been successfully uploaded to cloud ledger.', category: 'orders', read: false, time: '1d ago' },
    { id: '3', title: 'Shipment SHP-2024-018 In Transit', body: 'Shipment with 50 units has left origin country. ETA is June 25, 2024.', category: 'shipments', read: true, time: '3d ago' },
  ]);

  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 'a-1', title: 'Low Stock: AirPods Pro', body: '8 units remaining. Reorder point: 15 units.', category: 'inventory_low', time: '4h ago', read: false },
    { id: 'a-2', title: 'Out of Stock: Nike Air Max 270', body: '0 units. Customer orders will be blocked.', category: 'inventory_out', time: '2d ago', read: false },
    { id: 'a-3', title: 'Credit Limit: HomeGoods Plus', body: '96% of $30,000 limit used. Action required.', category: 'credit', time: '1d ago', read: false },
    { id: 'a-4', title: 'Shipment ETA Today: SHP-2024-017', body: 'Expected arrival in 3h. Prepare receiving area.', category: 'shipment', time: '6h ago', read: false },
  ]);

  const [discrepancyReports, setDiscrepancyReports] = useState<DiscrepancyReport[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [shipmentReports, setShipmentReports] = useState<ShipmentReport[]>([]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const addOrder = (
    customerId: string | null,
    total: number,
    paymentStatus: Order['payment_status'],
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ) => {
    const newOrderId = `77777777-${Math.floor(1000 + Math.random() * 9000)}-4000-8000-000000000000`;
    const newOrder: Order = {
      id: newOrderId,
      customer_id: customerId,
      total_amount: total,
      payment_status: paymentStatus,
      created_by: 'u-1',
      created_at: new Date().toISOString()
    };

    const newItems: OrderItem[] = items.map((item, idx) => ({
      id: `oi-${newOrderId.slice(0, 4)}-${idx}`,
      order_id: newOrderId,
      ...item
    }));

    // Update stocks based on items sold
    setBatches(prevBatches =>
      prevBatches.map(batch => {
        const matchingItem = items.find(item => item.batch_id === batch.id);
        if (matchingItem) {
          return {
            ...batch,
            remaining_quantity: Math.max(0, batch.remaining_quantity - matchingItem.quantity)
          };
        }
        return batch;
      })
    );

    // Update units status to sold
    setUnits(prevUnits =>
      prevUnits.map(unit => {
        const matchingItem = items.find(item => item.unit_id === unit.id);
        if (matchingItem) {
          return { ...unit, status: 'sold', updated_at: new Date().toISOString() };
        }
        return unit;
      })
    );

    // Add customer debt if credit
    if (paymentStatus === 'credit' && customerId) {
      setCustomers(prev =>
        prev.map(c => (c.id === customerId ? { ...c, total_debt: c.total_debt + total } : c))
      );
    }

    // Add agent commission if user is agent
    const commissionEarned = items.reduce((sum, item) => {
      // find variant commission
      const v = variants.find(v => v.product_id === item.product_id);
      return sum + (v ? v.commission_amount * item.quantity : 0);
    }, 0);

    if (commissionEarned > 0) {
      setWalletBalance(prev => prev + commissionEarned);
      setWalletTransactions(prev => [
        {
          id: `t-${Math.random().toString(36).substring(2, 9)}`,
          wallet_id: 'w-1',
          amount: commissionEarned,
          type: 'credit',
          method: "Auto-credit",
          status: 'pending',
          reason: `Commission on Order ${newOrderId.slice(0, 8)}`,
          reference_id: newOrderId,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
    }

    setOrders(prev => [newOrder, ...prev]);
    setOrderItems(prev => [...prev, ...newItems]);
  };

  const addWithdrawal = (amount: number, network: string, phone: string): boolean => {
    if (amount > walletBalance) return false;

    const newWd: Withdrawal = {
      id: `wd-${Math.random().toString(36).substring(2, 9)}`,
      user_id: 'u-1',
      amount,
      network,
      phone,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    setWalletBalance(prev => prev - amount);
    setWalletTransactions(prev => [
      {
        id: `t-${Math.random().toString(36).substring(2, 9)}`,
        wallet_id: 'w-1',
        amount: -amount,
        type: 'debit',
        method: "Auto-credit",
        status: 'pending',
        reason: `Withdrawal to ${network}`,
        reference_id: newWd.id,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    setWithdrawals(prev => [newWd, ...prev]);
    return true;
  };

  const registerSerial = (batchId: string, serialNumber: string): boolean => {
    const existing = units.find(u => u.serial_number === serialNumber);
    if (existing) return false;

    const newUnit: InventoryUnit = {
      id: `unit-${Math.random().toString(36).substring(2, 9)}`,
      batch_id: batchId,
      serial_number: serialNumber,
      status: 'available',
      updated_at: new Date().toISOString()
    };

    setUnits(prev => [newUnit, ...prev]);
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, remaining_quantity: b.remaining_quantity + 1, quantity_received: b.quantity_received + 1 } : b))
    );
    return true;
  };

  const adjustStock = (productId: string, quantityChange: number, reason: string) => {
    const productBatches = batches.filter(b => b.product_id === productId);
    if (productBatches.length > 0) {
      const targetBatch = productBatches[0];
      setBatches(prev =>
        prev.map(b => {
          if (b.id === targetBatch.id) {
            const nextQty = Math.max(0, b.remaining_quantity + quantityChange);
            return {
              ...b,
              remaining_quantity: nextQty,
              quantity_received: quantityChange > 0 ? b.quantity_received + quantityChange : b.quantity_received
            };
          }
          return b;
        })
      );
    } else {
      const newBatchId = `55555555-${Math.floor(1000 + Math.random() * 9000)}-0000-0000-000000000000`;
      const newBatch: InventoryBatch = {
        id: newBatchId,
        product_id: productId,
        shipment_id: null,
        quantity_received: Math.max(0, quantityChange),
        remaining_quantity: Math.max(0, quantityChange),
        cost_price: 100,
        created_at: new Date().toISOString()
      };
      setBatches(prev => [newBatch, ...prev]);
    }
  };

  const addDiscrepancyReport = (productId: string, expected: number, actual: number, notes: string) => {
    const report: DiscrepancyReport = {
      id: `disc-${Math.random().toString(36).substring(2, 9)}`,
      product_id: productId,
      expected_qty: expected,
      actual_qty: actual,
      notes,
      created_at: new Date().toISOString()
    };
    setDiscrepancyReports(prev => [report, ...prev]);
    
    const diff = actual - expected;
    if (diff !== 0) {
      adjustStock(productId, diff, `Discrepancy adjustments: ${notes}`);
    }
  };

  const addDamageReport = (productId: string, serialNumber: string, severity: DamageReport['severity'], description: string) => {
    const report: DamageReport = {
      id: `dmg-${Math.random().toString(36).substring(2, 9)}`,
      product_id: productId,
      serial_number: serialNumber,
      severity,
      description,
      created_at: new Date().toISOString()
    };
    setDamageReports(prev => [report, ...prev]);

    setUnits(prev =>
      prev.map(u => (u.serial_number === serialNumber ? { ...u, status: 'damaged', updated_at: new Date().toISOString() } : u))
    );

    const matchingUnit = units.find(u => u.serial_number === serialNumber);
    if (matchingUnit) {
      setBatches(prev =>
        prev.map(b => (b.id === matchingUnit.batch_id ? { ...b, remaining_quantity: Math.max(0, b.remaining_quantity - 1) } : b))
      );
    }
  };

  const addShipmentReport = (shipmentId: string, issueType: string, description: string) => {
    const report: ShipmentReport = {
      id: `shp-rep-${Math.random().toString(36).substring(2, 9)}`,
      shipment_id: shipmentId,
      issue_type: issueType,
      description,
      created_at: new Date().toISOString()
    };
    setShipmentReports(prev => [report, ...prev]);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
    );
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const receiveShipmentStock = (shipmentId: string, productId: string, qty: number, cost: number) => {
    const newBatchId = `55555555-${Math.floor(1000 + Math.random() * 9000)}-0000-0000-000000000000`;
    const newBatch: InventoryBatch = {
      id: newBatchId,
      product_id: productId,
      shipment_id: shipmentId,
      quantity_received: qty,
      remaining_quantity: qty,
      cost_price: cost,
      created_at: new Date().toISOString()
    };
    setBatches(prev => [newBatch, ...prev]);

    setShipments(prev =>
      prev.map(s => (s.id === shipmentId ? { ...s, status: 'received', arrival_date: new Date().toISOString().split('T')[0] } : s))
    );
  };

  const toggleAlertReadStatus = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, read: !a.read } : a))
    );
  };

  return (
    <MockDataContext.Provider
      value={{
        customers,
        products,
        variants,
        shipments,
        batches,
        units,
        orders,
        orderItems,
        walletTransactions,
        withdrawals,
        tasks,
        notifications,
        alerts,
        discrepancyReports,
        damageReports,
        shipmentReports,
        walletBalance,
        users: mockUsers,
        currentUser: resolvedCurrentUser,
        offlineActivities,

        addOrder,
        addWithdrawal,
        registerSerial,
        adjustStock,
        addDiscrepancyReport,
        addDamageReport,
        addShipmentReport,
        toggleTaskStatus,
        toggleAlertReadStatus,
        markNotificationsAsRead,
        receiveShipmentStock,
        signInMockUser,
        signOutMockUser,
        syncActivities,
        resetActivities,
        markNotificationAsRead,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}
