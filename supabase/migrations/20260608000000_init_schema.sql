-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. USERS & ROLES
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  email text,
  role text default 'customer' check (role in ('admin', 'manager', 'cashier', 'inventory', 'agent', 'customer')),
  commission_type text default 'percentage' check (commission_type in ('percentage', 'flat', 'variant_specific')),
  commission_rate numeric default 0.0, -- e.g. 0.05 for 5%, or 10.00 for flat $10
  created_at timestamp with time zone default now()
);

-- Trigger to automatically create a public.users entry when an auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, phone, email, role, commission_type, commission_rate)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'commission_type', 'percentage'),
    coalesce((new.raw_user_meta_data->>'commission_rate')::numeric, 0.0)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CUSTOMERS
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique,
  address text,
  created_at timestamp with time zone default now()
);


-- 3. PRODUCTS & VARIANTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  has_serial boolean default false,
  description text,
  created_at timestamp with time zone default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_name text not null,
  sku text unique not null,
  barcode text unique,
  retail_price numeric not null check (retail_price >= 0),
  wholesale_price numeric not null check (wholesale_price >= 0),
  commission_amount numeric default 0.0 check (commission_amount >= 0), -- variant-specific commission
  created_at timestamp with time zone default now()
);


-- 4. SHIPMENTS (IMPORT FLOW)
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_code text unique not null,
  supplier_country text default 'USA',
  status text default 'pending' check (status in ('pending', 'in_transit', 'received')),
  arrival_date date,
  total_cost numeric default 0 check (total_cost >= 0),
  created_at timestamp with time zone default now()
);

create table public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  cost_price numeric not null check (cost_price >= 0)
);


-- 5. INVENTORY BATCHES & UNITS
create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  quantity_received int not null check (quantity_received >= 0),
  remaining_quantity int not null check (remaining_quantity >= 0),
  cost_price numeric not null check (cost_price >= 0),
  created_at timestamp with time zone default now(),
  constraint check_remaining check (remaining_quantity <= quantity_received)
);

create table public.inventory_units (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.inventory_batches(id) on delete cascade,
  serial_number text unique not null,
  status text default 'available' check (status in ('available', 'sold', 'damaged')),
  updated_at timestamp with time zone default now()
);


-- 6. INVENTORY LEDGER (SOURCE OF TRUTH)
create table public.inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  batch_id uuid references public.inventory_batches(id) on delete set null,
  type text not null check (type in ('IN', 'OUT', 'ADJUSTMENT')),
  quantity int not null, -- positive for IN, negative for OUT
  reference_id text, -- order_id, shipment_id, etc.
  created_at timestamp with time zone default now()
);


-- 7. ORDERS & ITEMS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  total_amount numeric not null check (total_amount >= 0),
  payment_status text default 'paid' check (payment_status in ('paid', 'partial', 'credit', 'pending_resolution')),
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  batch_id uuid references public.inventory_batches(id) on delete set null,
  unit_id uuid references public.inventory_units(id) on delete set null
);


-- 8. WALLETS & SYSTEM COMMISSION
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique,
  balance numeric default 0 check (balance >= 0)
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('credit', 'debit')),
  reason text,
  reference_id text, -- order_id, withdrawal_id, etc.
  created_at timestamp with time zone default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  network text not null,
  phone text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone default now()
);


-- 9. CREDIT SYSTEM
create table public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade unique,
  total_debt numeric default 0 check (total_debt >= 0)
);

create table public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  credit_account_id uuid references public.credit_accounts(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamp with time zone default now()
);


-- 10. PAYMENTS
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  provider text not null, -- 'paystack', 'momo', 'cash', 'credit'
  amount numeric not null check (amount >= 0),
  reference text,
  status text default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default now()
);


-- 11. EXPENSES
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  created_at timestamp with time zone default now()
);


-- 12. AUDIT LOGS (MANDATORY)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- Trigger to automatically create a public.wallets entry for agents/admin/managers
create or replace function public.handle_new_user_wallet()
returns trigger as $$
begin
  if new.role in ('admin', 'manager', 'agent') then
    insert into public.wallets (user_id, balance)
    values (new.id, 0)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_public_user_created
  after insert on public.users
  for each row execute procedure public.handle_new_user_wallet();


-- 13. BUSINESS LOGIC TRIGGERS & FUNCTIONS

