
-- Targeted RLS Policy Cleanup - Remove Duplicate Policies Causing Performance Warnings
-- This migration removes the old "Users can..." policies that are causing auth performance issues
-- while keeping the optimized policies that are already working correctly

-- ===============================
-- DROP SPECIFIC PROBLEMATIC POLICIES ON SENT_INVOICES
-- ===============================

-- Drop the old "Users can..." policies that are causing the performance warning
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.sent_invoices;

-- Drop any other possible variations that might exist
DROP POLICY IF EXISTS "Users can view their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can insert their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can update their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can delete their own sent invoices" ON public.sent_invoices;

-- ===============================
-- VERIFICATION COMMENT
-- ===============================
-- After this migration, the sent_invoices table should have exactly 4 policies:
-- 1. sent_invoices_select_policy (optimized)
-- 2. sent_invoices_insert_policy (optimized)  
-- 3. sent_invoices_update_policy (optimized)
-- 4. sent_invoices_delete_policy (optimized)
-- 
-- All using the optimized (SELECT auth.uid()) pattern for maximum performance
