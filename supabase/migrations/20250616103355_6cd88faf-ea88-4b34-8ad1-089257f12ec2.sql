
-- First, get the user ID for e_marque@hotmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'e_marque@hotmail.com';
    
    -- Only proceed if user exists
    IF target_user_id IS NOT NULL THEN
        -- Delete from sent_invoices (has foreign key to jobs)
        DELETE FROM public.sent_invoices WHERE user_id = target_user_id;
        
        -- Delete from jobs
        DELETE FROM public.jobs WHERE user_id = target_user_id;
        
        -- Delete from user_signatures
        DELETE FROM public.user_signatures WHERE user_id = target_user_id;
        
        -- Delete from user_onboarding
        DELETE FROM public.user_onboarding WHERE user_id = target_user_id;
        
        -- Delete from user_invoice_sequences
        DELETE FROM public.user_invoice_sequences WHERE user_id = target_user_id;
        
        -- Delete from notification_settings
        DELETE FROM public.notification_settings WHERE user_id = target_user_id;
        
        -- Delete from invoice_settings
        DELETE FROM public.invoice_settings WHERE user_id = target_user_id;
        
        -- Delete from bank_details
        DELETE FROM public.bank_details WHERE user_id = target_user_id;
        
        -- Delete from profiles
        DELETE FROM public.profiles WHERE id = target_user_id;
        
        -- Finally, delete the user from auth.users (this will cascade any remaining references)
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'Successfully deleted all data for user: e_marque@hotmail.com (ID: %)', target_user_id;
    ELSE
        RAISE NOTICE 'User e_marque@hotmail.com not found';
    END IF;
END $$;
