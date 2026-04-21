
-- Query to get job count per user with their ID and email
SELECT 
  j.user_id,
  p.email,
  COUNT(j.id) as job_count
FROM jobs j
LEFT JOIN profiles p ON j.user_id = p.id
WHERE j.user_id IS NOT NULL
GROUP BY j.user_id, p.email
ORDER BY job_count DESC;
