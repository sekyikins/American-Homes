-- Create customer activity ledger table to store purchases, payments, and balance adjustments
CREATE TABLE IF NOT EXISTS public.customer_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  type text not null check (type in ('PURCHASE', 'PAYMENT', 'ADJUSTMENT_DECREASE', 'ADJUSTMENT_INCREASE')),
  amount numeric not null, -- positive for increasing debt, negative for decreasing debt/prepayments
  description text,
  reference_id text, -- order_id or transaction ref
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

-- Policy allowing anyone read and write to customer ledger
CREATE POLICY anon_all_customer_ledger ON public.customer_ledger FOR ALL USING (true);
