
-- Comprehensive user and app usage statistics
WITH user_stats AS (
  SELECT 
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.created_at as user_signup_date,
    COUNT(j.id) as total_jobs,
    COUNT(CASE WHEN j.status = 'upcoming' THEN 1 END) as upcoming_jobs,
    COUNT(CASE WHEN j.status = 'past' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN j.status = 'paid' THEN 1 END) as paid_jobs,
    COUNT(CASE WHEN j.status = 'invoice-sent' THEN 1 END) as invoiced_jobs,
    COUNT(CASE WHEN j.date > CURRENT_DATE THEN 1 END) as future_jobs,
    COUNT(CASE WHEN j.date < CURRENT_DATE THEN 1 END) as past_jobs_by_date,
    COALESCE(SUM(j.rate), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN j.status = 'paid' THEN j.rate ELSE 0 END), 0) as confirmed_earnings,
    MIN(j.date) as first_job_date,
    MAX(j.date) as latest_job_date
  FROM profiles p
  LEFT JOIN jobs j ON p.id = j.user_id
  GROUP BY p.id, p.email, p.first_name, p.last_name, p.created_at
),
invoice_stats AS (
  SELECT 
    user_id,
    COUNT(*) as invoices_sent,
    SUM(amount) as total_invoiced_amount
  FROM sent_invoices
  GROUP BY user_id
),
onboarding_stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_onboarding,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profile,
    COUNT(CASE WHEN bank_details_completed = true THEN 1 END) as completed_bank_details,
    COUNT(CASE WHEN invoice_setup_completed = true THEN 1 END) as completed_invoice_setup,
    COUNT(CASE WHEN has_seen_welcome_popup = true THEN 1 END) as seen_welcome
  FROM user_onboarding
)

-- Main query combining all statistics
SELECT 
  'USER_SUMMARY' as metric_type,
  json_build_object(
    'total_users', COUNT(us.user_id),
    'active_users_with_jobs', COUNT(CASE WHEN us.total_jobs > 0 THEN 1 END),
    'users_with_future_jobs', COUNT(CASE WHEN us.future_jobs > 0 THEN 1 END),
    'users_with_earnings', COUNT(CASE WHEN us.total_earnings > 0 THEN 1 END),
    'average_jobs_per_user', ROUND(AVG(us.total_jobs), 2),
    'total_jobs_created', SUM(us.total_jobs),
    'total_platform_earnings', SUM(us.total_earnings),
    'total_confirmed_earnings', SUM(us.confirmed_earnings)
  ) as data
FROM user_stats us

UNION ALL

SELECT 
  'JOB_STATUS_BREAKDOWN' as metric_type,
  json_build_object(
    'upcoming_jobs', SUM(us.upcoming_jobs),
    'completed_jobs', SUM(us.completed_jobs),
    'paid_jobs', SUM(us.paid_jobs),
    'invoiced_jobs', SUM(us.invoiced_jobs),
    'future_jobs_by_date', SUM(us.future_jobs),
    'past_jobs_by_date', SUM(us.past_jobs_by_date)
  ) as data
FROM user_stats us

UNION ALL

SELECT 
  'ONBOARDING_COMPLETION' as metric_type,
  json_build_object(
    'total_users', os.total_users,
    'completed_onboarding_percent', ROUND((os.completed_onboarding::float / os.total_users * 100), 2),
    'completed_profile_percent', ROUND((os.completed_profile::float / os.total_users * 100), 2),
    'completed_bank_details_percent', ROUND((os.completed_bank_details::float / os.total_users * 100), 2),
    'completed_invoice_setup_percent', ROUND((os.completed_invoice_setup::float / os.total_users * 100), 2),
    'seen_welcome_percent', ROUND((os.seen_welcome::float / os.total_users * 100), 2)
  ) as data
FROM onboarding_stats os

UNION ALL

SELECT 
  'TOP_USERS_BY_ACTIVITY' as metric_type,
  json_agg(
    json_build_object(
      'email', email,
      'name', COALESCE(first_name || ' ' || last_name, 'Unknown'),
      'total_jobs', total_jobs,
      'total_earnings', total_earnings,
      'confirmed_earnings', confirmed_earnings,
      'signup_date', user_signup_date
    ) ORDER BY total_jobs DESC
  ) as data
FROM (
  SELECT * FROM user_stats 
  WHERE total_jobs > 0 
  ORDER BY total_jobs DESC 
  LIMIT 10
) top_users

ORDER BY metric_type;
