/**
 * seed.mjs — American Home Ventures database seeder
 * ─────────────────────────────────────────────────
 * Usage:
 *   node supabase/seed.mjs <SERVICE_ROLE_KEY>
 *
 * The SERVICE_ROLE_KEY can be found in your Supabase project dashboard:
 *   Settings → API → Project API keys → service_role (secret)
 *
 * This script uses the service role key so that RLS is bypassed for the insert.
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

// ─── helpers ───────────────────────────────────────────────────────────────

async function insert(table, rows, label) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  if (error) {
    console.error(`  ❌  ${label}:`, error.message);
  } else {
    console.log(`  ✅  ${label} (${rows.length} rows)`);
  }
}

async function insertNoId(table, rows, label) {
  // For tables without a fixed-id seed (ledger, payments, expenses)
  // we check row count first to avoid duplication on re-runs.
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log(`  ⏭   ${label} — already seeded (${count} rows), skipping`);
    return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`  ❌  ${label}:`, error.message);
  } else {
    console.log(`  ✅  ${label} (${rows.length} rows)`);
  }
}

// ─── data ──────────────────────────────────────────────────────────────────

const customers = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'Marcus Reynolds',  phone: '+1-512-555-0101', address: '402 Lavaca St, Austin, TX 78701' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Sandra Okafor',    phone: '+1-512-555-0102', address: '815 Congress Ave, Austin, TX 78701' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Derek Nguyen',     phone: '+1-512-555-0103', address: '1200 Barton Springs Rd, Austin, TX 78704' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'Priya Mehta',      phone: '+1-512-555-0104', address: '300 W 6th St, Austin, TX 78701' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'Luis Castellano',  phone: '+1-512-555-0105', address: '950 E 11th St, Austin, TX 78702' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Claire Bouchard',  phone: '+1-512-555-0106', address: '2301 S Lamar Blvd, Austin, TX 78704' },
  { id: '11111111-0000-0000-0000-000000000007', name: 'Anthony Osei',     phone: '+1-512-555-0107', address: '6000 Middle Fiskville Rd, Austin, TX 78752' },
  { id: '11111111-0000-0000-0000-000000000008', name: 'Fatima Al-Rashid', phone: '+1-512-555-0108', address: '5501 Airport Blvd, Austin, TX 78751' },
  { id: '11111111-0000-0000-0000-000000000009', name: 'James Whitfield',  phone: '+1-512-555-0109', address: '7901 Cameron Rd, Austin, TX 78754' },
  { id: '11111111-0000-0000-0000-000000000010', name: 'Yuki Tanaka',      phone: '+1-512-555-0110', address: '11501 Domain Dr, Austin, TX 78758' },
];

const products = [
  { id: '22222222-0000-0000-0000-000000000001', name: 'Samsung 65" 4K QLED TV',    category: 'Electronics', has_serial: true,  description: 'Samsung QN65QN90B Neo QLED 4K Smart TV' },
  { id: '22222222-0000-0000-0000-000000000002', name: 'LG Refrigerator 28 cu ft',   category: 'Appliances',  has_serial: true,  description: 'LG LRMVS3006S French Door Refrigerator' },
  { id: '22222222-0000-0000-0000-000000000003', name: 'Whirlpool Washer/Dryer Set', category: 'Appliances',  has_serial: true,  description: 'Whirlpool WFW5000HW 4.5 Cu Ft front load washer and dryer combo' },
  { id: '22222222-0000-0000-0000-000000000004', name: 'Dyson V15 Detect Vacuum',    category: 'Electronics', has_serial: true,  description: 'Dyson V15 Detect Absolute cordless vacuum' },
  { id: '22222222-0000-0000-0000-000000000005', name: 'Apple MacBook Air M3 13"',   category: 'Computers',   has_serial: true,  description: 'Apple MacBook Air with M3 chip, 8GB unified memory' },
  { id: '22222222-0000-0000-0000-000000000006', name: 'Bamboo Cutting Board Set',   category: 'Kitchen',     has_serial: false, description: 'Premium 3-piece bamboo cutting board set' },
  { id: '22222222-0000-0000-0000-000000000007', name: 'Memory Foam Pillow',         category: 'Bedding',     has_serial: false, description: 'Queen size cooling gel memory foam pillow, 2-pack' },
  { id: '22222222-0000-0000-0000-000000000008', name: 'Cast Iron Skillet 12"',      category: 'Kitchen',     has_serial: false, description: 'Pre-seasoned Lodge cast iron skillet, 12 inch' },
  { id: '22222222-0000-0000-0000-000000000009', name: 'LED Smart Bulb 4-Pack',      category: 'Lighting',    has_serial: false, description: 'Govee RGBIC Smart Bulbs, 60W equivalent' },
  { id: '22222222-0000-0000-0000-000000000010', name: 'Weighted Blanket 15lb',      category: 'Bedding',     has_serial: false, description: 'YnM 15lb weighted blanket, 60x80 inches' },
];

const variants = [
  { id: '33333333-0000-0000-0000-000000000001', product_id: '22222222-0000-0000-0000-000000000001', variant_name: '65" QLED - Black',       sku: 'SAMS-TV-65-BLK',  barcode: '0887276766669', retail_price: 1299.99, wholesale_price: 890.00,  commission_amount: 45.00 },
  { id: '33333333-0000-0000-0000-000000000002', product_id: '22222222-0000-0000-0000-000000000002', variant_name: '28 cu ft - Steel',        sku: 'LG-FRG-28-STL',   barcode: '0048231781234', retail_price: 1899.99, wholesale_price: 1350.00, commission_amount: 60.00 },
  { id: '33333333-0000-0000-0000-000000000003', product_id: '22222222-0000-0000-0000-000000000003', variant_name: 'Washer+Dryer Set',        sku: 'WHP-WD-SET-WHT',  barcode: '0883049486312', retail_price: 1599.99, wholesale_price: 1100.00, commission_amount: 55.00 },
  { id: '33333333-0000-0000-0000-000000000004', product_id: '22222222-0000-0000-0000-000000000004', variant_name: 'V15 Detect - Gold',       sku: 'DYS-V15-GOLD',    barcode: '0885609024783', retail_price:  749.99, wholesale_price:  520.00, commission_amount: 25.00 },
  { id: '33333333-0000-0000-0000-000000000005', product_id: '22222222-0000-0000-0000-000000000005', variant_name: 'M3 8GB/256GB - Midnight', sku: 'APL-MBA-M3-256-MN',barcode: '0194253767572', retail_price: 1099.99, wholesale_price:  850.00, commission_amount: 35.00 },
  { id: '33333333-0000-0000-0000-000000000006', product_id: '22222222-0000-0000-0000-000000000005', variant_name: 'M3 16GB/512GB - Silver',  sku: 'APL-MBA-M3-512-SL',barcode: '0194253767589', retail_price: 1499.99, wholesale_price: 1180.00, commission_amount: 50.00 },
  { id: '33333333-0000-0000-0000-000000000007', product_id: '22222222-0000-0000-0000-000000000006', variant_name: '3-Piece Set - Natural',   sku: 'KIT-CB-3PC-NAT',  barcode: '0763720249841', retail_price:   34.99, wholesale_price:   18.00, commission_amount:  0.00 },
  { id: '33333333-0000-0000-0000-000000000008', product_id: '22222222-0000-0000-0000-000000000007', variant_name: 'Queen - White 2-Pack',    sku: 'BED-MFP-QN-WHT',  barcode: '0840018400012', retail_price:   59.99, wholesale_price:   32.00, commission_amount:  0.00 },
  { id: '33333333-0000-0000-0000-000000000009', product_id: '22222222-0000-0000-0000-000000000008', variant_name: '12" - Black Seasoned',    sku: 'KIT-CI-12-BLK',   barcode: '0078742064482', retail_price:   44.99, wholesale_price:   24.00, commission_amount:  0.00 },
  { id: '33333333-0000-0000-0000-000000000010', product_id: '22222222-0000-0000-0000-000000000009', variant_name: 'A19 RGBIC 4-Pack',        sku: 'LIT-LED-4PK-RGB', barcode: '0840095800142', retail_price:   39.99, wholesale_price:   20.00, commission_amount:  0.00 },
  { id: '33333333-0000-0000-0000-000000000011', product_id: '22222222-0000-0000-0000-000000000010', variant_name: '15lb 60x80 - Dark Grey',  sku: 'BED-WB-15-GRY',   barcode: '0760158400012', retail_price:   69.99, wholesale_price:   38.00, commission_amount:  0.00 },
];

const shipments = [
  { id: '44444444-0000-0000-0000-000000000001', shipment_code: 'SHP-2025-001', supplier_country: 'USA', status: 'received',   arrival_date: '2025-11-12', total_cost: 28500.00 },
  { id: '44444444-0000-0000-0000-000000000002', shipment_code: 'SHP-2025-002', supplier_country: 'USA', status: 'received',   arrival_date: '2025-12-03', total_cost: 15200.00 },
  { id: '44444444-0000-0000-0000-000000000003', shipment_code: 'SHP-2026-001', supplier_country: 'USA', status: 'received',   arrival_date: '2026-01-15', total_cost: 34800.00 },
  { id: '44444444-0000-0000-0000-000000000004', shipment_code: 'SHP-2026-002', supplier_country: 'USA', status: 'in_transit', arrival_date: null,         total_cost: 18000.00 },
];

const batches = [
  { id: '55555555-0000-0000-0000-000000000001', product_id: '22222222-0000-0000-0000-000000000001', shipment_id: '44444444-0000-0000-0000-000000000001', quantity_received:   8, remaining_quantity:  6, cost_price:  890.00 },
  { id: '55555555-0000-0000-0000-000000000002', product_id: '22222222-0000-0000-0000-000000000002', shipment_id: '44444444-0000-0000-0000-000000000001', quantity_received:   5, remaining_quantity:  4, cost_price: 1350.00 },
  { id: '55555555-0000-0000-0000-000000000003', product_id: '22222222-0000-0000-0000-000000000003', shipment_id: '44444444-0000-0000-0000-000000000002', quantity_received:   6, remaining_quantity:  5, cost_price: 1100.00 },
  { id: '55555555-0000-0000-0000-000000000004', product_id: '22222222-0000-0000-0000-000000000004', shipment_id: '44444444-0000-0000-0000-000000000002', quantity_received:  10, remaining_quantity:  8, cost_price:  520.00 },
  { id: '55555555-0000-0000-0000-000000000005', product_id: '22222222-0000-0000-0000-000000000005', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received:  12, remaining_quantity: 10, cost_price:  850.00 },
  { id: '55555555-0000-0000-0000-000000000006', product_id: '22222222-0000-0000-0000-000000000006', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received:  80, remaining_quantity: 72, cost_price:   18.00 },
  { id: '55555555-0000-0000-0000-000000000007', product_id: '22222222-0000-0000-0000-000000000007', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received:  60, remaining_quantity: 55, cost_price:   32.00 },
  { id: '55555555-0000-0000-0000-000000000008', product_id: '22222222-0000-0000-0000-000000000008', shipment_id: '44444444-0000-0000-0000-000000000001', quantity_received:  40, remaining_quantity: 33, cost_price:   24.00 },
  { id: '55555555-0000-0000-0000-000000000009', product_id: '22222222-0000-0000-0000-000000000009', shipment_id: '44444444-0000-0000-0000-000000000002', quantity_received: 100, remaining_quantity: 88, cost_price:   20.00 },
  { id: '55555555-0000-0000-0000-000000000010', product_id: '22222222-0000-0000-0000-000000000010', shipment_id: '44444444-0000-0000-0000-000000000003', quantity_received:  50, remaining_quantity: 44, cost_price:   38.00 },
];

const units = [
  // Samsung TVs — batch 1
  { id: '66666666-0000-0000-0000-000000000001', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-001', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000002', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-002', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000003', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-003', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000004', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-004', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000005', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-005', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000006', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-006', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000007', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-007', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000008', batch_id: '55555555-0000-0000-0000-000000000001', serial_number: 'SAM-TV-2025-008', status: 'available' },
  // LG Fridge — batch 2
  { id: '66666666-0000-0000-0000-000000000009', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-001', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000010', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-002', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000011', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-003', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000012', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-004', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000013', batch_id: '55555555-0000-0000-0000-000000000002', serial_number: 'LG-FRG-2025-005', status: 'available' },
  // Whirlpool — batch 3
  { id: '66666666-0000-0000-0000-000000000014', batch_id: '55555555-0000-0000-0000-000000000003', serial_number: 'WHP-WD-2025-001', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000015', batch_id: '55555555-0000-0000-0000-000000000003', serial_number: 'WHP-WD-2025-002', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000016', batch_id: '55555555-0000-0000-0000-000000000003', serial_number: 'WHP-WD-2025-003', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000017', batch_id: '55555555-0000-0000-0000-000000000003', serial_number: 'WHP-WD-2025-004', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000018', batch_id: '55555555-0000-0000-0000-000000000003', serial_number: 'WHP-WD-2025-005', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000019', batch_id: '55555555-0000-0000-0000-000000000003', serial_number: 'WHP-WD-2025-006', status: 'available' },
  // Dyson — batch 4
  { id: '66666666-0000-0000-0000-000000000020', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-001', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000021', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-002', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000022', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-003', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000023', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-004', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000024', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-005', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000025', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-006', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000026', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-007', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000027', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-008', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000028', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-009', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000029', batch_id: '55555555-0000-0000-0000-000000000004', serial_number: 'DYS-V15-2025-010', status: 'available' },
  // MacBook — batch 5
  { id: '66666666-0000-0000-0000-000000000030', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-001', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000031', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-002', status: 'sold' },
  { id: '66666666-0000-0000-0000-000000000032', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-003', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000033', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-004', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000034', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-005', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000035', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-006', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000036', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-007', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000037', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-008', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000038', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-009', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000039', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-010', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000040', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-011', status: 'available' },
  { id: '66666666-0000-0000-0000-000000000041', batch_id: '55555555-0000-0000-0000-000000000005', serial_number: 'APL-MBA-2026-012', status: 'available' },
];

const ledgerEntries = [
  { product_id: '22222222-0000-0000-0000-000000000001', batch_id: '55555555-0000-0000-0000-000000000001', type: 'IN', quantity: 8,   reference_id: 'SHP-2025-001' },
  { product_id: '22222222-0000-0000-0000-000000000002', batch_id: '55555555-0000-0000-0000-000000000002', type: 'IN', quantity: 5,   reference_id: 'SHP-2025-001' },
  { product_id: '22222222-0000-0000-0000-000000000003', batch_id: '55555555-0000-0000-0000-000000000003', type: 'IN', quantity: 6,   reference_id: 'SHP-2025-002' },
  { product_id: '22222222-0000-0000-0000-000000000004', batch_id: '55555555-0000-0000-0000-000000000004', type: 'IN', quantity: 10,  reference_id: 'SHP-2025-002' },
  { product_id: '22222222-0000-0000-0000-000000000005', batch_id: '55555555-0000-0000-0000-000000000005', type: 'IN', quantity: 12,  reference_id: 'SHP-2026-001' },
  { product_id: '22222222-0000-0000-0000-000000000006', batch_id: '55555555-0000-0000-0000-000000000006', type: 'IN', quantity: 80,  reference_id: 'SHP-2026-001' },
  { product_id: '22222222-0000-0000-0000-000000000007', batch_id: '55555555-0000-0000-0000-000000000007', type: 'IN', quantity: 60,  reference_id: 'SHP-2026-001' },
  { product_id: '22222222-0000-0000-0000-000000000008', batch_id: '55555555-0000-0000-0000-000000000008', type: 'IN', quantity: 40,  reference_id: 'SHP-2025-001' },
  { product_id: '22222222-0000-0000-0000-000000000009', batch_id: '55555555-0000-0000-0000-000000000009', type: 'IN', quantity: 100, reference_id: 'SHP-2025-002' },
  { product_id: '22222222-0000-0000-0000-000000000010', batch_id: '55555555-0000-0000-0000-000000000010', type: 'IN', quantity: 50,  reference_id: 'SHP-2026-001' },
];

const orders = [
  { id: '77777777-0000-0000-0000-000000000001', customer_id: '11111111-0000-0000-0000-000000000001', total_amount: 1299.99, payment_status: 'paid',    created_at: '2025-11-20T09:15:00Z' },
  { id: '77777777-0000-0000-0000-000000000002', customer_id: '11111111-0000-0000-0000-000000000002', total_amount: 1899.99, payment_status: 'paid',    created_at: '2025-11-22T14:30:00Z' },
  { id: '77777777-0000-0000-0000-000000000003', customer_id: '11111111-0000-0000-0000-000000000003', total_amount: 1599.99, payment_status: 'partial', created_at: '2025-12-05T11:00:00Z' },
  { id: '77777777-0000-0000-0000-000000000004', customer_id: '11111111-0000-0000-0000-000000000004', total_amount:  749.99, payment_status: 'paid',    created_at: '2025-12-10T16:45:00Z' },
  { id: '77777777-0000-0000-0000-000000000005', customer_id: '11111111-0000-0000-0000-000000000005', total_amount: 1099.99, payment_status: 'credit',  created_at: '2026-01-18T10:00:00Z' },
  { id: '77777777-0000-0000-0000-000000000006', customer_id: '11111111-0000-0000-0000-000000000006', total_amount: 1299.99, payment_status: 'paid',    created_at: '2026-01-22T13:20:00Z' },
  { id: '77777777-0000-0000-0000-000000000007', customer_id: '11111111-0000-0000-0000-000000000007', total_amount:  189.97, payment_status: 'paid',    created_at: '2026-02-03T09:45:00Z' },
  { id: '77777777-0000-0000-0000-000000000008', customer_id: '11111111-0000-0000-0000-000000000008', total_amount:   59.99, payment_status: 'paid',    created_at: '2026-02-14T15:30:00Z' },
  { id: '77777777-0000-0000-0000-000000000009', customer_id: '11111111-0000-0000-0000-000000000009', total_amount:  214.97, payment_status: 'paid',    created_at: '2026-03-01T11:00:00Z' },
  { id: '77777777-0000-0000-0000-000000000010', customer_id: '11111111-0000-0000-0000-000000000010', total_amount: 1899.99, payment_status: 'paid',    created_at: '2026-03-12T14:15:00Z' },
];

const payments = [
  { order_id: '77777777-0000-0000-0000-000000000001', provider: 'cash',     amount: 1299.99, reference: null,             status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000002', provider: 'paystack', amount: 1899.99, reference: 'PST-1122334455', status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000003', provider: 'cash',     amount:  800.00, reference: null,             status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000004', provider: 'momo',     amount:  749.99, reference: 'MOMO-99887766',  status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000006', provider: 'paystack', amount: 1299.99, reference: 'PST-5566778899', status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000007', provider: 'cash',     amount:  189.97, reference: null,             status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000008', provider: 'cash',     amount:   59.99, reference: null,             status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000009', provider: 'momo',     amount:  214.97, reference: 'MOMO-44556677',  status: 'completed' },
  { order_id: '77777777-0000-0000-0000-000000000010', provider: 'paystack', amount: 1899.99, reference: 'PST-1234567890', status: 'completed' },
];

const expenses = [
  { title: 'Austin Hub A — Monthly Rent',          amount: 3200.00, category: 'Facility',   created_at: '2026-01-01T00:00:00Z' },
  { title: 'Warehouse Staff Payroll — Jan',         amount: 5500.00, category: 'Payroll',    created_at: '2026-01-31T00:00:00Z' },
  { title: 'Freight & Shipping — SHP-2026-001',     amount:  980.00, category: 'Logistics',  created_at: '2026-01-16T00:00:00Z' },
  { title: 'Barcode Scanner Maintenance',           amount:  150.00, category: 'Equipment',  created_at: '2026-02-05T00:00:00Z' },
  { title: 'Office Supplies & Packaging',           amount:  220.00, category: 'Operations', created_at: '2026-02-10T00:00:00Z' },
  { title: 'Austin Hub A — Monthly Rent',           amount: 3200.00, category: 'Facility',   created_at: '2026-02-01T00:00:00Z' },
  { title: 'Warehouse Staff Payroll — Feb',         amount: 5500.00, category: 'Payroll',    created_at: '2026-02-28T00:00:00Z' },
  { title: 'Vehicle Fuel & Delivery Costs',         amount:  410.00, category: 'Logistics',  created_at: '2026-02-20T00:00:00Z' },
  { title: 'Austin Hub A — Monthly Rent',           amount: 3200.00, category: 'Facility',   created_at: '2026-03-01T00:00:00Z' },
  { title: 'Warehouse Staff Payroll — Mar',         amount: 5500.00, category: 'Payroll',    created_at: '2026-03-31T00:00:00Z' },
];

// ─── run ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  American Home Ventures — Database Seed\n');

  await insert('customers',         customers,    'Customers');
  await insert('products',          products,     'Products');
  await insert('product_variants',  variants,     'Product Variants');
  await insert('shipments',         shipments,    'Shipments');
  await insert('inventory_batches', batches,      'Inventory Batches');
  await insert('inventory_units',   units,        'Inventory Units');
  await insertNoId('inventory_ledger', ledgerEntries, 'Inventory Ledger');
  await insert('orders',            orders,       'Orders');
  await insertNoId('payments',      payments,     'Payments');
  await insertNoId('expenses',      expenses,     'Expenses');

  console.log('\n✨  Seed complete!\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
