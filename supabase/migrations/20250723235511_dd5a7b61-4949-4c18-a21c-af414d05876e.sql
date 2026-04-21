-- Fix security issues: Enable RLS and create proper policies for booking_requests and portfolio_settings

-- Enable RLS on booking_requests table
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_requests
CREATE POLICY "Public can create booking requests" 
ON public.booking_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view booking requests" 
ON public.booking_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Portfolio owners can update their booking requests" 
ON public.booking_requests 
FOR UPDATE 
USING (auth.uid() = portfolio_user_id);

-- Enable RLS on portfolio_settings table (it was missing)
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolio_settings
CREATE POLICY "Users can manage their own portfolio settings" 
ON public.portfolio_settings 
FOR ALL 
USING (auth.uid() = user_id);