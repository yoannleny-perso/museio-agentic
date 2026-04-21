
-- Security Fix: Function Search Path Mutable Vulnerability for update_modified_column
-- This migration fixes the security vulnerability in update_modified_column trigger function
-- by adding SET search_path = '' and using fully qualified function calls

-- ===============================
-- FIX FUNCTION SEARCH PATH MUTABLE VULNERABILITY FOR TRIGGER FUNCTION
-- ===============================

-- Replace the function with a secure version that has a fixed search_path
CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$function$;

-- ===============================
-- VERIFICATION COMMENT
-- ===============================
-- This security fix:
-- 1. Adds SET search_path = '' to prevent schema injection attacks
-- 2. Changes now() to pg_catalog.now() for fully qualified function call
-- 3. Maintains all existing trigger functionality 
-- 4. Eliminates the "Function Search Path Mutable" security vulnerability
-- 5. All existing triggers using this function will continue to work identically
