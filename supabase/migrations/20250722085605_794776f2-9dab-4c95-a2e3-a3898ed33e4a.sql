
-- Comprehensive deletion of all data for user ivan.guelton@gmail.com
-- This migration will delete data from all tables in the correct order to respect foreign key constraints

BEGIN;

DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'ivan.guelton@gmail.com';
    deletion_count INTEGER;
BEGIN
    -- Get the user ID and verify user exists
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users table', target_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Starting comprehensive deletion for user: % (ID: %)', target_email, target_user_id;
    
    -- Delete from job_items (references jobs)
    DELETE FROM public.job_items 
    WHERE job_id IN (SELECT id FROM public.jobs WHERE user_id = target_user_id);
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % job_items', deletion_count;
    
    -- Delete from sent_invoices
    DELETE FROM public.sent_invoices WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % sent_invoices', deletion_count;
    
    -- Delete from jobs
    DELETE FROM public.jobs WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % jobs', deletion_count;
    
    -- Delete from clients
    DELETE FROM public.clients WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % clients', deletion_count;
    
    -- Delete from smart_links
    DELETE FROM public.smart_links WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % smart_links', deletion_count;
    
    -- Delete from portfolio tables (working tables)
    DELETE FROM public.portfolio_events WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_events', deletion_count;
    
    DELETE FROM public.portfolio_featured_cards WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_featured_cards', deletion_count;
    
    DELETE FROM public.portfolio_music_releases WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_music_releases', deletion_count;
    
    DELETE FROM public.portfolio_photos WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_photos', deletion_count;
    
    DELETE FROM public.portfolio_videos WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_videos', deletion_count;
    
    DELETE FROM public.portfolio_settings WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_settings', deletion_count;
    
    -- Delete from portfolio production tables
    DELETE FROM public.portfolio_events_prod WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_events_prod', deletion_count;
    
    DELETE FROM public.portfolio_featured_cards_prod WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_featured_cards_prod', deletion_count;
    
    DELETE FROM public.portfolio_music_releases_prod WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_music_releases_prod', deletion_count;
    
    DELETE FROM public.portfolio_photos_prod WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_photos_prod', deletion_count;
    
    DELETE FROM public.portfolio_videos_prod WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_videos_prod', deletion_count;
    
    DELETE FROM public.portfolio_settings_prod WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % portfolio_settings_prod', deletion_count;
    
    -- Delete from user settings and profile tables
    DELETE FROM public.user_signatures WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_signatures', deletion_count;
    
    DELETE FROM public.user_onboarding WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_onboarding', deletion_count;
    
    DELETE FROM public.user_invoice_sequences WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_invoice_sequences', deletion_count;
    
    DELETE FROM public.notification_settings WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % notification_settings', deletion_count;
    
    DELETE FROM public.invoice_settings WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % invoice_settings', deletion_count;
    
    DELETE FROM public.bank_details WHERE user_id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % bank_details', deletion_count;
    
    DELETE FROM public.profiles WHERE id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % profiles', deletion_count;
    
    -- Finally, delete from auth.users (this will cascade any remaining references)
    DELETE FROM auth.users WHERE id = target_user_id;
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % auth.users', deletion_count;
    
    RAISE NOTICE 'Successfully completed comprehensive deletion for user: %', target_email;
END $$;

-- Verification: Check that no data remains for the deleted user
DO $$
DECLARE
    remaining_count INTEGER := 0;
    target_email TEXT := 'ivan.guelton@gmail.com';
    check_tables TEXT[] := ARRAY[
        'public.jobs', 'public.sent_invoices', 'public.clients', 'public.job_items',
        'public.portfolio_events', 'public.portfolio_featured_cards', 'public.portfolio_music_releases',
        'public.portfolio_photos', 'public.portfolio_videos', 'public.portfolio_settings',
        'public.portfolio_events_prod', 'public.portfolio_featured_cards_prod', 'public.portfolio_music_releases_prod',
        'public.portfolio_photos_prod', 'public.portfolio_videos_prod', 'public.portfolio_settings_prod',
        'public.user_signatures', 'public.user_onboarding', 'public.user_invoice_sequences',
        'public.notification_settings', 'public.invoice_settings', 'public.bank_details',
        'public.profiles', 'public.smart_links'
    ];
    table_name TEXT;
    table_count INTEGER;
BEGIN
    -- Check auth.users first
    SELECT COUNT(*) INTO table_count FROM auth.users WHERE email = target_email;
    IF table_count > 0 THEN
        RAISE WARNING 'Verification failed: % records still exist in auth.users', table_count;
        remaining_count := remaining_count + table_count;
    END IF;
    
    -- Check all other tables
    FOREACH table_name IN ARRAY check_tables
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %s WHERE user_id IN (SELECT id FROM auth.users WHERE email = %L)', 
                      table_name, target_email) INTO table_count;
        IF table_count > 0 THEN
            RAISE WARNING 'Verification failed: % records still exist in %', table_count, table_name;
            remaining_count := remaining_count + table_count;
        END IF;
    END LOOP;
    
    -- Special check for job_items (references jobs table)
    SELECT COUNT(*) INTO table_count 
    FROM public.job_items 
    WHERE job_id IN (
        SELECT j.id FROM public.jobs j 
        JOIN auth.users u ON j.user_id = u.id 
        WHERE u.email = target_email
    );
    IF table_count > 0 THEN
        RAISE WARNING 'Verification failed: % job_items records still exist', table_count;
        remaining_count := remaining_count + table_count;
    END IF;
    
    IF remaining_count = 0 THEN
        RAISE NOTICE 'Verification successful: No data remains for user %', target_email;
    ELSE
        RAISE WARNING 'Verification failed: Total of % records still exist for user %', remaining_count, target_email;
    END IF;
END $$;

COMMIT;
