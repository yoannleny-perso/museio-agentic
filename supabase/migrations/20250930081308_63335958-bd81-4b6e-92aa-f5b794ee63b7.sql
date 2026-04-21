-- Complete deletion of user data for ivan.guelton@gmail.com
-- User ID: 7c51b022-e19c-411e-b6c4-f481e044fc2e

BEGIN;

-- 1. Delete dependent records first (to avoid foreign key constraint violations)
DELETE FROM public.job_items WHERE job_id IN (SELECT id FROM public.jobs WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e');
DELETE FROM public.booking_requests WHERE portfolio_user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.invoice_payments WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.sent_invoices WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';

-- 2. Delete main user data
DELETE FROM public.jobs WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.clients WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.portfolio_events WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.portfolio_featured_cards WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.portfolio_music_releases WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.portfolio_photos WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.portfolio_videos WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_availability WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_availability_repeat_settings WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_availability_settings WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_vacation_periods WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.smart_links WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_signatures WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.invoice_settings WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_invoice_sequences WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.bank_details WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.notification_settings WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.user_onboarding WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';

-- 3. Delete profile and portfolio settings
DELETE FROM public.portfolio_settings WHERE user_id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';
DELETE FROM public.profiles WHERE id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';

-- 4. Delete from auth.users (this will cascade to any remaining references)
DELETE FROM auth.users WHERE id = '7c51b022-e19c-411e-b6c4-f481e044fc2e';

COMMIT;