import { Order, OrderItem, Payment, PaymentStatus, Product } from '@icos/types';

// ==========================================
// 1. MATHEMATICAL UTILITIES
// ==========================================

/**
 * Rounds a number to a fixed decimal place to prevent floating-point errors in currency math.
 */
export function roundToCent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a percentage commission amount.
 */
export function calculatePercentageCommission(amount: number, rate: number): number {
  return roundToCent(amount * rate);
}


// ==========================================
// 2. OFFLINE INDEXEDDB CLIENT (FOR POS WORK)
// ==========================================

export interface QueueEntry {
  id: string;
  order: Omit<Order, 'id'> & { id?: string };
  items: Omit<OrderItem, 'id'>[];
  payments: Omit<Payment, 'id'>[];
  retryCount: number;
  errorMessage?: string;
  createdAt: number;
}

const DB_NAME = 'ICOS_Offline_Cache';
const DB_VERSION = 1;
const QUEUE_STORE = 'sync_queue';
const PRODUCTS_STORE = 'cached_products';

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environments'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Adds an order to the offline sync queue.
 */
export async function queueOfflineOrder(
  order: Omit<Order, 'id'> & { id?: string },
  items: Omit<OrderItem, 'id'>[],
  payments: Omit<Payment, 'id'>[]
): Promise<string> {
  const db = await openIndexedDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);

  const entry: QueueEntry = {
    id: order.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order,
    items,
    payments,
    retryCount: 0,
    createdAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const request = store.add(entry);
    request.onsuccess = () => resolve(entry.id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets all items in the offline sync queue.
 */
export async function getSyncQueue(): Promise<QueueEntry[]> {
  const db = await openIndexedDB();
  const tx = db.transaction(QUEUE_STORE, 'readonly');
  const store = tx.objectStore(QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Removes an order from the offline sync queue.
 */
export async function removeQueueEntry(id: string): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Updates a queue entry with retry status or error message.
 */
export async function updateQueueEntry(entry: QueueEntry): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Caches items locally for fast offline POS lookup.
 */
export async function cacheProducts(products: Product[]): Promise<void> {
  const db = await openIndexedDB();
  const tx = db.transaction(PRODUCTS_STORE, 'readwrite');
  const store = tx.objectStore(PRODUCTS_STORE);

  store.clear(); // Clear previous cache
  for (const prod of products) {
    store.put(prod);
  }
}

/**
 * Retrieves cached products for offline usage.
 */
export async function getCachedProducts(): Promise<Product[]> {
  const db = await openIndexedDB();
  const tx = db.transaction(PRODUCTS_STORE, 'readonly');
  const store = tx.objectStore(PRODUCTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}


// ==========================================
// 3. INTEGRATION SIMULATION LAYER (PAYMENTS)
// ==========================================

export interface PayoutResponse {
  success: boolean;
  transactionId: string;
  providerReference: string;
  errorMessage?: string;
}

/**
 * Simulates calling Mobile Money / Payout gateway APIs (Hubtel, Flutterwave, MoMo)
 */
export async function simulateMobileMoneyPayout(
  network: string,
  phoneNumber: string,
  amount: number
): Promise<PayoutResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Validation
  if (!phoneNumber.match(/^\+?[0-9]{9,15}$/)) {
    return {
      success: false,
      transactionId: '',
      providerReference: '',
      errorMessage: 'Invalid phone number format.'
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      transactionId: '',
      providerReference: '',
      errorMessage: 'Amount must be greater than zero.'
    };
  }

  // Generate random IDs for the mocked transaction
  const transactionId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const providerReference = 'MOMO_' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Simulate success rate (95% success rate for simulation)
  const isSuccessful = Math.random() < 0.95;

  if (isSuccessful) {
    return {
      success: true,
      transactionId,
      providerReference
    };
  } else {
    return {
      success: false,
      transactionId: '',
      providerReference: '',
      errorMessage: 'Insufficient provider pool funds or network timeout.'
    };
  }
}

/**
 * Simulates Paystack card payment authentication
 */
export async function simulatePaystackPayment(
  email: string,
  amount: number,
  cardDetails: { number: string; cvc: string; expiry: string }
): Promise<{ success: boolean; reference: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (cardDetails.number.replace(/\s+/g, '').length < 16) {
    return { success: false, reference: '', error: 'Invalid card number' };
  }

  const reference = 'PAY_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  return {
    success: true,
    reference
  };
}
