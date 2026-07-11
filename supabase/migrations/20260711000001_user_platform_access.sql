-- Add columns to public.users to differentiate access permissions for mobile app vs web dashboard
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_web_dashboard_access boolean default false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_mobile_access boolean default true;

-- Update existing user roles with logical access permissions
UPDATE public.users SET has_web_dashboard_access = true WHERE role in ('admin', 'manager', 'cashier');
UPDATE public.users SET has_mobile_access = false WHERE role in ('cashier');
UPDATE public.users SET has_mobile_access = true WHERE role in ('admin', 'manager', 'agent', 'inventory');
