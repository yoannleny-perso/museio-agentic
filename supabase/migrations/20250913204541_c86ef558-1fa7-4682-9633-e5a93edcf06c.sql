-- COMPLETE USER DATA DELETION FOR ivan.guelton@audaciangroup.com
-- User ID: 34d3d499-838d-431b-870a-3bcbfb9adcd1
-- WARNING: This operation is IRREVERSIBLE

-- Phase 1: Delete dependent data (respecting foreign key constraints)

-- Delete job items first (they depend on jobs)
DELETE FROM public.job_items 
WHERE job_id IN (
  SELECT id FROM public.jobs 
  WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1'
);

-- Delete jobs
DELETE FROM public.jobs 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Delete clients
DELETE FROM public.clients 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Delete sent invoices
DELETE FROM public.sent_invoices 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Phase 2: Delete user configuration data

-- Delete invoice settings
DELETE FROM public.invoice_settings 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Delete user signatures
DELETE FROM public.user_signatures 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Delete user onboarding status
DELETE FROM public.user_onboarding 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Delete user invoice sequences
DELETE FROM public.user_invoice_sequences 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Phase 3: Delete personal data

-- Delete bank details (sensitive financial data)
DELETE FROM public.bank_details 
WHERE user_id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Delete user profile
DELETE FROM public.profiles 
WHERE id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';

-- Phase 4: Delete authentication data (final step)
-- Note: This will cascade delete any remaining references
DELETE FROM auth.users 
WHERE id = '34d3d499-838d-431b-870a-3bcbfb9adcd1';