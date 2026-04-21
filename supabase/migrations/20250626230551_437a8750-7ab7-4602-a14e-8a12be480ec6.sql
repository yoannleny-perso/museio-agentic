
-- Delete all data for user ivan.guelton@audaciangroup.com (ID: 5cf69729-aa47-4470-a5dc-02d77a131dfc)
-- This must be done in the correct order to respect foreign key constraints

BEGIN;

-- First, let's verify the user exists and get their ID
DO $$
DECLARE
    target_user_id UUID := '5cf69729-aa47-4470-a5dc-02d77a131dfc';
    user_email TEXT := 'ivan.guelton@audaciangroup.com';
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

-- Step 1: Delete jobs first (to avoid foreign key constraint issues)
DELETE FROM public.jobs 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 2: Delete sent_invoices if any exist for this user
DELETE FROM public.sent_invoices 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 3: Delete user_invoice_sequences
DELETE FROM public.user_invoice_sequences 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 4: Delete invoice_settings
DELETE FROM public.invoice_settings 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 5: Delete bank_details
DELETE FROM public.bank_details 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 6: Delete notification_settings
DELETE FROM public.notification_settings 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 7: Delete user_signatures
DELETE FROM public.user_signatures 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 8: Delete user_onboarding
DELETE FROM public.user_onboarding 
WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 9: Delete profiles
DELETE FROM public.profiles 
WHERE id = '5cf69729-aa47-4470-a5dc-02d77a131dfc';

-- Step 10: Finally delete from auth.users (this will cascade any remaining references)
DELETE FROM auth.users 
WHERE id = '5cf69729-aa47-4470-a5dc-02d77a131dfc' AND email = 'ivan.guelton@audaciangroup.com';

-- Verify deletion completed
DO $$
DECLARE
    remaining_records INTEGER := 0;
BEGIN
    -- Check if any records remain in public tables
    SELECT COUNT(*) INTO remaining_records FROM (
        SELECT user_id FROM public.jobs WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.sent_invoices WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.user_invoice_sequences WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.invoice_settings WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.bank_details WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.notification_settings WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.user_signatures WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT user_id FROM public.user_onboarding WHERE user_id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
        UNION ALL
        SELECT id FROM public.profiles WHERE id = '5cf69729-aa47-4470-a5dc-02d77a131dfc'
    ) remaining;
    
    IF remaining_records > 0 THEN
        RAISE EXCEPTION 'Deletion incomplete: % records still exist', remaining_records;
    END IF;
    
    RAISE NOTICE 'Successfully deleted all data for user ivan.guelton@audaciangroup.com (ID: 5cf69729-aa47-4470-a5dc-02d77a131dfc)';
END $$;

COMMIT;
