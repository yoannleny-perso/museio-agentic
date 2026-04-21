
-- Drop all existing policies that might conflict, then create comprehensive RLS policies

-- Drop existing policies on profiles if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop existing policies on jobs if they exist
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Drop existing policies on bank_details if they exist
DROP POLICY IF EXISTS "Users can view their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can insert their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can update their own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can delete their own bank details" ON public.bank_details;

-- Drop existing policies on invoice_settings if they exist
DROP POLICY IF EXISTS "Users can view their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can insert their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can update their own invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Users can delete their own invoice settings" ON public.invoice_settings;

-- Drop existing policies on sent_invoices if they exist
DROP POLICY IF EXISTS "Users can view their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can insert their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can update their own sent invoices" ON public.sent_invoices;
DROP POLICY IF EXISTS "Users can delete their own sent invoices" ON public.sent_invoices;

-- Drop existing policies on user_signatures if they exist
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can insert their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.user_signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.user_signatures;

-- Drop existing policies on notification_settings if they exist
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON public.notification_settings;

-- Drop existing policies on user_onboarding if they exist
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can delete their own onboarding" ON public.user_onboarding;

-- Drop existing policies on user_invoice_sequences if they exist
DROP POLICY IF EXISTS "Users can view their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can insert their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can update their own invoice sequences" ON public.user_invoice_sequences;
DROP POLICY IF EXISTS "Users can delete their own invoice sequences" ON public.user_invoice_sequences;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" ON public.jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON public.jobs
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" ON public.jobs
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for bank_details
CREATE POLICY "Users can view their own bank details" ON public.bank_details
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank details" ON public.bank_details
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank details" ON public.bank_details
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank details" ON public.bank_details
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for invoice_settings
CREATE POLICY "Users can view their own invoice settings" ON public.invoice_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice settings" ON public.invoice_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice settings" ON public.invoice_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice settings" ON public.invoice_settings
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for sent_invoices
CREATE POLICY "Users can view their own sent invoices" ON public.sent_invoices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sent invoices" ON public.sent_invoices
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sent invoices" ON public.sent_invoices
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sent invoices" ON public.sent_invoices
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_signatures
CREATE POLICY "Users can view their own signatures" ON public.user_signatures
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own signatures" ON public.user_signatures
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures" ON public.user_signatures
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures" ON public.user_signatures
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification_settings
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON public.notification_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" ON public.notification_settings
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_onboarding
CREATE POLICY "Users can view their own onboarding" ON public.user_onboarding
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" ON public.user_onboarding
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" ON public.user_onboarding
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding" ON public.user_onboarding
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_invoice_sequences
CREATE POLICY "Users can view their own invoice sequences" ON public.user_invoice_sequences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice sequences" ON public.user_invoice_sequences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice sequences" ON public.user_invoice_sequences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice sequences" ON public.user_invoice_sequences
FOR DELETE USING (auth.uid() = user_id);
