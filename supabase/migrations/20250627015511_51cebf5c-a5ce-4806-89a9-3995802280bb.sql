
-- Delete all data for user ivan.guelton@icloud.com (ID: 26ca6bfc-8f7f-4f18-af30-4202d2498c6d)
-- This must be done in the correct order to respect foreign key constraints

BEGIN;

-- First, let's verify the user exists and get their ID
DO $$
DECLARE
    target_user_id UUID := '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';
    user_email TEXT := 'ivan.guelton@icloud.com';
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = target_user_id AND email = user_email
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User with email % and ID % not found', user_email, target_user_id;
    END IF;
    
    RAISE NOTICE 'Starting deletion process for user: % (ID: %)', user_email, target_user_id;
END $$;

-- Step 1: Delete from invoice_settings (includes logo reference)
DELETE FROM public.invoice_settings 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 2: Delete from user_onboarding
DELETE FROM public.user_onboarding 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 3: Delete from profiles
DELETE FROM public.profiles 
WHERE id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 4: Delete from user_invoice_sequences if any exist
DELETE FROM public.user_invoice_sequences 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 5: Delete from notification_settings if any exist
DELETE FROM public.notification_settings 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 6: Delete from user_signatures if any exist
DELETE FROM public.user_signatures 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 7: Delete from bank_details if any exist
DELETE FROM public.bank_details 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 8: Delete any jobs (though none were found, this is for completeness)
DELETE FROM public.jobs 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 9: Delete any sent_invoices (though none were found, this is for completeness)
DELETE FROM public.sent_invoices 
WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d';

-- Step 10: Finally delete from auth.users (this will cascade any remaining references)
DELETE FROM auth.users 
WHERE id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d' AND email = 'ivan.guelton@icloud.com';

-- Verify deletion completed
DO $$
DECLARE
    remaining_records INTEGER := 0;
BEGIN
    -- Check if any records remain in public tables
    SELECT COUNT(*) INTO remaining_records FROM (
        SELECT user_id FROM public.invoice_settings WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.user_onboarding WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT id FROM public.profiles WHERE id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.user_invoice_sequences WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.notification_settings WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.user_signatures WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.bank_details WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.jobs WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
        UNION ALL
        SELECT user_id FROM public.sent_invoices WHERE user_id = '26ca6bfc-8f7f-4f18-af30-4202d2498c6d'
    ) remaining;
    
    IF remaining_records > 0 THEN
        RAISE EXCEPTION 'Deletion incomplete: % records still exist', remaining_records;
    END IF;
    
    RAISE NOTICE 'Successfully deleted all data for user ivan.guelton@icloud.com (ID: 26ca6bfc-8f7f-4f18-af30-4202d2498c6d)';
END $$;

COMMIT;
