
-- Delete all data for user laetitia.potrat@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'laetitia.potrat@gmail.com';
    
    -- Only proceed if user exists
    IF target_user_id IS NOT NULL THEN
        -- Delete from user_onboarding
        DELETE FROM public.user_onboarding WHERE user_id = target_user_id;
        
        -- Delete from profiles
        DELETE FROM public.profiles WHERE id = target_user_id;
        
        -- Finally, delete the user from auth.users (this will cascade any remaining references)
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'Successfully deleted all data for user: laetitia.potrat@gmail.com (ID: %)', target_user_id;
    ELSE
        RAISE NOTICE 'User laetitia.potrat@gmail.com not found';
    END IF;
END $$;
