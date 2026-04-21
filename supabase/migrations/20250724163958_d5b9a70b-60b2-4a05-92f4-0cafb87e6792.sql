-- Fix function search path security warnings by setting search_path for functions

-- Update the update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
NEW.updated_at = pg_catalog.now();
RETURN NEW;
END;
$$;

-- Update the update_user_availability_updated_at function to set search_path
CREATE OR REPLACE FUNCTION public.update_user_availability_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;