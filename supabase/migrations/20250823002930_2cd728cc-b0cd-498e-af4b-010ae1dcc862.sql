-- Remove DELETE permission from jobs table to prevent hard deletes
-- Soft delete functionality will continue to work via UPDATE operations
DROP POLICY IF EXISTS "jobs_delete_policy" ON public.jobs;