-- Security enhancement for bank_details table
-- Drop existing policies and recreate them with more explicit security

DROP POLICY IF EXISTS "bank_details_select_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_insert_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_update_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_delete_policy" ON public.bank_details;

-- Recreate policies with enhanced security and clearer naming
-- Users can only view their own banking details
CREATE POLICY "Users can only view their own banking details" 
ON public.bank_details 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert banking details for themselves
CREATE POLICY "Users can only insert their own banking details" 
ON public.bank_details 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own banking details
CREATE POLICY "Users can only update their own banking details" 
ON public.bank_details 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own banking details
CREATE POLICY "Users can only delete their own banking details" 
ON public.bank_details 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- Force RLS for all users including table owners
ALTER TABLE public.bank_details FORCE ROW LEVEL SECURITY;