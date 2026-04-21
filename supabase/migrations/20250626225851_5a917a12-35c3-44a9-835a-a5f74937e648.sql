
-- Delete all data for user m.moustaqil@gmail.com (ID: 3a0843ea-0993-49d6-ab61-18747a18feea)
-- This must be done in the correct order to respect foreign key constraints

BEGIN;

-- First, let's verify the user exists and get their ID
DO $$
DECLARE
    target_user_id UUID := '3a0843ea-0993-49d6-ab61-18747a18feea';
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

-- Step 1: Delete user_signatures
DELETE FROM public.user_signatures 
WHERE user_id = '3a0843ea-0993-49d6-ab61-18747a18feea';

-- Step 2: Delete user_onboarding
DELETE FROM public.user_onboarding 
WHERE user_id = '3a0843ea-0993-49d6-ab61-18747a18feea';

-- Step 3: Delete profiles
DELETE FROM public.profiles 
WHERE id = '3a0843ea-0993-49d6-ab61-18747a18feea';

-- Step 4: Finally delete from auth.users (this will cascade any remaining references)
DELETE FROM auth.users 
WHERE id = '3a0843ea-0993-49d6-ab61-18747a18feea' AND email = 'm.moustaqil@gmail.com';

-- Verify deletion completed
DO $$
DECLARE
    remaining_records INTEGER := 0;
BEGIN
    -- Check if any records remain in public tables
    SELECT COUNT(*) INTO remaining_records FROM (
        SELECT user_id FROM public.user_signatures WHERE user_id = '3a0843ea-0993-49d6-ab61-18747a18feea'
        UNION ALL
        SELECT user_id FROM public.user_onboarding WHERE user_id = '3a0843ea-0993-49d6-ab61-18747a18feea'
        UNION ALL
        SELECT id FROM public.profiles WHERE id = '3a0843ea-0993-49d6-ab61-18747a18feea'
    ) remaining;
    
    IF remaining_records > 0 THEN
        RAISE EXCEPTION 'Deletion incomplete: % records still exist', remaining_records;
    END IF;
    
    RAISE NOTICE 'Successfully deleted all data for user m.moustaqil@gmail.com (ID: 3a0843ea-0993-49d6-ab61-18747a18feea)';
END $$;

COMMIT;
