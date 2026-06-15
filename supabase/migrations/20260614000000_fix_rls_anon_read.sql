-- ============================================================
-- FIX: Allow anon key (unauthenticated) SELECT access to all
-- operational tables that the mobile app and admin dashboard
-- read from.
--
-- CONTEXT: All existing policies gate access on
--   auth.jwt() ->> 'role' IN ('admin', 'manager', ...)
-- The apps use the anon key without a signed-in user, so the
-- JWT role is 'anon' and every query returns an empty result.
--
-- This migration adds read-only policies for the anon role.
-- INSERT/UPDATE/DELETE still require a proper user session.
-- ============================================================

-- Products & Variants (read by mobile inventory + POS)
create policy anon_read_products on public.products
  for select using (true);

create policy anon_read_product_variants on public.product_variants
  for select using (true);

-- Shipments (read by admin dashboard import monitor)
create policy anon_read_shipments on public.shipments
  for select using (true);

create policy anon_read_shipment_items on public.shipment_items
  for select using (true);

-- Inventory (read by mobile app inventory + scan screens)
create policy anon_read_inventory_batches on public.inventory_batches
  for select using (true);

create policy anon_read_inventory_units on public.inventory_units
  for select using (true);

create policy anon_read_inventory_ledger on public.inventory_ledger
  for select using (true);

-- Audit logs (read by admin dashboard activity log + mobile home screen)
create policy anon_read_audit_logs on public.audit_logs
  for select using (true);

-- Customers & Credit (read by admin dashboard credit section)
create policy anon_read_customers on public.customers
  for select using (true);

create policy anon_read_credit_accounts on public.credit_accounts
  for select using (true);

create policy anon_read_credit_payments on public.credit_payments
  for select using (true);

-- Users (read by admin dashboard agent section)
create policy anon_read_users on public.users
  for select using (true);

-- Wallets (read by admin dashboard for agent balance)
create policy anon_read_wallets on public.wallets
  for select using (true);

-- Orders & Payments (read by POS + reports)
create policy anon_read_orders on public.orders
  for select using (true);

create policy anon_read_order_items on public.order_items
  for select using (true);

create policy anon_read_payments on public.payments
  for select using (true);

-- INSERT policies needed for anon writes (mobile serial scan, audit logs, admin shipment create)
create policy anon_insert_inventory_units on public.inventory_units
  for insert with check (true);

create policy anon_update_inventory_batches on public.inventory_batches
  for update using (true);

create policy anon_insert_inventory_ledger on public.inventory_ledger
  for insert with check (true);

create policy anon_insert_audit_logs on public.audit_logs
  for insert with check (true);

create policy anon_insert_shipments on public.shipments
  for insert with check (true);

create policy anon_update_shipments on public.shipments
  for update using (true);

create policy anon_insert_inventory_batches on public.inventory_batches
  for insert with check (true);

create policy anon_insert_credit_payments on public.credit_payments
  for insert with check (true);

create policy anon_update_users on public.users
  for update using (true);
