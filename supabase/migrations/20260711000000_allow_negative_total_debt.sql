-- Drop check constraint restricting total_debt to non-negative values on credit_accounts table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT concon.conname
        FROM pg_constraint concon
        INNER JOIN pg_class relclass ON relclass.oid = concon.conrelid
        INNER JOIN pg_namespace nspname ON nspname.oid = relclass.relnamespace
        WHERE nspname.nspname = 'public'
          AND relclass.relname = 'credit_accounts'
          AND concon.contype = 'c'
          AND concon.conname LIKE '%total_debt%'
    LOOP
        EXECUTE 'ALTER TABLE public.credit_accounts DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;
