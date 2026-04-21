
-- Security Fix: Function Search Path Mutable Vulnerability for enforce_invoice_format_prefix
-- This migration fixes the security vulnerability in enforce_invoice_format_prefix trigger function
-- by adding SET search_path = '' and using fully qualified function calls

-- ===============================
-- FIX FUNCTION SEARCH PATH MUTABLE VULNERABILITY FOR ENFORCE_INVOICE_FORMAT_PREFIX
-- ===============================

-- Replace the function with a secure version that has a fixed search_path
CREATE OR REPLACE FUNCTION public.enforce_invoice_format_prefix()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  -- If format doesn't start with 'INV-', prepend it
  IF NOT NEW.format LIKE 'INV-%' THEN
    NEW.format := 'INV-' || NEW.format;
  END IF;
  
  -- Ensure the format contains the required placeholders
  IF NEW.format NOT LIKE '%{YYYY}%{MM}%{DD}%{NUM}%' THEN
    -- If placeholders are missing, append them
    NEW.format := pg_catalog.regexp_replace(NEW.format, '{YYYY}|{MM}|{DD}|{NUM}', '', 'g');
    NEW.format := NEW.format || '{YYYY}{MM}{DD}{NUM}';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ===============================
-- VERIFICATION COMMENT
-- ===============================
-- This security fix:
-- 1. Adds SET search_path = '' to prevent schema injection attacks
-- 2. Changes regexp_replace() to pg_catalog.regexp_replace() for fully qualified function call
-- 3. Maintains all existing invoice format validation functionality
-- 4. Eliminates the "Function Search Path Mutable" security vulnerability
-- 5. All existing triggers using this function will continue to work identically
