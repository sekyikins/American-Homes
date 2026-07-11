/**
 * seed.mjs — American Home Ventures database seeder
 * ─────────────────────────────────────────────────
 * Usage:
 *   node supabase/seed.mjs <SERVICE_ROLE_KEY>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzpwtkywsxqabeeuvcgu.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌  Please pass your service_role key as the first argument.\n');
  console.error('   node supabase/seed.mjs <SERVICE_ROLE_KEY>\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Helper for generating UUIDs
function makeUuid(prefix, index) {
  const pad = (num, size) => ('000000000000' + num).substr(-size);
  return `${prefix}-0000-0000-0000-${pad(index, 12)}`;
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing tables...');

  // Delete all tasks, notifications, alerts, reports
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('discrepancy_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('damage_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('shipment_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete transaction-related data
  await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('wallet_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('withdrawals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('credit_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('credit_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete inventory
  await supabase.from('inventory_units').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('inventory_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('inventory_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('shipment_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('shipments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete catalog
  await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Clean auth users ending with @americanhomeventures.com
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listError) {
    console.error('❌ Error listing auth users:', listError.message);
  } else if (authUsers && authUsers.users) {
    for (const u of authUsers.users) {
      if (u.email && u.email.endsWith('@americanhomeventures.com')) {
        await supabase.auth.admin.deleteUser(u.id);
      }
    }
  }
  console.log('✅ Clean complete.');
}

async function main() {
  await cleanDatabase();

  console.log('🚀 Seeding operational database...');

  // 1. Create Auth Users & Profiles (10 users: 2 admin, 2 inventory, 6 agent)
  const userData = [
    { id: makeUuid('11111111', 1), email: 'marcus@americanhomeventures.com', name: 'Marcus Reynolds', role: 'admin', commission_type: 'flat', commission_rate: 0 },
    { id: makeUuid('11111111', 2), email: 'sandra@americanhomeventures.com', name: 'Sandra Okafor', role: 'admin', commission_type: 'flat', commission_rate: 0 },
    { id: makeUuid('11111111', 3), email: 'james@americanhomeventures.com', name: 'James Cole', role: 'inventory', commission_type: 'flat', commission_rate: 0 },
    { id: makeUuid('11111111', 4), email: 'yao@americanhomeventures.com', name: 'Yao Mensah', role: 'inventory', commission_type: 'flat', commission_rate: 0 },
    { id: makeUuid('11111111', 5), email: 'kwame@americanhomeventures.com', name: 'Kwame Asante', role: 'agent', commission_type: 'percentage', commission_rate: 0.05 },
    { id: makeUuid('11111111', 6), email: 'ama@americanhomeventures.com', name: 'Ama Serwaa', role: 'agent', commission_type: 'percentage', commission_rate: 0.07 },
    { id: makeUuid('11111111', 7), email: 'kofi@americanhomeventures.com', name: 'Kofi Mensah', role: 'agent', commission_type: 'flat', commission_rate: 20.0 },
    { id: makeUuid('11111111', 8), email: 'efua@americanhomeventures.com', name: 'Efua Osei', role: 'agent', commission_type: 'variant_specific', commission_rate: 0 },
    { id: makeUuid('11111111', 9), email: 'yaw@americanhomeventures.com', name: 'Yaw Boateng', role: 'agent', commission_type: 'percentage', commission_rate: 0.04 },
    { id: makeUuid('11111111', 10), email: 'esi@americanhomeventures.com', name: 'Esi Addo', role: 'agent', commission_type: 'flat', commission_rate: 15.0 },
  ];

  for (const u of userData) {
    const { error } = await supabase.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: u.name,
        role: u.role,
        commission_type: u.commission_type,
        commission_rate: u.commission_rate,
      }
    });
    if (error) {
      console.error(`❌ Error creating user ${u.email}:`, error.message);
    } else {
      console.log(`👤 Auth user created: ${u.email}`);
    }
  }

  // 2. Create 20 Customers
  const customerNames = [
    'Marcus Reynolds', 'Sandra Okafor', 'Derek Nguyen', 'Priya Mehta', 'Luis Castellano',
    'Claire Bouchard', 'Anthony Osei', 'Fatima Al-Rashid', 'James Whitfield', 'Yuki Tanaka',
    'Amina Bello', 'Kwesi Arthur', 'John Dumelo', 'Yvonne Nelson', 'Nadia Buari',
    'Sarkodie Owusu', 'Stonebwoy Satekla', 'Efya Awindor', 'Jackie Appiah', 'Majid Michel'
  ];
  const customers = customerNames.map((name, i) => ({
    id: makeUuid('22222222', i + 1),
    name,
    phone: `+1-512-555-01${10 + i}`,
    address: `${100 + i * 5} Congress Ave, Austin, TX 78701`,
  }));
  await supabase.from('customers').insert(customers);
  console.log(`👥 Seeded ${customers.length} Customers`);

  // 3. Create 30 Products (with category, has_serial)
  const productTemplates = [
    { name: 'Samsung 65" 4K QLED TV', category: 'Electronics', has_serial: true },
    { name: 'LG Refrigerator 28 cu ft', category: 'Appliances', has_serial: true },
    { name: 'Whirlpool Washer/Dryer Set', category: 'Appliances', has_serial: true },
    { name: 'Dyson V15 Detect Vacuum', category: 'Electronics', has_serial: true },
    { name: 'Apple MacBook Air M3 13"', category: 'Computers', has_serial: true },
    { name: 'Bamboo Cutting Board Set', category: 'Kitchen', has_serial: false },
    { name: 'Memory Foam Pillow 2-Pack', category: 'Bedding', has_serial: false },
    { name: 'Cast Iron Skillet 12"', category: 'Kitchen', has_serial: false },
    { name: 'LED Smart Bulb 4-Pack', category: 'Lighting', has_serial: false },
    { name: 'Weighted Blanket 15lb', category: 'Bedding', has_serial: false },
    { name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', has_serial: true },
    { name: 'iPad Pro 11-inch M4', category: 'Computers', has_serial: true },
    { name: 'Nespresso Vertuo Next', category: 'Appliances', has_serial: true },
    { name: 'Instant Pot Duo 7-in-1', category: 'Kitchen', has_serial: false },
    { name: 'AirPods Pro 2nd Gen', category: 'Electronics', has_serial: true },
    { name: 'Ergonomic Desk Chair', category: 'Office', has_serial: false },
    { name: 'Electric Standing Desk', category: 'Office', has_serial: false },
    { name: 'Hydro Flask 32oz', category: 'Kitchen', has_serial: false },
    { name: 'Ring Video Doorbell', category: 'Lighting', has_serial: true },
    { name: 'Kindle Paperwhite', category: 'Computers', has_serial: true },
    { name: 'Fitbit Charge 6', category: 'Electronics', has_serial: true },
    { name: 'Roomba i3+ Robot Vacuum', category: 'Appliances', has_serial: true },
    { name: 'Bose SoundLink Flex', category: 'Electronics', has_serial: true },
    { name: 'Pyrex 18-Piece Glass Set', category: 'Kitchen', has_serial: false },
    { name: 'Chef Knife 8-inch', category: 'Kitchen', has_serial: false },
    { name: 'Nonstick Cookware 10-Piece', category: 'Kitchen', has_serial: false },
    { name: 'Blackout Curtains 2-Panel', category: 'Bedding', has_serial: false },
    { name: 'Microfiber Sheets Queen', category: 'Bedding', has_serial: false },
    { name: 'Smart Plug 4-Pack', category: 'Lighting', has_serial: false },
    { name: 'Philips Sonicare ProtectiveClean', category: 'Electronics', has_serial: true },
  ];

  const products = productTemplates.map((p, i) => ({
    id: makeUuid('33333333', i + 1),
    name: p.name,
    category: p.category,
    has_serial: p.has_serial,
    description: `High-quality premium product from ${p.category} department.`,
  }));
  await supabase.from('products').insert(products);
  console.log(`📦 Seeded ${products.length} Products`);

  // Create at least 5 variants for each product
  const variants = [];
  const colors = ['Black', 'Silver', 'White', 'Midnight', 'Space Grey'];
  const sizes = ['Standard', 'Large', 'Pack of 1', 'Pack of 2', 'Pack of 4'];

  products.forEach((p, index) => {
    for (let v = 1; v <= 5; v++) {
      const isElectronicsOrComp = p.category === 'Electronics' || p.category === 'Computers' || p.category === 'Appliances';
      const variantOption = isElectronicsOrComp ? colors[v - 1] : sizes[v - 1];
      const retailPrice = Math.round((10 + index * 40 + v * 15) * 100) / 100;
      const wholesalePrice = Math.round((retailPrice * 0.7) * 100) / 100;
      const commissionAmount = Math.round((retailPrice * 0.05) * 100) / 100;

      variants.push({
        id: makeUuid('44444444', index * 5 + v),
        product_id: p.id,
        variant_name: `${p.name} - ${variantOption}`,
        sku: `AHV-${p.category.slice(0,3).toUpperCase()}-${index + 1}-${v}`,
        barcode: `088727676${1000 + index * 5 + v}`,
        retail_price: retailPrice,
        wholesale_price: wholesalePrice,
        commission_amount: commissionAmount,
      });
    }
  });
  await supabase.from('product_variants').insert(variants);
  console.log(`🏷️ Seeded ${variants.length} Product Variants (5 per product)`);

  // 4. Create 7 Shipments (2 pending, 2 in transit, 3 received)
  const shipments = [
    { id: makeUuid('55555555', 1), shipment_code: 'SHP-2026-001', supplier_country: 'USA', status: 'pending', arrival_date: null, total_cost: 0 },
    { id: makeUuid('55555555', 2), shipment_code: 'SHP-2026-002', supplier_country: 'China', status: 'pending', arrival_date: null, total_cost: 0 },
    { id: makeUuid('55555555', 3), shipment_code: 'SHP-2026-003', supplier_country: 'USA', status: 'in_transit', arrival_date: '2026-07-20', total_cost: 15000 },
    { id: makeUuid('55555555', 4), shipment_code: 'SHP-2026-004', supplier_country: 'Germany', status: 'in_transit', arrival_date: '2026-07-25', total_cost: 25000 },
    { id: makeUuid('55555555', 5), shipment_code: 'SHP-2026-005', supplier_country: 'China', status: 'received', arrival_date: '2026-06-10', total_cost: 45000 },
    { id: makeUuid('55555555', 6), shipment_code: 'SHP-2026-006', supplier_country: 'Netherlands', status: 'received', arrival_date: '2026-06-25', total_cost: 32000 },
    { id: makeUuid('55555555', 7), shipment_code: 'SHP-2026-007', supplier_country: 'Japan', status: 'received', arrival_date: '2026-07-02', total_cost: 18500 },
  ];
  await supabase.from('shipments').insert(shipments);
  console.log(`🚢 Seeded ${shipments.length} Shipments`);

  // Create Shipment Items
  const shipmentItems = [];
  let itemCounter = 1;
  // Link each shipment to a few products
  shipments.forEach((shp, sIdx) => {
    // Each shipment gets 3-4 products
    for (let pIdx = 0; pIdx < 3; pIdx++) {
      const prodIndex = (sIdx * 3 + pIdx) % products.length;
      shipmentItems.push({
        id: makeUuid('55555556', itemCounter++),
        shipment_id: shp.id,
        product_id: products[prodIndex].id,
        quantity: 20 + pIdx * 10,
        cost_price: 30 + prodIndex * 20,
      });
    }
  });
  await supabase.from('shipment_items').insert(shipmentItems);
  console.log(`📦 Seeded ${shipmentItems.length} Shipment Items`);

  // 5. Inventory Batches (for the 3 received shipments + some adjustments)
  const batches = [];
  const receivedShipments = shipments.filter(s => s.status === 'received');
  let batchCounter = 1;

  receivedShipments.forEach((shp, sIdx) => {
    const items = shipmentItems.filter(item => item.shipment_id === shp.id);
    items.forEach((item, iIdx) => {
      batches.push({
        id: makeUuid('66666666', batchCounter),
        product_id: item.product_id,
        shipment_id: shp.id,
        quantity_received: item.quantity,
        remaining_quantity: item.quantity,
        cost_price: item.cost_price,
        created_at: new Date(`2026-06-${10 + sIdx * 5}`).toISOString(),
      });
      batchCounter++;
    });
  });

  // Add 3 non-shipment batches for general adjustments
  for (let adj = 1; adj <= 3; adj++) {
    batches.push({
      id: makeUuid('66666666', batchCounter),
      product_id: products[adj].id,
      shipment_id: null,
      quantity_received: 50,
      remaining_quantity: 42,
      cost_price: 25 + adj * 15,
      created_at: new Date().toISOString(),
    });
    batchCounter++;
  }
  await supabase.from('inventory_batches').insert(batches);
  console.log(`🏷️ Seeded ${batches.length} Inventory Batches`);

  // 6. Inventory Units (for serialized items in batches)
  const units = [];
  let unitCounter = 1;
  for (const b of batches) {
    const prod = products.find(p => p.id === b.product_id);
    if (prod && prod.has_serial) {
      // Create serial units for remaining quantity
      for (let u = 1; u <= b.remaining_quantity; u++) {
        units.push({
          id: makeUuid('77777777', unitCounter),
          batch_id: b.id,
          serial_number: `SN-${prod.category.slice(0,3).toUpperCase()}-${b.id.slice(0,4)}-${u}`,
          status: 'available',
        });
        unitCounter++;
      }
    }
  }
  await supabase.from('inventory_units').insert(units);
  console.log(`🧮 Seeded ${units.length} Serialized Inventory Units`);

  // 7. Inventory Ledger
  const ledgerEntries = batches.map((b, i) => ({
    id: makeUuid('88888888', i + 1),
    product_id: b.product_id,
    batch_id: b.id,
    type: 'IN',
    quantity: b.quantity_received,
    reference_id: b.shipment_id || 'Initial Adjustment',
  }));
  await supabase.from('inventory_ledger').insert(ledgerEntries);
  console.log(`📒 Seeded ${ledgerEntries.length} Inventory Ledger rows`);

  // 8. Create 20 Orders shared among payment methods
  const orders = [];
  const orderItems = [];
  const payments = [];
  const providers = ['cash', 'paystack', 'momo', 'credit'];
  const paymentStatuses = {
    cash: 'paid',
    paystack: 'paid',
    momo: 'paid',
    credit: 'credit',
  };

  // We need to fetch wallets to correctly pay commissions, but triggers will auto-calculate it.
  // Wait, let's look at the database order processing logic.
  // The database triggers process_order_item_stock() and process_order_commission() will run.
  // Wait, to prevent order_items trigger from throwing "insufficient stock" or failing because
  // it expects batches to have enough remaining_quantity, we should order from the batches we just created!
  // Let's match each order to a specific variant, product, and batch.

  for (let o = 1; o <= 20; o++) {
    const customer = customers[(o - 1) % customers.length];
    const provider = providers[o % providers.length];
    const status = paymentStatuses[provider];
    
    // Choose a batch with remaining quantity
    const batch = batches[o % batches.length];
    const product = products.find(p => p.id === batch.product_id);
    const variant = variants.find(v => v.product_id === product.id);

    const orderId = makeUuid('99999999', o);
    const createdBy = userData[4 + (o % 6)].id; // Assign to one of the 6 agents

    orders.push({
      id: orderId,
      customer_id: customer.id,
      total_amount: variant.retail_price * 2,
      payment_status: status,
      created_by: createdBy,
      created_at: new Date(`2026-06-${15 + (o % 10)}T12:00:00Z`).toISOString(),
    });

    // Check if the product has serial
    let unitId = null;
    if (product.has_serial) {
      // Find a unit for this batch
      const unit = units.find(u => u.batch_id === batch.id && u.status === 'available');
      if (unit) {
        unitId = unit.id;
        unit.status = 'sold'; // Update local state so we don't double sell
      }
    }

    orderItems.push({
      id: makeUuid('99999990', o),
      order_id: orderId,
      product_id: product.id,
      quantity: 2,
      unit_price: variant.retail_price,
      batch_id: batch.id,
      unit_id: unitId,
    });

    if (provider !== 'credit') {
      payments.push({
        id: makeUuid('99999980', o),
        order_id: orderId,
        provider: provider,
        amount: variant.retail_price * 2,
        reference: provider === 'cash' ? null : `REF-${provider.toUpperCase()}-${o}`,
        status: 'completed',
      });
    }
  }

  // Insert Orders
  await supabase.from('orders').insert(orders);
  // Insert Order Items (Triggers process_order_item_stock() and reduces remaining_quantity)
  // Wait, let's insert them and let triggers do their work.
  // Wait! If the triggers execute, they will modify remaining_quantity in the DB.
  // Let's do it safely.
  await supabase.from('order_items').insert(orderItems);
  await supabase.from('payments').insert(payments);

  console.log(`🛒 Seeded 20 Orders, Order Items, and Payments`);

  // 9. Wallet Transactions
  // When agents are created, the trigger on_public_user_created automatically creates their wallets with balance 0.
  // When order items are inserted, order_paid trigger may run or orders are updated.
  // Let's double check if we can fetch all wallets to insert some direct salary/commission transactions.
  const { data: wallets } = await supabase.from('wallets').select('*');
  if (wallets && wallets.length > 0) {
    const walletTransactions = [];
    const withdrawals = [];
    
    wallets.forEach((w, wIdx) => {
      // Add direct salary deposit
      walletTransactions.push({
        wallet_id: w.id,
        amount: 2000,
        type: 'credit',
        reason: 'Monthly operational base salary',
      });

      // Add a commission credit
      walletTransactions.push({
        wallet_id: w.id,
        amount: 150.50,
        type: 'credit',
        reason: 'Referral commission bonus',
      });

      // Add a withdrawal transaction
      walletTransactions.push({
        wallet_id: w.id,
        amount: -500,
        type: 'debit',
        reason: 'Momo Withdrawal Out',
      });

      // Add actual withdrawal requests
      withdrawals.push({
        user_id: w.user_id,
        amount: 500,
        network: 'MTN Mobile Money',
        phone: '+1-512-555-0999',
        status: wIdx % 3 === 0 ? 'pending' : (wIdx % 3 === 1 ? 'completed' : 'failed'),
      });
    });

    await supabase.from('wallet_transactions').insert(walletTransactions);
    await supabase.from('withdrawals').insert(withdrawals);
    console.log(`💳 Seeded Wallet Transactions and Withdrawals`);
  }

  // 10. 10 Tasks for each staff (10 staff members * 10 tasks = 100 tasks)
  const taskPriorities = ['low', 'medium', 'high'];
  const taskStatuses = ['pending', 'completed'];
  const tasks = [];
  let taskIdx = 1;
  for (const u of userData) {
    for (let t = 1; t <= 10; t++) {
      tasks.push({
        id: makeUuid('aaaaaa00', taskIdx),
        assigned_to: u.id,
        title: `Reconcile dispatch task #${t} for ${u.name}`,
        description: `Operational task description for assignment cycle ${t}. Please verify batch items and serial log records.`,
        priority: taskPriorities[t % 3],
        status: taskStatuses[t % 2],
        due_date: new Date(`2026-07-${10 + t}`).toISOString().split('T')[0],
      });
      taskIdx++;
    }
  }
  await supabase.from('tasks').insert(tasks);
  console.log(`📋 Seeded ${tasks.length} Staff Tasks`);

  // 11. 5 Notifications & 5 Alerts
  const notifications = Array.from({ length: 5 }).map((_, i) => ({
    id: makeUuid('bbbbbb00', i + 1),
    user_id: userData[4 + i].id, // Seed to different agents
    title: `Notification Alert ${i + 1}`,
    body: `This is a test notification alert body for operational event trigger #${i + 1}.`,
    category: ['inventory', 'orders', 'shipments', 'general'][i % 4],
    read: i % 2 === 0,
  }));
  await supabase.from('notifications').insert(notifications);

  const alerts = Array.from({ length: 5 }).map((_, i) => ({
    id: makeUuid('cccccc00', i + 1),
    title: `Critical Alert: ${['Stock Low', 'Out of stock', 'Credit limit', 'ETA update'][i % 4]}`,
    body: `System warning body message for critical event indicator log #${i + 1}.`,
    category: ['inventory_low', 'inventory_out', 'credit', 'shipment'][i % 4],
    read: false,
  }));
  await supabase.from('alerts').insert(alerts);
  console.log(`🔔 Seeded Notifications and System Alerts`);

  // 12. 10 Reports each (discrepancy, damage, shipment)
  const discrepancyReports = Array.from({ length: 10 }).map((_, i) => ({
    id: makeUuid('dddddd00', i + 1),
    product_id: products[i % products.length].id,
    reported_by: userData[2 + (i % 2)].id, // Reported by warehouse ops
    expected_qty: 50,
    actual_qty: 48,
    notes: `Cycle count mismatch on item ${i + 1}. Found physical deficiency in batch shelf.`,
  }));
  await supabase.from('discrepancy_reports').insert(discrepancyReports);

  const damageReports = Array.from({ length: 10 }).map((_, i) => ({
    id: makeUuid('eeeeee00', i + 1),
    product_id: products[(i + 2) % products.length].id,
    reported_by: userData[2 + (i % 2)].id,
    serial_number: `SN-DMG-00${i + 1}`,
    severity: ['Low', 'Medium', 'High'][i % 3],
    description: `Package dropped or damaged during physical transit sorting cycle #${i + 1}.`,
  }));
  await supabase.from('damage_reports').insert(damageReports);

  const shipmentReports = Array.from({ length: 10 }).map((_, i) => ({
    id: makeUuid('ffffff00', i + 1),
    shipment_id: shipments[i % shipments.length].id,
    reported_by: userData[2 + (i % 2)].id,
    issue_type: ['Delay', 'Broken Box', 'Customs Check', 'Wrong Item Count'][i % 4],
    description: `Operational log issue reported for shipment identifier logistics flow sequence #${i + 1}.`,
  }));
  await supabase.from('shipment_reports').insert(shipmentReports);

  console.log(`📄 Seeded 10 Discrepancy, 10 Damage, and 10 Shipment Reports`);

  // 13. Seed Expenses (10 rows)
  const expenses = Array.from({ length: 10 }).map((_, i) => ({
    id: makeUuid('11112222', i + 1),
    title: `Rent / Utilities / Operational charge #${i + 1}`,
    amount: 1500 + i * 200,
    category: ['Logistics', 'Facility', 'Payroll', 'Equipment'][i % 4],
    created_at: new Date().toISOString(),
  }));
  await supabase.from('expenses').insert(expenses);
  console.log(`💸 Seeded Expenses`);

  console.log('\n✨ Database seed complete!\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
