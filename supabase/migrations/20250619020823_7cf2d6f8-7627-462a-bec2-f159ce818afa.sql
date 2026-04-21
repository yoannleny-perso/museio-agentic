
-- Delete all data for user m.moustaqil@gmail.com (ID: 481dd02f-a07d-42c2-a425-372671905670)
-- This must be done in the correct order to respect foreign key constraints

BEGIN;

-- First, let's verify the user exists and get their ID
DO $$
DECLARE
    target_user_id UUID := '481dd02f-a07d-42c2-a425-372671905670';
    user_email TEXT := 'm.moustaqil@gmail.com';
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

-- Step 1: Delete sent_invoices (references jobs via job_id)
DELETE FROM public.sent_invoices 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 2: Delete jobs (main user content)
DELETE FROM public.jobs 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 3: Delete user_signatures
DELETE FROM public.user_signatures 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 4: Delete user_onboarding
DELETE FROM public.user_onboarding 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 5: Delete user_invoice_sequences
DELETE FROM public.user_invoice_sequences 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 6: Delete notification_settings
DELETE FROM public.notification_settings 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 7: Delete bank_details
DELETE FROM public.bank_details 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 8: Delete invoice_settings
DELETE FROM public.invoice_settings 
WHERE user_id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 9: Delete profiles
DELETE FROM public.profiles 
WHERE id = '481dd02f-a07d-42c2-a425-372671905670';

-- Step 10: Finally delete from auth.users (this will cascade any remaining references)
DELETE FROM auth.users 
WHERE id = '481dd02f-a07d-42c2-a425-372671905670' AND email = 'm.moustaqil@gmail.com';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully deleted all data for user m.moustaqil@gmail.com (ID: 481dd02f-a07d-42c2-a425-372671905670)';
END $$;

COMMIT;
