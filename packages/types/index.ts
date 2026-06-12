export type UserRole = 'admin' | 'manager' | 'cashier' | 'inventory' | 'agent' | 'customer';
export type CommissionType = 'percentage' | 'flat' | 'variant_specific';
export type ShipmentStatus = 'pending' | 'in_transit' | 'received';
export type PaymentStatus = 'paid' | 'partial' | 'credit' | 'pending_resolution';
export type InventoryUnitStatus = 'available' | 'sold' | 'damaged';
export type LedgerEntryType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type TransactionType = 'credit' | 'debit';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PaymentProvider = 'paystack' | 'momo' | 'cash' | 'credit';

export interface User {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  commission_type: CommissionType;
  commission_rate: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  has_serial: boolean;
  description: string | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  barcode: string | null;
  retail_price: number;
  wholesale_price: number;
  commission_amount: number;
  created_at: string;
}

export interface Shipment {
  id: string;
  shipment_code: string;
  supplier_country: string;
  status: ShipmentStatus;
  arrival_date: string | null;
  total_cost: number;
  created_at: string;
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
  status: InventoryUnitStatus;
  updated_at: string;
}

export interface InventoryLedger {
  id: string;
  product_id: string;
  batch_id: string | null;
  type: LedgerEntryType;
  quantity: number;
  reference_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  total_amount: number;
  payment_status: PaymentStatus;
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

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: TransactionType;
  reason: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  network: string;
  phone: string;
  status: WithdrawalStatus;
  created_at: string;
}

export interface CreditAccount {
  id: string;
  customer_id: string;
  total_debt: number;
}

export interface CreditPayment {
  id: string;
  credit_account_id: string;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  amount: number;
  reference: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}
