
-- Targeted RLS Policy Cleanup - Remove Duplicate DELETE Policy on user_onboarding
-- This migration removes the old "Users can delete their own onboarding status" policy
-- while keeping the optimized "user_onboarding_delete_policy"

-- ===============================
-- DROP SPECIFIC PROBLEMATIC POLICY ON USER_ONBOARDING
-- ===============================

-- Drop the old policy that's causing the multiple permissive policies warning
DROP POLICY IF EXISTS "Users can delete their own onboarding status" ON public.user_onboarding;

-- ===============================
-- VERIFICATION COMMENT
-- ===============================
-- After this migration, the user_onboarding table should have exactly 4 policies:
-- 1. user_onboarding_select_policy (optimized)
-- 2. user_onboarding_insert_policy (optimized)  
-- 3. user_onboarding_update_policy (optimized)
-- 4. user_onboarding_delete_policy (optimized)
-- 
-- This eliminates the "Multiple Permissive Policies" warning for DELETE actions