-- Trigger: When order_items are added:
-- A) Deduct remaining_quantity from the inventory batch
-- B) Update inventory_units status to 'sold' if it is serialized
-- C) Create an INVENTORY LEDGER entry
create or replace function public.process_order_item_stock()
returns trigger as $$
declare
  is_serialized boolean;
  actual_batch_id uuid;
begin
  -- Retrieve product properties
  select has_serial into is_serialized from public.products where id = new.product_id;

  -- Enforce batch_id. If none provided, auto-select a batch with remaining stock
  if new.batch_id is null then
    select id into actual_batch_id
    from public.inventory_batches
    where product_id = new.product_id and remaining_quantity >= new.quantity
    order by created_at asc
    limit 1;

    if actual_batch_id is null then
      raise exception 'No available batch with sufficient stock for product %', new.product_id;
    end if;

    new.batch_id := actual_batch_id;
  else
    actual_batch_id := new.batch_id;
  end if;

  -- Check batch availability
  if not exists (
    select 1 from public.inventory_batches
    where id = actual_batch_id and remaining_quantity >= new.quantity
  ) then
    raise exception 'Insufficient stock in batch % for product %', actual_batch_id, new.product_id;
  end if;

  -- Deduct stock from the batch
  update public.inventory_batches
  set remaining_quantity = remaining_quantity - new.quantity
  where id = actual_batch_id;

  -- If serialized, mark the unit as sold
  if is_serialized then
    if new.unit_id is null then
      -- Auto-assign a unit if not provided
      select id into new.unit_id
      from public.inventory_units
      where batch_id = actual_batch_id and status = 'available'
      limit 1;

      if new.unit_id is null then
        raise exception 'Serialized product requires an available serial unit, none found in batch %', actual_batch_id;
      end if;
    end if;

    update public.inventory_units
    set status = 'sold', updated_at = now()
    where id = new.unit_id;
  end if;

  -- Create inventory ledger entry
  insert into public.inventory_ledger (product_id, batch_id, type, quantity, reference_id)
  values (new.product_id, actual_batch_id, 'OUT', -new.quantity, new.order_id::text);

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_order_item_created
  before insert on public.order_items
  for each row execute procedure public.process_order_item_stock();


