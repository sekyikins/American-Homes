'use client';

import * as React from 'react';
import { Button, Card, Badge, InputField, SelectField, Modal } from '@icos/ui';
import { 
  queueOfflineOrder, 
  getSyncQueue, 
  removeQueueEntry, 
  updateQueueEntry, 
  cacheProducts, 
  getCachedProducts,
  roundToCent,
  simulatePaystackPayment
} from '@icos/utils';

// Core mock products for POS checkout
const PRODUCTS_CATALOG = [
  { id: '1', name: 'Smart Inverter Fridge', category: 'Appliances', barcode: '88012345', price: 450, sku: 'REF-INV-001', stock: 12 },
  { id: '2', name: 'Premium Sofa Set', category: 'Furniture', barcode: '88056789', price: 950, sku: 'SOF-SET-002', stock: 5 },
  { id: '3', name: 'UHD Smart TV 55"', category: 'Electronics', barcode: '88099887', price: 600, sku: 'TV-UHD-003', stock: 8 }
];

const CUSTOMERS = [
  { id: 'C1', name: 'Alice Johnson', phone: '+1234567890' },
  { id: 'C2', name: 'Bob Miller', phone: '+1987654321' }
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

export default function POSSystem() {
  const [online, setOnline] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState('');
  const [paymentProvider, setPaymentProvider] = React.useState<'cash' | 'card' | 'momo' | 'credit'>('cash');
  const [syncQueue, setSyncQueue] = React.useState<any[]>([]);
  
  // Modals status
  const [checkoutModalOpen, setCheckoutModalOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [successModal, setSuccessModal] = React.useState(false);
  const [lastOrderDetails, setLastOrderDetails] = React.useState<any>(null);

  // Load IndexedDB sync queue on load
  React.useEffect(() => {
    loadOfflineQueue();
  }, []);

  const loadOfflineQueue = async () => {
    try {
      const q = await getSyncQueue();
      setSyncQueue(q);
    } catch (e) {
      console.warn('IndexedDB not supported or initialized:', e);
      // Fallback localstorage
      const backup = localStorage.getItem('icos_sync_queue');
      if (backup) setSyncQueue(JSON.parse(backup));
    }
  };

  const handleAddToCart = (product: typeof PRODUCTS_CATALOG[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = roundToCent(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

  // Perform Local/IndexedDB or Server checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setProcessing(true);

    const orderId = `ORD_${Date.now()}`;
    const orderData = {
      id: orderId,
      customer_id: selectedCustomerId || null,
      total_amount: cartTotal,
      payment_status: paymentProvider === 'credit' ? ('credit' as const) : ('paid' as const),
      created_by: 'A1', // Mock Cashier/Agent user
      created_at: new Date().toISOString()
    };

    const orderItems = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const orderPayments = [{
      provider: paymentProvider,
      amount: cartTotal,
      reference: paymentProvider === 'card' ? 'PAYSTACK_REF_MOCK' : 'CASH_MOCK',
      status: online ? ('completed' as const) : ('pending' as const)
    }];

    try {
      if (online) {
        // Direct Server Simulation
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Simulating success callback
        setLastOrderDetails({
          id: orderId,
          total: cartTotal,
          paymentStatus: orderData.payment_status,
          status: 'success'
        });
      } else {
        // Offline Mode: Queue into IndexedDB local queue
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
          await queueOfflineOrder(orderData, orderItems, orderPayments);
        } catch (e) {
          // Fallback to localStorage
          const currentQueue = [...syncQueue, { id: orderId, order: orderData, items: orderItems, payments: orderPayments }];
          localStorage.setItem('icos_sync_queue', JSON.stringify(currentQueue));
        }

        await loadOfflineQueue();

        setLastOrderDetails({
          id: orderId,
          total: cartTotal,
          paymentStatus: orderData.payment_status,
          status: 'offline_queued'
        });
      }

      setCart([]);
      setCheckoutModalOpen(false);
      setSuccessModal(true);
    } catch (err) {
      alert('Checkout failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  // Synchronize Offline Orders
  const handleSyncQueue = async () => {
    if (syncQueue.length === 0) return;
    setProcessing(true);

    // Simulate sending payloads to Supabase Sync Edge Function
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate Sync check & detect conflicts (e.g. Bob ordered sofa set but inventory got depleted)
    const processedQueue = syncQueue.map((item, idx) => {
      // Intentionally simulate a conflict on the 2nd items or randomly
      const hasConflict = idx === 1; 
      return {
        ...item,
        syncStatus: hasConflict ? 'conflict' : 'synced',
        errorMessage: hasConflict ? 'Out of stock: stock depleted during offline period' : undefined
      };
    });

    // Clean out successful synced items, keep conflicts marked in IndexedDB
    try {
      const db = await window.indexedDB.open('ICOS_Offline_Cache', 1);
      db.onsuccess = () => {
        const trans = db.result.transaction('sync_queue', 'readwrite');
        const store = trans.objectStore('sync_queue');
        
        processedQueue.forEach(async (entry) => {
          if (entry.syncStatus === 'synced') {
            store.delete(entry.id);
          } else {
            // Update queue with conflict details
            store.put({
              ...entry,
              errorMessage: entry.errorMessage,
              retryCount: entry.retryCount + 1
            });
          }
        });
      };
    } catch (e) {
      console.warn('Storage sync update skipped:', e);
    }

    // Refresh display queue
    setTimeout(async () => {
      await loadOfflineQueue();
      setProcessing(false);
      alert('Sync process completed. Synced items processed. Conflicts remain for resolution.');
    }, 200);
  };

  // Resolve sync conflict: Refund / Cancel order flow
  const handleCancelConflict = async (id: string) => {
    try {
      await removeQueueEntry(id);
      await loadOfflineQueue();
      alert('Conflict cancelled. Order refunded successfully.');
    } catch (e) {
      // fallback
      const filtered = syncQueue.filter(item => item.id !== id);
      setSyncQueue(filtered);
      localStorage.setItem('icos_sync_queue', JSON.stringify(filtered));
      alert('Conflict cancelled (local storage update).');
    }
  };

  // Barcode quick addition mock trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = PRODUCTS_CATALOG.find(p => p.barcode === search || p.sku.toLowerCase() === search.toLowerCase());
    if (matched) {
      handleAddToCart(matched);
      setSearch('');
    } else {
      alert('Barcode or SKU not found in local cached catalog.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* POS Nav */}
      <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">P</div>
          <h1 className="font-extrabold text-lg tracking-tight text-white">ICOS Point Of Sale (POS)</h1>
        </div>

        {/* Network Status Toggle Button */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setOnline(!online)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
              online 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                : 'bg-rose-950/40 border-rose-800 text-rose-400 animate-pulse'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {online ? 'ONLINE MODE' : 'OFFLINE MODE'}
          </button>
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        
        {/* Left Side: Product Search & Catalog (Grid-span 2) */}
        <div className="lg:col-span-2 p-6 flex flex-col gap-6 border-r border-slate-800">
          
          {/* Barcode Scanner / SKU input */}
          <Card title="Quick SKU / Barcode Scan" description="Simulate hardware barcode scanner input." className="!bg-slate-950 !border-slate-800">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
              <InputField 
                placeholder="Scan barcode (e.g. 88012345) or enter SKU (e.g. REF-INV-001)" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 !bg-slate-900 !border-slate-800 text-white"
              />
              <Button type="submit" variant="primary">Add Item</Button>
            </form>
          </Card>

          {/* Catalog Selection Grid */}
          <div className="flex-1">
            <h3 className="text-base font-bold text-white mb-4">Cached Product Catalog</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRODUCTS_CATALOG.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => handleAddToCart(p)}
                  className="p-4 border border-slate-800 rounded-xl bg-slate-950 hover:border-indigo-500 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{p.category}</span>
                    <h4 className="font-bold text-white text-sm mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">SKU: {p.sku} | Barcode: {p.barcode}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-bold text-indigo-400 font-mono">${p.price}</span>
                    <span className="text-[10px] text-slate-500">Stock: {p.stock} available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Cart & Checkout (Grid-span 1) */}
        <div className="lg:col-span-1 p-6 flex flex-col justify-between border-r border-slate-800 bg-slate-950/30">
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex justify-between">
              <span>Checkout Cart</span>
              <Badge type="info">{cart.reduce((sum, i) => sum + i.quantity, 0)} Items</Badge>
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Cart is empty. Select products to begin.
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-slate-800/60 pb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-xs">{item.name}</h4>
                      <p className="text-xs text-indigo-400 font-mono mt-0.5">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="h-6 w-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold text-white font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="h-6 w-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-500 transition-colors ml-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="text-slate-400 font-medium">Subtotal</span>
              <span className="font-bold text-white font-mono text-lg">${cartTotal}</span>
            </div>
            <Button 
              variant="primary" 
              className="w-full"
              disabled={cart.length === 0}
              onClick={() => setCheckoutModalOpen(true)}
            >
              Checkout Order
            </Button>
          </div>
        </div>

        {/* Right Side: Sync Monitor / Offline Queue (Grid-span 1) */}
        <div className="lg:col-span-1 p-6 flex flex-col gap-6">
          <Card title="Offline Queue & Sync" description="Check queued offline sales ledger entries." className="!bg-slate-950 !border-slate-800 flex-1 flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto max-h-[60vh] pr-1">
              {syncQueue.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-xs">
                  All systems synced. No offline logs pending.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {syncQueue.map((item) => (
                    <div key={item.id} className={`p-3 border rounded-xl bg-slate-900 ${item.errorMessage ? 'border-rose-900 bg-rose-950/20' : 'border-slate-800'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-white">{item.id.substring(0, 12)}</span>
                        <Badge type={item.errorMessage ? 'error' : 'warning'} className="!text-[9px]">
                          {item.errorMessage ? 'CONFLICT' : 'QUEUED'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 font-mono">Total: ${item.order.total_amount}</p>
                      
                      {item.errorMessage && (
                        <div className="mt-2 text-[10px] text-rose-400 border-t border-rose-900/40 pt-1.5">
                          <p className="font-semibold">Reason:</p>
                          <p className="italic">{item.errorMessage}</p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="danger" 
                              className="!py-0.5 !px-2 !text-[9px]"
                              onClick={() => handleCancelConflict(item.id)}
                            >
                              Refund / Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {syncQueue.length > 0 && (
              <Button 
                variant={online ? 'success' : 'outline'}
                className="w-full mt-4" 
                disabled={!online || processing}
                isLoading={processing}
                onClick={handleSyncQueue}
              >
                {online ? 'Sync Offline Orders' : 'Go Online to Sync'}
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Complete POS Checkout"
      >
        <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
          <SelectField 
            label="Customer Link (Optional / Required for Credit)" 
            id="checkout_customer"
            options={[
              { value: '', label: 'Walk-in Customer (General)' },
              ...CUSTOMERS.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))
            ]}
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="!bg-slate-900 !border-slate-800 text-white"
          />

          <SelectField 
            label="Payment Provider" 
            id="checkout_payment"
            options={[
              { value: 'cash', label: 'Cash Payment' },
              { value: 'card', label: 'Card Payment (Paystack simulation)' },
              { value: 'momo', label: 'Mobile Money Payout System' },
              { value: 'credit', label: 'Credit Sales (Buy Now Pay Later)' }
            ]}
            value={paymentProvider}
            onChange={(e) => setPaymentProvider(e.target.value as any)}
            className="!bg-slate-900 !border-slate-800 text-white"
          />

          {paymentProvider === 'credit' && !selectedCustomerId && (
            <p className="text-xs text-rose-400 italic">Caution: Credit sale requires linking an identified customer account.</p>
          )}

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Total Payable</p>
              <p className="text-lg font-bold text-white font-mono">${cartTotal}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCheckoutModalOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                variant="success" 
                disabled={paymentProvider === 'credit' && !selectedCustomerId}
                isLoading={processing}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Success Notification Modal */}
      <Modal
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        title="Sale Completed Successfully"
      >
        <div className="text-center py-4 flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Receipt Generated!</h4>
            <p className="text-xs text-slate-400 mt-1 font-mono">Ref: {lastOrderDetails?.id}</p>
          </div>
          
          <div className="w-full bg-slate-950 p-4 border border-slate-800 rounded-xl mt-2 text-left text-xs text-slate-300 font-mono">
            <p className="border-b border-slate-800 pb-2 mb-2 font-bold text-white text-center">AMERICAN HOME VENTURES</p>
            <div className="flex justify-between">
              <span>Order Amount:</span>
              <span>${lastOrderDetails?.total}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Status:</span>
              <span>{lastOrderDetails?.status === 'offline_queued' ? 'OFFLINE QUEUED' : 'PAID'}</span>
            </div>
          </div>

          <Button variant="primary" className="w-full mt-4" onClick={() => setSuccessModal(false)}>Done</Button>
        </div>
      </Modal>

    </div>
  );
}
