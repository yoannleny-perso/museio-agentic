-- Delete all data for user e_marque@hotmail.com
-- This must be done in the correct order to respect foreign key constraints

BEGIN;

-- First, let's identify the user ID and verify they exist
DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'e_marque@hotmail.com';
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    -- Check if user exists
    user_exists := (target_user_id IS NOT NULL);
    
    IF user_exists THEN
        RAISE NOTICE 'Found user: % (ID: %)', target_email, target_user_id;
    ELSE
        RAISE NOTICE 'User not found: %', target_email;
    END IF;
    
    -- Only proceed if user exists
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User % not found in the database', target_email;
    END IF;
END $$;

-- Step 1: Delete sent_invoices (references jobs)
DELETE FROM public.sent_invoices 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 2: Delete jobs (main user content)
DELETE FROM public.jobs 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 3: Delete user_signatures
DELETE FROM public.user_signatures 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 4: Delete invoice_settings
DELETE FROM public.invoice_settings 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 5: Delete user_invoice_sequences
DELETE FROM public.user_invoice_sequences 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 6: Delete bank_details
DELETE FROM public.bank_details 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 7: Delete notification_settings
DELETE FROM public.notification_settings 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 8: Delete user_onboarding
DELETE FROM public.user_onboarding 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 9: Delete profiles
DELETE FROM public.profiles 
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'e_marque@hotmail.com'
);

-- Step 10: Finally delete from auth.users (this will cascade any remaining references)
DELETE FROM auth.users 
WHERE email = 'e_marque@hotmail.com';

-- Verify deletion completed
DO $$
DECLARE
    remaining_records INTEGER := 0;
    target_email TEXT := 'e_marque@hotmail.com';
BEGIN
    -- Check if any records remain in public tables
    SELECT COUNT(*) INTO remaining_records FROM (
        SELECT user_id FROM public.sent_invoices WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.jobs WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.user_signatures WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.invoice_settings WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.user_invoice_sequences WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.bank_details WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.notification_settings WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT user_id FROM public.user_onboarding WHERE user_id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT id FROM public.profiles WHERE id IN (
            SELECT id FROM auth.users WHERE email = target_email
        )
        UNION ALL
        SELECT id FROM auth.users WHERE email = target_email
    ) remaining;
    
    IF remaining_records > 0 THEN
        RAISE EXCEPTION 'Deletion incomplete: % records still exist', remaining_records;
    END IF;
    
    RAISE NOTICE 'Successfully deleted all data for user: %', target_email;
END $$;

COMMIT;