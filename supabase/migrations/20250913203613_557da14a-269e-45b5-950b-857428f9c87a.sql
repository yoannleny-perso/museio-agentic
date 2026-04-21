-- Security enhancement for booking_requests table
-- Fix critical security vulnerability in INSERT policy

DROP POLICY IF EXISTS "Public can create booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Portfolio owners can view their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Portfolio owners can update their booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Portfolio owners can delete their booking requests" ON public.booking_requests;

-- Recreate policies with enhanced security
-- Allow public to create booking requests (this is intentional for public booking forms)
-- but restrict to specific conditions
CREATE POLICY "Allow public booking request creation" 
ON public.booking_requests 
FOR INSERT 
TO public
WITH CHECK (
  -- Ensure required fields are present
  requester_name IS NOT NULL 
  AND requester_email IS NOT NULL 
  AND portfolio_user_id IS NOT NULL
  AND event_date IS NOT NULL
);

-- Only authenticated portfolio owners can view their booking requests
CREATE POLICY "Portfolio owners can view their booking requests" 
ON public.booking_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = portfolio_user_id);

-- Only authenticated portfolio owners can update their booking requests
CREATE POLICY "Portfolio owners can update their booking requests" 
ON public.booking_requests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = portfolio_user_id)
WITH CHECK (auth.uid() = portfolio_user_id);

-- Only authenticated portfolio owners can delete their booking requests
CREATE POLICY "Portfolio owners can delete their booking requests" 
ON public.booking_requests 
FOR DELETE 
TO authenticated
USING (auth.uid() = portfolio_user_id);

-- Ensure RLS is enabled and forced
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests FORCE ROW LEVEL SECURITY;