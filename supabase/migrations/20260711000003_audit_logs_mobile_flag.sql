-- Add mobile_app flag to audit_logs so entries from the mobile app can be distinguished from web/pos system logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS mobile_app boolean default false;

-- Index for fast filtering by mobile_app flag + user_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_mobile_app ON public.audit_logs(mobile_app, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
