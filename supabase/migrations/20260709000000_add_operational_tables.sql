-- 1. Create missing tables
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  assigned_to uuid references public.users(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text default 'pending' check (status in ('pending', 'completed')),
  due_date date,
  created_at timestamp with time zone default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  body text,
  category text default 'general' check (category in ('inventory', 'orders', 'shipments', 'general')),
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  category text check (category in ('inventory_low', 'inventory_out', 'credit', 'shipment')),
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table public.discrepancy_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  reported_by uuid references public.users(id) on delete set null,
  expected_qty int not null,
  actual_qty int not null,
  notes text,
  created_at timestamp with time zone default now()
);

create table public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  reported_by uuid references public.users(id) on delete set null,
  serial_number text,
  severity text check (severity in ('Low', 'Medium', 'High')),
  description text,
  created_at timestamp with time zone default now()
);

create table public.shipment_reports (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  reported_by uuid references public.users(id) on delete set null,
  issue_type text,
  description text,
  created_at timestamp with time zone default now()
);

-- 2. Enable Row-Level Security (RLS)
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.alerts enable row level security;
alter table public.discrepancy_reports enable row level security;
alter table public.damage_reports enable row level security;
alter table public.shipment_reports enable row level security;

-- 3. Define Admin/Manager policies (matching existing pattern)
create policy admin_all_tasks on public.tasks for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_notifications on public.notifications for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_alerts on public.alerts for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager')
);
create policy admin_all_discrepancy on public.discrepancy_reports for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_damage on public.damage_reports for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);
create policy admin_all_shipment_rep on public.shipment_reports for all using (
  auth.jwt() ->> 'role' in ('admin', 'manager', 'inventory')
);

-- 4. Define Agent/User policies for self/assigned items
create policy user_read_tasks on public.tasks for select using (
  auth.uid() = assigned_to
);
create policy user_update_tasks on public.tasks for update using (
  auth.uid() = assigned_to
);
create policy user_read_notifications on public.notifications for select using (
  auth.uid() = user_id
);
create policy user_update_notifications on public.notifications for update using (
  auth.uid() = user_id
);

-- 5. Define Anon / Read All / Write All policies (matching fix_rls_anon_read.sql)
create policy anon_read_tasks on public.tasks
  for select using (true);
create policy anon_update_tasks on public.tasks
  for update using (true);
create policy anon_insert_tasks on public.tasks
  for insert with check (true);

create policy anon_read_notifications on public.notifications
  for select using (true);
create policy anon_update_notifications on public.notifications
  for update using (true);
create policy anon_insert_notifications on public.notifications
  for insert with check (true);

create policy anon_read_alerts on public.alerts
  for select using (true);
create policy anon_update_alerts on public.alerts
  for update using (true);
create policy anon_insert_alerts on public.alerts
  for insert with check (true);

create policy anon_read_discrepancy on public.discrepancy_reports
  for select using (true);
create policy anon_insert_discrepancy on public.discrepancy_reports
  for insert with check (true);

create policy anon_read_damage on public.damage_reports
  for select using (true);
create policy anon_insert_damage on public.damage_reports
  for insert with check (true);

create policy anon_read_shipment_reports on public.shipment_reports
  for select using (true);
create policy anon_insert_shipment_reports on public.shipment_reports
  for insert with check (true);
