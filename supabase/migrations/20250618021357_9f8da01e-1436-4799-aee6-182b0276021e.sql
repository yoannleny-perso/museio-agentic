
-- DEFINITIVE RLS Policy Cleanup - Eliminate ALL duplicates across ALL tables
-- This migration will be more aggressive in finding and removing ALL policy variations

-- ===============================
-- DROP ALL EXISTING RLS POLICIES - COMPREHENSIVE CLEANUP
-- ===============================

-- Drop ALL possible policy variations on user_onboarding (targeting the specific duplicates mentioned)
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can delete their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding status" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can view their own onboarding status" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding status" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_select_policy" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_insert_policy" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_update_policy" ON public.user_onboarding;
DROP POLICY IF EXISTS "user_onboarding_delete_policy" ON public.user_onboarding;

-- Drop ALL possible policy variations on sent_invoices
DROP POLICY IF EXISTS "Users can view their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can insert their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can update their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can delete their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_select_policy" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_insert_policy" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_update_policy" ON public.sent_invoices;
DROP POLICY IF EXISTS "sent_invoices_delete_policy" ON public.sent_invoices;

-- Drop ALL possible policy variations on user_invoice_sequences
DROP POLICY IF EXISTS "Users can view their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can insert their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can update their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can delete their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_select_policy" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_insert_policy" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_update_policy" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "user_invoice_sequences_delete_policy" ON public.user_invoice_sequences;

-- Drop ALL possible policy variations on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Drop ALL possible policy variations on jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_policy" ON public.jobs;

-- Drop ALL possible policy variations on bank_details
DROP POLICY IF EXISTS "Users can view their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can insert their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can update their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can delete their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_select_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_insert_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_update_policy" ON public.bank_details;
DROP POLICY IF EXISTS "bank_details_delete_policy" ON public.bank_details;

-- Drop ALL possible policy variations on invoice_settings
DROP POLICY IF EXISTS "Users can view their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can insert their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can update their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can delete their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_select_policy" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_insert_policy" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_update_policy" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_delete_policy" ON public.invoice_settings;

-- Drop ALL possible policy variations on user_signatures
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can insert their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_select_policy" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_insert_policy" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_update_policy" ON public.user_signatures;
DROP POLICY IF EXISTS "user_signatures_delete_policy" ON public.user_signatures;

-- Drop ALL possible policy variations on notification_settings
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_select_policy" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert_policy" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_update_policy" ON public.notification_settings;
DROP POLICY IF EXISTS "notification_settings_delete_policy" ON public.notification_settings;

-- ===============================
-- ENSURE RLS IS ENABLED ON ALL TABLES
-- ===============================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invoice_sequences ENABLE ROW LEVEL SECURITY;

-- ===============================
-- CREATE SINGLE OPTIMIZED POLICIES - FINAL DEFINITIVE SET
-- Using auth.uid() directly for maximum compatibility and performance
-- Exactly ONE policy per operation per table
-- ===============================

-- PROFILES TABLE - 3 policies (no DELETE needed)
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- JOBS TABLE - 4 policies
CREATE POLICY "jobs_select_policy" ON public.jobs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert_policy" ON public.jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update_policy" ON public.jobs
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "jobs_delete_policy" ON public.jobs
FOR DELETE USING (auth.uid() = user_id);

-- BANK_DETAILS TABLE - 4 policies
CREATE POLICY "bank_details_select_policy" ON public.bank_details
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bank_details_insert_policy" ON public.bank_details
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bank_details_update_policy" ON public.bank_details
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bank_details_delete_policy" ON public.bank_details
FOR DELETE USING (auth.uid() = user_id);

-- INVOICE_SETTINGS TABLE - 4 policies
CREATE POLICY "invoice_settings_select_policy" ON public.invoice_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoice_settings_insert_policy" ON public.invoice_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_settings_update_policy" ON public.invoice_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "invoice_settings_delete_policy" ON public.invoice_settings
FOR DELETE USING (auth.uid() = user_id);

-- SENT_INVOICES TABLE - 4 policies
CREATE POLICY "sent_invoices_select_policy" ON public.sent_invoices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sent_invoices_insert_policy" ON public.sent_invoices
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sent_invoices_update_policy" ON public.sent_invoices
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "sent_invoices_delete_policy" ON public.sent_invoices
FOR DELETE USING (auth.uid() = user_id);

-- USER_SIGNATURES TABLE - 4 policies
CREATE POLICY "user_signatures_select_policy" ON public.user_signatures
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_signatures_insert_policy" ON public.user_signatures
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_signatures_update_policy" ON public.user_signatures
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_signatures_delete_policy" ON public.user_signatures
FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATION_SETTINGS TABLE - 4 policies
CREATE POLICY "notification_settings_select_policy" ON public.notification_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_insert_policy" ON public.notification_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_settings_update_policy" ON public.notification_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_delete_policy" ON public.notification_settings
FOR DELETE USING (auth.uid() = user_id);

-- USER_ONBOARDING TABLE - 4 policies (addressing the specific duplicates)
CREATE POLICY "user_onboarding_select_policy" ON public.user_onboarding
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_insert_policy" ON public.user_onboarding
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_onboarding_update_policy" ON public.user_onboarding
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_delete_policy" ON public.user_onboarding
FOR DELETE USING (auth.uid() = user_id);

-- USER_INVOICE_SEQUENCES TABLE - 4 policies (no ALL access policy)
CREATE POLICY "user_invoice_sequences_select_policy" ON public.user_invoice_sequences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_invoice_sequences_insert_policy" ON public.user_invoice_sequences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_invoice_sequences_update_policy" ON public.user_invoice_sequences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_invoice_sequences_delete_policy" ON public.user_invoice_sequences
FOR DELETE USING (auth.uid() = user_id);
