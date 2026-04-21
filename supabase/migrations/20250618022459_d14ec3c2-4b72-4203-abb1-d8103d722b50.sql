
-- Security Fix: Function Search Path Mutable Vulnerability
-- This migration fixes the security vulnerability in generate_invoice_number_for_user
-- by adding SET search_path = '' to prevent schema injection attacks

-- ===============================
-- FIX FUNCTION SEARCH PATH MUTABLE VULNERABILITY
-- ===============================

-- Replace the function with a secure version that has a fixed search_path
CREATE OR REPLACE FUNCTION public.generate_invoice_number_for_user(format_string text, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  result TEXT := format_string;
  seq_number INTEGER;
BEGIN
  -- Validate that user_id is provided
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  
  -- Atomically get and increment the next invoice number for this user
  INSERT INTO public.user_invoice_sequences (user_id, next_number)
  VALUES (p_user_id, 2)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    next_number = public.user_invoice_sequences.next_number + 1,
    updated_at = now()
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
-- 2. Maintains all existing functionality 
-- 3. Eliminates the "Function Search Path Mutable" security vulnerability
-- 4. All table references remain fully qualified (public.user_invoice_sequences)
