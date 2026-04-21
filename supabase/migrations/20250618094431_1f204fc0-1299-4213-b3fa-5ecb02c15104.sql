
-- Remove banking information for ivan.guelton@gmail.com
-- First, delete the bank details record
DELETE FROM bank_details 
WHERE user_id = '163c8717-d316-43ed-8cff-95342bcb85c9';

-- Update the onboarding status to reflect that bank details are no longer completed
UPDATE user_onboarding 
SET 
  bank_details_completed = false,
  updated_at = now()
WHERE user_id = '163c8717-d316-43ed-8cff-95342bcb85c9';
