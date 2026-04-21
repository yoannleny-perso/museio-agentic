
-- Security Fix: Function Search Path Mutable Vulnerability for generate_invoice_number
-- This migration fixes the security vulnerability in generate_invoice_number function
-- by adding SET search_path = '' and using fully qualified function calls

-- ===============================
-- FIX FUNCTION SEARCH PATH MUTABLE VULNERABILITY FOR GENERATE_INVOICE_NUMBER
-- ===============================

-- Replace the function with a secure version that has a fixed search_path
CREATE OR REPLACE FUNCTION public.generate_invoice_number(format_string text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  result TEXT := format_string;
  seq_number INTEGER;
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Atomically get and increment the next invoice number for this user
  INSERT INTO public.user_invoice_sequences (user_id, next_number)
  VALUES (current_user_id, 2)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    next_number = public.user_invoice_sequences.next_number + 1,
    updated_at = pg_catalog.now()
  RETURNING next_number - 1 INTO seq_number;
  
  -- If this is the first invoice for the user, seq_number will be 1
  IF seq_number IS NULL THEN
    seq_number := 1;
  END IF;
  
  -- Replace placeholders in the format string
  result := REPLACE(result, '{YYYY}', TO_CHAR(CURRENT_DATE, 'YYYY'));
  result := REPLACE(result, '{MM}', TO_CHAR(CURRENT_DATE, 'MM'));
  result := REPLACE(result, '{DD}', TO_CHAR(CURRENT_DATE, 'DD'));
  result := REPLACE(result, '{NUM}', LPAD(seq_number::TEXT, 3, '0'));
  
  RETURN result;
END;
$function$;

-- ===============================
-- VERIFICATION COMMENT
-- ===============================
-- This security fix:
-- 1. Adds SET search_path = '' to prevent schema injection attacks
-- 2. Changes now() to pg_catalog.now() for fully qualified function call
-- 3. Maintains all existing invoice number generation functionality
-- 4. Eliminates the "Function Search Path Mutable" security vulnerability
-- 5. All existing code calling this function will continue to work identically
