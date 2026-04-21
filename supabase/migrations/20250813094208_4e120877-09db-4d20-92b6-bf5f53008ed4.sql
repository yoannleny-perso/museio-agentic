-- Fix security vulnerability: Restrict booking_requests SELECT access to portfolio owners only
-- Currently all booking requests are publicly readable, exposing customer contact information

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Public can view booking requests" ON public.booking_requests;

-- Create a new policy that only allows portfolio owners to view their own booking requests
CREATE POLICY "Portfolio owners can view their own booking requests" 
ON public.booking_requests 
FOR SELECT 
USING (auth.uid() = portfolio_user_id);