-- Trigger: Create a credit account for a customer if one doesn't exist
create or replace function public.ensure_customer_credit_account()
returns trigger as $$
begin
  insert into public.credit_accounts (customer_id, total_debt)
  values (new.id, 0)
  on conflict (customer_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_customer_created
  after insert on public.customers
  for each row execute procedure public.ensure_customer_credit_account();


-- Trigger: Update Credit Balance based on order payment status
create or replace function public.update_credit_balance_on_order()
returns trigger as $$
declare
  owed_amount numeric;
begin
  if new.payment_status in ('credit', 'partial') then
    -- Let's determine how much is owed. We look for payments linked to this order.
    select coalesce(sum(amount), 0) into owed_amount from public.payments where order_id = new.id and status = 'completed';
    
    update public.credit_accounts
    set total_debt = total_debt + (new.total_amount - owed_amount)
    where customer_id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_order_status_update
  after insert or update of payment_status on public.orders
  for each row execute procedure public.update_credit_balance_on_order();


-- Trigger: Update customer debt when credit payment is completed
create or replace function public.adjust_debt_on_payment()
returns trigger as $$
begin
  update public.credit_accounts
  set total_debt = total_debt - new.amount
  where id = new.credit_account_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_credit_payment_made
  after insert on public.credit_payments
  for each row execute procedure public.adjust_debt_on_payment();


-- Trigger: Process commission when an order is completed/paid
create or replace function public.process_order_commission()
returns trigger as $$
declare
  agent_id uuid;
  agent_role text;
  comm_type text;
  comm_rate numeric;
  comm_total numeric := 0;
  order_item_rec record;
  variant_comm numeric;
  agent_wallet_id uuid;
begin
  -- Only calculate commission for orders that are fully paid or partially paid
  if new.payment_status in ('paid', 'partial') then
    -- Commission goes to the agent who created/referred the order (stored in created_by)
    agent_id := new.created_by;
    
    if agent_id is not null then
      select role, commission_type, commission_rate into agent_role, comm_type, comm_rate
      from public.users where id = agent_id;
      
      -- Only calculate for users who are agents
      if agent_role = 'agent' then
        -- Find agent's wallet
        select id into agent_wallet_id from public.wallets where user_id = agent_id;
        
        if agent_wallet_id is not null then
          if comm_type = 'percentage' then
            comm_total := new.total_amount * comm_rate;
          elsif comm_type = 'flat' then
            comm_total := comm_rate;
          elsif comm_type = 'variant_specific' then
            -- Iterate through order items and sum up the variant specific commissions
            for order_item_rec in 
              select oi.quantity, pv.commission_amount
              from public.order_items oi
              join public.product_variants pv on pv.product_id = oi.product_id
              where oi.order_id = new.id
            loop
              comm_total := comm_total + (coalesce(order_item_rec.commission_amount, 0) * order_item_rec.quantity);
            end loop;
          end if;

          if comm_total > 0 then
            -- Credit the wallet
            update public.wallets
            set balance = balance + comm_total
            where id = agent_wallet_id;

            -- Log transaction
            insert into public.wallet_transactions (wallet_id, amount, type, reason, reference_id)
            values (agent_wallet_id, comm_total, 'credit', 'Order referral commission', new.id::text);
            
            -- Audit log
            insert into public.audit_logs (user_id, action, details)
            values (agent_id, 'COMMISSION_CREDITED', jsonb_build_object('order_id', new.id, 'commission_earned', comm_total));
          end if;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_order_paid
  after update of payment_status on public.orders
  for each row execute procedure public.process_order_commission();


-- Trigger: Update wallet when a withdrawal changes state to completed or fails
create or replace function public.process_withdrawal_update()
returns trigger as $$
declare
  agent_wallet_id uuid;
begin
  if new.status = 'completed' and old.status = 'pending' then
    select id into agent_wallet_id from public.wallets where user_id = new.user_id;
    -- Deduct from balance (it was verified before request, now actually finalized)
    update public.wallets
    set balance = balance - new.amount
    where id = agent_wallet_id;

    insert into public.wallet_transactions (wallet_id, amount, type, reason, reference_id)
    values (agent_wallet_id, -new.amount, 'debit', 'Withdrawal completed', new.id::text);
    
    insert into public.audit_logs (user_id, action, details)
    values (new.user_id, 'WITHDRAWAL_COMPLETED', jsonb_build_object('withdrawal_id', new.id, 'amount', new.amount));
  elsif new.status = 'failed' and old.status = 'pending' then
    -- Log failure, no deduction needed as balance wasn't deducted yet, or refund if auto-deducted
    insert into public.audit_logs (user_id, action, details)
    values (new.user_id, 'WITHDRAWAL_FAILED', jsonb_build_object('withdrawal_id', new.id, 'amount', new.amount));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_withdrawal_status_change
  after update of status on public.withdrawals
  for each row execute procedure public.process_withdrawal_update();


-- 14. ROW-LEVEL SECURITY (RLS) POLICIES
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.inventory_units enable row level security;
alter table public.inventory_ledger enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_payments enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_logs enable row level security;

-- General policy helper: Admin & Managers can do anything
create policy admin_all_users on public.users for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_customers on public.customers for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'cashier', 'inventory')
);
create policy admin_all_products on public.products for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory', 'cashier')
);
create policy admin_all_variants on public.product_variants for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory', 'cashier')
);
create policy admin_all_shipments on public.shipments for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_shipment_items on public.shipment_items for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_batches on public.inventory_batches for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_units on public.inventory_units for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_ledger on public.inventory_ledger for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_orders on public.orders for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'cashier')
);
create policy admin_all_order_items on public.order_items for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'cashier')
);
create policy admin_all_wallets on public.wallets for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_wallet_trans on public.wallet_transactions for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_withdrawals on public.withdrawals for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_credit on public.credit_accounts for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'cashier')
);
create policy admin_all_credit_pay on public.credit_payments for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'cashier')
);
create policy admin_all_payments on public.payments for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'cashier')
);
create policy admin_all_expenses on public.expenses for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_audit on public.audit_logs for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);

-- Agent/User self policies
create policy user_self_read on public.users for select using (
  auth.uid() = id
);
create policy agent_read_wallet on public.wallets for select using (
  auth.uid() = user_id
);
create policy agent_read_transactions on public.wallet_transactions for select using (
  exists (
    select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid()
  )
);
create policy agent_withdrawal_self on public.withdrawals for all using (
  auth.uid() = user_id
);
create policy agent_read_referred_orders on public.orders for select using (
  auth.uid() = created_by
);
create policy customer_read_self on public.users for select using (
  auth.uid() = id
);
