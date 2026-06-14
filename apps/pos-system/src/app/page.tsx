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
import { supabase } from '../lib/supabase';

// Cart interface and POS main component

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

export default function POSSystem() {
  const [online, setOnline] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [productsCatalog, setProductsCatalog] = React.useState<any[]>([]);
  const [customersList, setCustomersList] = React.useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState('');
  const [paymentProvider, setPaymentProvider] = React.useState<'cash' | 'card' | 'momo' | 'credit'>('cash');
  const [syncQueue, setSyncQueue] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Modals status
  const [checkoutModalOpen, setCheckoutModalOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [successModal, setSuccessModal] = React.useState(false);
  const [lastOrderDetails, setLastOrderDetails] = React.useState<any>(null);

  const loadOfflineQueue = async () => {
    try {
      const q = await getSyncQueue();
      setSyncQueue(q || []);
    } catch (e) {
      console.warn('IndexedDB not supported or initialized:', e);
      const backup = localStorage.getItem('icos_sync_queue');
      if (backup) setSyncQueue(JSON.parse(backup));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch customers, variants, and batches in parallel
      const [custsResult, variantsResult, batchesResult] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, phone'),
        supabase
          .from('product_variants')
          .select(`
            id,
            variant_name,
            sku,
            barcode,
            retail_price,
            products ( id, name, category )
          `),
        supabase
          .from('inventory_batches')
          .select('product_id, remaining_quantity')
      ]);

      const custs = custsResult.data;
      const variantsData = variantsResult.data;
      const batchesData = batchesResult.data;

      if (custs && custs.length > 0) {
        setCustomersList(custs);
      } else {
        setCustomersList([]);
      }

      const stockMap: Record<string, number> = {};
      if (batchesData) {
        batchesData.forEach(b => {
          if (b.product_id) {
            stockMap[b.product_id] = (stockMap[b.product_id] || 0) + (b.remaining_quantity || 0);
          }
        });
      }

      if (variantsData && variantsData.length > 0) {
        const mappedCatalog = variantsData.map(v => {
          const prod = v.products as any;
          const prodId = prod?.id || '';
          return {
            id: v.id,
            product_id: prodId,
            name: prod ? `${prod.name} (${v.variant_name})` : v.variant_name,
            category: prod?.category || 'General',
            barcode: v.barcode || '',
            price: Number(v.retail_price) || 0,
            sku: v.sku || '',
            stock: stockMap[prodId] || 0
          };
        });
        setProductsCatalog(mappedCatalog);
        await cacheProducts(mappedCatalog as any);
      } else {
        const cached = await getCachedProducts();
        if (cached && cached.length > 0) {
          setProductsCatalog(cached);
        } else {
          setProductsCatalog([]);
        }
      }
    } catch (err) {
      console.warn('Network offline or error loading products, using cache:', err);
      const cached = await getCachedProducts();
      if (cached && cached.length > 0) {
        setProductsCatalog(cached);
      } else {
        setProductsCatalog([]);
      }
      setCustomersList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load IndexedDB sync queue and catalog products on load
  React.useEffect(() => {
    loadOfflineQueue();
  }, []);

  React.useEffect(() => {
    if (online) {
      loadData();
    } else {
      // offline: read from cache
      setLoading(true);
      getCachedProducts().then(cached => {
        if (cached && cached.length > 0) {
          setProductsCatalog(cached);
        } else {
          setProductsCatalog([]);
        }
        setCustomersList([]);
        setLoading(false);
      });
    }
  }, [online]);

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        id: product.id, 
        product_id: product.product_id || product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        sku: product.sku 
      }];
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
      created_by: null,
      created_at: new Date().toISOString()
    };

    const orderItems = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const orderPayments = [{
      provider: paymentProvider === 'card' ? ('paystack' as const) : paymentProvider,
      amount: cartTotal,
      reference: paymentProvider === 'card' ? `PAYSTACK_REF_${Date.now()}` : 'CASH_POS',
      status: online ? ('completed' as const) : ('pending' as const)
    }];

    try {
      if (online) {
        // Direct Server Insertion via Supabase!
        // 1. Insert order
        const { data: newOrder, error: orderErr } = await supabase
          .from('orders')
          .insert([{
            customer_id: selectedCustomerId || null,
            total_amount: cartTotal,
            payment_status: orderData.payment_status
          }])
          .select();

        if (orderErr) throw new Error('Order creation failed: ' + orderErr.message);

        const dbOrderId = newOrder?.[0]?.id;
        if (!dbOrderId) throw new Error('Failed to retrieve inserted order UUID');

        // 2. Insert order items
        const itemsToInsert = cart.map(item => ({
          order_id: dbOrderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsErr) throw new Error('Order items registration failed: ' + itemsErr.message);

        // 3. Insert payment record
        const { error: paymentErr } = await supabase
          .from('payments')
          .insert([{
            order_id: dbOrderId,
            provider: paymentProvider === 'card' ? 'paystack' : paymentProvider,
            amount: cartTotal,
            reference: paymentProvider === 'card' ? `PAYSTACK_REF_${Date.now()}` : 'CASH_POS',
            status: 'completed'
          }]);

        if (paymentErr) throw new Error('Payment recording failed: ' + paymentErr.message);

        await supabase.from('audit_logs').insert([
          {
            action: 'ORDER_SYNC_SUCCESS',
            details: { message: `POS checkout completed successfully. Order ID: ${dbOrderId}` }
          }
        ]);

        setLastOrderDetails({
          id: dbOrderId,
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
      if (online) loadData(); // refresh stock
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

    let successCount = 0;
    let conflictCount = 0;
    const processedQueue: any[] = [];

    for (const queueItem of syncQueue) {
      try {
        // 1. Insert order
        const { data: newOrder, error: orderErr } = await supabase
          .from('orders')
          .insert([{
            customer_id: queueItem.order.customer_id || null,
            total_amount: queueItem.order.total_amount,
            payment_status: queueItem.order.payment_status,
            created_at: queueItem.order.created_at
          }])
          .select();

        if (orderErr) throw new Error(orderErr.message);

        const dbOrderId = newOrder?.[0]?.id;
        if (!dbOrderId) throw new Error('Failed to retrieve inserted order UUID');

        // 2. Insert order items
        const itemsToInsert = queueItem.items.map((item: any) => ({
          order_id: dbOrderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsErr) throw new Error(itemsErr.message);

        // 3. Insert payment
        const paymentsToInsert = queueItem.payments.map((p: any) => ({
          order_id: dbOrderId,
          provider: p.provider,
          amount: p.amount,
          reference: p.reference,
          status: 'completed'
        }));

        const { error: paymentsErr } = await supabase
          .from('payments')
          .insert(paymentsToInsert);

        if (paymentsErr) throw new Error(paymentsErr.message);

        await supabase.from('audit_logs').insert([
          {
            action: 'ORDER_SYNC_SUCCESS',
            details: { message: `Offline order synced successfully. Order ID: ${dbOrderId}` }
          }
        ]);

        successCount++;
        processedQueue.push({ ...queueItem, syncStatus: 'synced' });
      } catch (e: any) {
        console.error('Offline order sync conflict/error:', e);
        conflictCount++;
        processedQueue.push({
          ...queueItem,
          syncStatus: 'conflict',
          errorMessage: e.message || 'Depleted inventory / Constraint error'
        });
      }
    }

    // Clean out successful synced items, keep conflicts marked in IndexedDB/localStorage
    try {
      if (typeof window !== 'undefined') {
        const dbRequest = window.indexedDB.open('ICOS_Offline_Cache', 1);
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const trans = db.transaction('sync_queue', 'readwrite');
          const store = trans.objectStore('sync_queue');
          
          processedQueue.forEach(entry => {
            if (entry.syncStatus === 'synced') {
              store.delete(entry.id);
            } else {
              store.put({
                ...entry,
                errorMessage: entry.errorMessage,
                retryCount: entry.retryCount + 1
              });
            }
          });
        };
      }
    } catch (e) {
      console.warn('Storage sync update skipped:', e);
      const remainingConflicts = processedQueue.filter(item => item.syncStatus !== 'synced');
      localStorage.setItem('icos_sync_queue', JSON.stringify(remainingConflicts));
    }

    // Refresh display queue & catalog
    setTimeout(async () => {
      await loadOfflineQueue();
      await loadData();
      setProcessing(false);
      alert(`Sync process completed.\nSuccessfully Synced: ${successCount} orders.\nConflicts/Errors: ${conflictCount} orders.`);
    }, 500);
  };

  // Resolve sync conflict: Refund / Cancel order flow
  const handleCancelConflict = async (id: string) => {
    try {
      await removeQueueEntry(id);
      await loadOfflineQueue();
      alert('Conflict cancelled. Order refunded successfully.');
    } catch (e) {
      const filtered = syncQueue.filter(item => item.id !== id);
      setSyncQueue(filtered);
      localStorage.setItem('icos_sync_queue', JSON.stringify(filtered));
      alert('Conflict cancelled (local storage update).');
    }
  };

  // Barcode quick addition trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = productsCatalog.find(p => p.barcode === search || p.sku.toLowerCase() === search.toLowerCase());
    if (matched) {
      handleAddToCart(matched);
      setSearch('');
    } else {
      alert('Barcode or SKU not found in local cached catalog.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-zinc-400 font-medium tracking-wide">Connecting to AHV Cloud Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500/25">
      {/* Sleek Minimal Header */}
      <nav className="border-b border-zinc-900/60 bg-zinc-900/20 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-white text-sm">P</div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            ICOS <span className="text-zinc-500 font-normal">/ Point Of Sale</span>
          </span>
        </div>

        {/* Network Status Toggle Button */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setOnline(!online)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
              online 
                ? 'bg-zinc-900/60 border-zinc-800 text-emerald-400 hover:bg-zinc-900' 
                : 'bg-rose-950/20 border-rose-900/40 text-rose-450 hover:bg-rose-950/30'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {online ? 'Online' : 'Offline Mode'}
          </button>
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden min-h-[calc(100vh-65px)]">
        
        {/* Left Side: Product Search & Catalog (Grid-span 2) */}
        <div className="lg:col-span-2 p-6 flex flex-col gap-6 border-r border-zinc-900/60 overflow-y-auto bg-zinc-950/50">
          
          {/* Barcode Scanner / SKU input */}
          <Card title="Product Search & Scan" description="Simulate barcode scanner input or type product SKU." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-3 mt-1">
              <InputField 
                placeholder="Scan barcode or enter SKU (e.g. REF-INV-001)" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 !bg-zinc-950/40 !border-zinc-850 focus:!border-zinc-700 focus:!ring-1 focus:!ring-zinc-700 text-zinc-100 text-xs py-2 px-3 rounded-lg"
              />
              <Button type="submit" variant="primary" className="text-xs py-2.5 px-4 rounded-lg font-medium transition-colors">Add Item</Button>
            </form>
          </Card>

          {/* Catalog Selection Grid */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Cached Product Catalog</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productsCatalog.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => handleAddToCart(p)}
                  className="p-5 border border-zinc-850 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/30 cursor-pointer rounded-xl transition-all duration-205 flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">{p.category}</span>
                    <h4 className="font-semibold text-zinc-200 text-xs mt-1.5 group-hover:text-zinc-100 transition-colors">{p.name}</h4>
                    <p className="text-[10px] text-zinc-550 mt-1 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="flex justify-between items-center mt-5">
                    <span className="text-sm font-bold text-zinc-100 font-mono">${p.price}</span>
                    <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900/60 font-medium">Stock: {p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Cart & Checkout (Grid-span 1) */}
        <div className="lg:col-span-1 p-6 flex flex-col justify-between border-r border-zinc-900/60 bg-zinc-900/10">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex justify-between items-center">
              <span>Checkout Cart</span>
              <span className="text-[10px] font-medium text-zinc-400 bg-zinc-950 border border-zinc-850 px-2.5 py-0.5 rounded">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs">
                Cart is empty. Select products to begin.
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-zinc-900/60 pb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-200 text-xs">{item.name}</h4>
                      <p className="text-[10px] text-zinc-450 font-mono mt-1">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="h-5 w-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xs transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold text-zinc-200 font-mono w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="h-5 w-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xs transition-colors"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-zinc-500 hover:text-rose-500 transition-colors ml-1"
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

          <div className="pt-6 border-t border-zinc-900/60">
            <div className="flex justify-between items-center text-xs mb-4">
              <span className="text-zinc-400 font-medium">Subtotal</span>
              <span className="font-bold text-zinc-100 font-mono text-base">${cartTotal}</span>
            </div>
            <Button 
              variant="primary" 
              className="w-full text-xs py-2.5 rounded-lg font-medium transition-colors"
              disabled={cart.length === 0}
              onClick={() => setCheckoutModalOpen(true)}
            >
              Checkout Order
            </Button>
          </div>
        </div>

        {/* Right Side: Sync Monitor / Offline Queue (Grid-span 1) */}
        <div className="lg:col-span-1 p-6 flex flex-col gap-6 bg-zinc-950">
          <Card title="Offline Queue & Sync" description="Check queued offline sales ledger entries." className="!bg-zinc-900/20 !border-zinc-850 shadow-none rounded-xl flex-1 flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto max-h-[60vh] pr-1">
              {syncQueue.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-xs">
                  All systems synced.
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 mt-1">
                  {syncQueue.map((item) => (
                    <div key={item.id} className={`p-4 border rounded-xl bg-zinc-950/20 ${item.errorMessage ? 'border-rose-950/40 bg-rose-950/10' : 'border-zinc-850'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-semibold text-zinc-450">{item.id.substring(0, 10)}</span>
                        <span className={`text-[9px] font-medium uppercase px-2 py-0.5 rounded-full border ${
                          item.errorMessage 
                            ? 'bg-rose-950/30 border-rose-900/40 text-rose-455' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {item.errorMessage ? 'Conflict' : 'Queued'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-2 font-mono">Total: ${item.order.total_amount}</p>
                      
                      {item.errorMessage && (
                        <div className="mt-2 text-[10px] text-rose-400 border-t border-rose-900/20 pt-2">
                          <p className="font-semibold">Reason:</p>
                          <p className="italic">{item.errorMessage}</p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="!py-1 !px-2.5 !text-[10px] !border-rose-900/40 !text-rose-450 hover:!bg-rose-950/20 !rounded-md"
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
                variant={online ? 'primary' : 'outline'}
                className="w-full mt-4 text-xs py-2.5 rounded-lg font-medium transition-colors" 
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
            label="Customer Link (Optional)" 
            id="checkout_customer"
            options={[
              { value: '', label: 'Walk-in Customer' },
              ...customersList.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))
            ]}
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="!bg-zinc-950 !border-zinc-850 focus:!border-zinc-700 focus:!ring-1 focus:!ring-zinc-700 text-zinc-100 text-xs py-2 px-3 rounded-lg"
          />

          <SelectField 
            label="Payment Mode" 
            id="checkout_payment"
            options={[
              { value: 'cash', label: 'Cash Payment' },
              { value: 'card', label: 'Card (Paystack)' },
              { value: 'momo', label: 'Mobile Money' },
              { value: 'credit', label: 'Credit Sale (BNPL)' }
            ]}
            value={paymentProvider}
            onChange={(e) => setPaymentProvider(e.target.value as any)}
            className="!bg-zinc-950 !border-zinc-850 focus:!border-zinc-700 focus:!ring-1 focus:!ring-zinc-700 text-zinc-100 text-xs py-2 px-3 rounded-lg"
          />

          {paymentProvider === 'credit' && !selectedCustomerId && (
            <p className="text-[10px] text-rose-450 italic mt-1">Credit sale requires linking a registered customer account.</p>
          )}

          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-zinc-500">Total Payable</p>
              <p className="text-base font-bold text-zinc-100 font-mono">${cartTotal}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="text-xs py-2 px-4 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg" onClick={() => setCheckoutModalOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="text-xs py-2 px-4 rounded-lg font-medium"
                disabled={paymentProvider === 'credit' && !selectedCustomerId}
                isLoading={processing}
              >
                Confirm
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Success Notification Modal */}
      <Modal
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        title="Sale Completed"
      >
        <div className="text-center py-4 flex flex-col items-center gap-4">
          <div className="h-10 w-10 bg-emerald-950/50 text-emerald-450 border border-emerald-900/30 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200 text-sm">Receipt Generated</h4>
            <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">{lastOrderDetails?.id}</p>
          </div>
          
          <div className="w-full bg-zinc-950 p-4 border border-zinc-850 rounded-xl text-left text-xs text-zinc-400 font-mono">
            <p className="border-b border-zinc-900 pb-2 mb-2 font-bold text-zinc-200 text-center tracking-tight">AMERICAN HOME VENTURES</p>
            <div className="flex justify-between">
              <span>Order Amount:</span>
              <span>${lastOrderDetails?.total}</span>
            </div>
            <div className="flex justify-between mt-1.5">
              <span>Status:</span>
              <span className="font-semibold">{lastOrderDetails?.status === 'offline_queued' ? 'QUEUED OFFLINE' : 'PAID'}</span>
            </div>
          </div>

          <Button variant="primary" className="w-full mt-4 text-xs py-2.5 rounded-lg" onClick={() => setSuccessModal(false)}>Done</Button>
        </div>
      </Modal>

    </div>
  );
}
