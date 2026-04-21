
-- Consolidate duplicate RLS policies across all tables for better performance
-- This migration drops all duplicate permissive policies and creates single comprehensive policies per operation

-- ===============================
-- PROFILES TABLE
-- ===============================
-- Drop existing policies on profiles if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create consolidated policies for profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ===============================
-- JOBS TABLE
-- ===============================
-- Drop existing policies on jobs if they exist
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Create consolidated policies for jobs
CREATE POLICY "jobs_select_policy" ON public.jobs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert_policy" ON public.jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update_policy" ON public.jobs
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "jobs_delete_policy" ON public.jobs
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- BANK_DETAILS TABLE
-- ===============================
-- Drop existing policies on bank_details if they exist
DROP POLICY IF EXISTS "Users can view their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can insert their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can update their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can delete their own bank details" ON public.bank_details;

-- Create consolidated policies for bank_details
CREATE POLICY "bank_details_select_policy" ON public.bank_details
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bank_details_insert_policy" ON public.bank_details
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bank_details_update_policy" ON public.bank_details
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bank_details_delete_policy" ON public.bank_details
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- INVOICE_SETTINGS TABLE
-- ===============================
-- Drop existing policies on invoice_settings if they exist
DROP POLICY IF EXISTS "Users can view their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can insert their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can update their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can delete their own invoice settings" ON public.invoice_settings;

-- Create consolidated policies for invoice_settings
CREATE POLICY "invoice_settings_select_policy" ON public.invoice_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoice_settings_insert_policy" ON public.invoice_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_settings_update_policy" ON public.invoice_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "invoice_settings_delete_policy" ON public.invoice_settings
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- SENT_INVOICES TABLE
-- ===============================
-- Drop existing policies on sent_invoices if they exist
DROP POLICY IF EXISTS "Users can view their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can insert their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can update their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can delete their own sent invoices" ON public.sent_invoices;

-- Create consolidated policies for sent_invoices
CREATE POLICY "sent_invoices_select_policy" ON public.sent_invoices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sent_invoices_insert_policy" ON public.sent_invoices
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sent_invoices_update_policy" ON public.sent_invoices
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "sent_invoices_delete_policy" ON public.sent_invoices
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- USER_SIGNATURES TABLE
-- ===============================
-- Drop existing policies on user_signatures if they exist
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can insert their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.user_signatures;

-- Create consolidated policies for user_signatures
CREATE POLICY "user_signatures_select_policy" ON public.user_signatures
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_signatures_insert_policy" ON public.user_signatures
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_signatures_update_policy" ON public.user_signatures
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_signatures_delete_policy" ON public.user_signatures
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- NOTIFICATION_SETTINGS TABLE
-- ===============================
-- Drop existing policies on notification_settings if they exist
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON public.notification_settings;

-- Create consolidated policies for notification_settings
CREATE POLICY "notification_settings_select_policy" ON public.notification_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_insert_policy" ON public.notification_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_settings_update_policy" ON public.notification_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_delete_policy" ON public.notification_settings
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- USER_ONBOARDING TABLE
-- ===============================
-- Drop existing policies on user_onboarding if they exist
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can delete their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding status" ON public.user_onboarding;

-- Create consolidated policies for user_onboarding
CREATE POLICY "user_onboarding_select_policy" ON public.user_onboarding
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_insert_policy" ON public.user_onboarding
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_onboarding_update_policy" ON public.user_onboarding
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_delete_policy" ON public.user_onboarding
FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- USER_INVOICE_SEQUENCES TABLE
-- ===============================
-- Drop existing policies on user_invoice_sequences if they exist
DROP POLICY IF EXISTS "Users can view their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can insert their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can update their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can delete their own invoice sequences" ON public.user_invoice_sequences;

-- Create consolidated policies for user_invoice_sequences
CREATE POLICY "user_invoice_sequences_select_policy" ON public.user_invoice_sequences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_invoice_sequences_insert_policy" ON public.user_invoice_sequences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_invoice_sequences_update_policy" ON public.user_invoice_sequences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_invoice_sequences_delete_policy" ON public.user_invoice_sequences
FOR DELETE USING (auth.uid() = user_id);
