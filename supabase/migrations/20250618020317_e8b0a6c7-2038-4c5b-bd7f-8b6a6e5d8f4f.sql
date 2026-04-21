
-- Comprehensive RLS Policy Optimization - Drop all existing policies and create optimized ones
-- This migration fixes performance issues by using (SELECT auth.uid()) instead of auth.uid()
-- and ensures exactly one policy per operation per table

-- ===============================
-- DROP ALL EXISTING POLICIES
-- ===============================

-- Drop all policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- Drop all policies on jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_policy" ON public.jobs;

-- Drop all policies on bank_details
DROP POLICY IF EXISTS "Users can view their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can insert their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can update their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can delete their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_select_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_insert_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_update_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_delete_policy" ON public.bank_details;

-- Drop all policies on invoice_settings
DROP POLICY IF EXISTS "Users can view their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can insert their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can update their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can delete their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_select_policy" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_insert_policy" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_update_policy" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_delete_policy" ON public.invoice_settings;

-- Drop all policies on sent_invoices (including duplicates)
DROP POLICY IF EXISTS "Users can view their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can insert their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can update their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can delete their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_select_policy" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_insert_policy" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_update_policy" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_delete_policy" ON public.sent_invoices;

-- Drop all policies on user_signatures
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can insert their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_select_policy" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_insert_policy" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_update_policy" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_delete_policy" ON public.user_signatures;

-- Drop all policies on notification_settings
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_select_policy" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert_policy" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_update_policy" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_delete_policy" ON public.notification_settings;

-- Drop all policies on user_onboarding (including duplicates)
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can delete their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding status" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_select_policy" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_insert_policy" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_update_policy" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_delete_policy" ON public.user_onboarding;

-- Drop all policies on user_invoice_sequences (including duplicates)
DROP POLICY IF EXISTS "Users can view their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can insert their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can update their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can delete their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_select_policy" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_insert_policy" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_update_policy" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_delete_policy" ON public.user_invoice_sequences;

-- ===============================
-- CREATE OPTIMIZED POLICIES
-- Using (SELECT auth.uid()) for performance optimization
-- ===============================

-- PROFILES TABLE - Optimized policies
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING ((SELECT auth.uid()) = id);

-- JOBS TABLE - Optimized policies
CREATE POLICY "jobs_select_policy" ON public.jobs
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "jobs_insert_policy" ON public.jobs
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "jobs_update_policy" ON public.jobs
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "jobs_delete_policy" ON public.jobs
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- BANK_DETAILS TABLE - Optimized policies
CREATE POLICY "bank_details_select_policy" ON public.bank_details
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "bank_details_insert_policy" ON public.bank_details
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "bank_details_update_policy" ON public.bank_details
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "bank_details_delete_policy" ON public.bank_details
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- INVOICE_SETTINGS TABLE - Optimized policies
CREATE POLICY "invoice_settings_select_policy" ON public.invoice_settings
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "invoice_settings_insert_policy" ON public.invoice_settings
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "invoice_settings_update_policy" ON public.invoice_settings
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "invoice_settings_delete_policy" ON public.invoice_settings
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- SENT_INVOICES TABLE - Optimized policies
CREATE POLICY "sent_invoices_select_policy" ON public.sent_invoices
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "sent_invoices_insert_policy" ON public.sent_invoices
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "sent_invoices_update_policy" ON public.sent_invoices
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "sent_invoices_delete_policy" ON public.sent_invoices
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- USER_SIGNATURES TABLE - Optimized policies
CREATE POLICY "user_signatures_select_policy" ON public.user_signatures
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_signatures_insert_policy" ON public.user_signatures
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_signatures_update_policy" ON public.user_signatures
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_signatures_delete_policy" ON public.user_signatures
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- NOTIFICATION_SETTINGS TABLE - Optimized policies
CREATE POLICY "notification_settings_select_policy" ON public.notification_settings
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notification_settings_insert_policy" ON public.notification_settings
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "notification_settings_update_policy" ON public.notification_settings
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notification_settings_delete_policy" ON public.notification_settings
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- USER_ONBOARDING TABLE - Optimized policies
CREATE POLICY "user_onboarding_select_policy" ON public.user_onboarding
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_onboarding_insert_policy" ON public.user_onboarding
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_onboarding_update_policy" ON public.user_onboarding
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_onboarding_delete_policy" ON public.user_onboarding
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- USER_INVOICE_SEQUENCES TABLE - Optimized policies
CREATE POLICY "user_invoice_sequences_select_policy" ON public.user_invoice_sequences
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_invoice_sequences_insert_policy" ON public.user_invoice_sequences
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_invoice_sequences_update_policy" ON public.user_invoice_sequences
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_invoice_sequences_delete_policy" ON public.user_invoice_sequences
FOR DELETE USING ((SELECT auth.uid()) = user_id);
