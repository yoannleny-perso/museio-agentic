-- RLS Performance Optimization: Replace auth.uid() with (SELECT auth.uid())
-- This prevents re-evaluation of auth functions for each row

-- Fix clients table policies
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

CREATE POLICY "clients_select_policy" ON public.clients
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "clients_insert_policy" ON public.clients
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "clients_update_policy" ON public.clients
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "clients_delete_policy" ON public.clients
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Fix booking_requests table policies
DROP POLICY IF EXISTS "Portfolio owners can update their booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Portfolio owners can delete their booking requests" ON public.booking_requests;

CREATE POLICY "Portfolio owners can update their booking requests" ON public.booking_requests
FOR UPDATE USING ((SELECT auth.uid()) = portfolio_user_id);

CREATE POLICY "Portfolio owners can delete their booking requests" ON public.booking_requests
FOR DELETE USING ((SELECT auth.uid()) = portfolio_user_id);

-- Fix job_items table policies
DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can create job items for their own jobs" ON public.job_items;
DROP POLICY IF EXISTS "Users can update their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can delete their own job items" ON public.job_items;

CREATE POLICY "Users can view their own job items" ON public.job_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = job_items.job_id AND jobs.user_id = (SELECT auth.uid())
));

CREATE POLICY "Users can create job items for their own jobs" ON public.job_items
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = job_items.job_id AND jobs.user_id = (SELECT auth.uid())
));

CREATE POLICY "Users can update their own job items" ON public.job_items
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = job_items.job_id AND jobs.user_id = (SELECT auth.uid())
));

CREATE POLICY "Users can delete their own job items" ON public.job_items
FOR DELETE USING (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = job_items.job_id AND jobs.user_id = (SELECT auth.uid())
));

-- Fix portfolio_events table policies
DROP POLICY IF EXISTS "Users can manage their own events" ON public.portfolio_events;

CREATE POLICY "Users can manage their own events" ON public.portfolio_events
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix portfolio_featured_cards table policies
DROP POLICY IF EXISTS "Users can manage their own featured cards" ON public.portfolio_featured_cards;

CREATE POLICY "Users can manage their own featured cards" ON public.portfolio_featured_cards
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix portfolio_music_releases table policies
DROP POLICY IF EXISTS "Users can manage their own music releases" ON public.portfolio_music_releases;

CREATE POLICY "Users can manage their own music releases" ON public.portfolio_music_releases
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix portfolio_photos table policies
DROP POLICY IF EXISTS "Users can manage their own photos" ON public.portfolio_photos;

CREATE POLICY "Users can manage their own photos" ON public.portfolio_photos
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix portfolio_settings table policies
DROP POLICY IF EXISTS "Users can manage their own portfolio settings" ON public.portfolio_settings;

CREATE POLICY "Users can manage their own portfolio settings" ON public.portfolio_settings
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix portfolio_videos table policies
DROP POLICY IF EXISTS "Users can manage their own videos" ON public.portfolio_videos;

CREATE POLICY "Users can manage their own videos" ON public.portfolio_videos
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix smart_links table policies
DROP POLICY IF EXISTS "Users can view their own smart links" ON public.smart_links;
DROP POLICY IF EXISTS "Users can create their own smart links" ON public.smart_links;
DROP POLICY IF EXISTS "Users can update their own smart links" ON public.smart_links;
DROP POLICY IF EXISTS "Users can delete their own smart links" ON public.smart_links;

CREATE POLICY "Users can view their own smart links" ON public.smart_links
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own smart links" ON public.smart_links
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own smart links" ON public.smart_links
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own smart links" ON public.smart_links
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Fix user_availability table policies
DROP POLICY IF EXISTS "Users can manage their own availability" ON public.user_availability;

CREATE POLICY "Users can manage their own availability" ON public.user_availability
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Fix user_availability_repeat_settings table policies
DROP POLICY IF EXISTS "Users can view their own repeat settings" ON public.user_availability_repeat_settings;
DROP POLICY IF EXISTS "Users can create their own repeat settings" ON public.user_availability_repeat_settings;
DROP POLICY IF EXISTS "Users can update their own repeat settings" ON public.user_availability_repeat_settings;
DROP POLICY IF EXISTS "Users can delete their own repeat settings" ON public.user_availability_repeat_settings;

CREATE POLICY "Users can view their own repeat settings" ON public.user_availability_repeat_settings
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own repeat settings" ON public.user_availability_repeat_settings
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own repeat settings" ON public.user_availability_repeat_settings
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own repeat settings" ON public.user_availability_repeat_settings
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Fix user_availability_settings table policies
DROP POLICY IF EXISTS "Users can view their own availability settings" ON public.user_availability_settings;
DROP POLICY IF EXISTS "Users can insert their own availability settings" ON public.user_availability_settings;
DROP POLICY IF EXISTS "Users can update their own availability settings" ON public.user_availability_settings;
DROP POLICY IF EXISTS "Users can delete their own availability settings" ON public.user_availability_settings;

CREATE POLICY "Users can view their own availability settings" ON public.user_availability_settings
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own availability settings" ON public.user_availability_settings
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own availability settings" ON public.user_availability_settings
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own availability settings" ON public.user_availability_settings
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Fix user_vacation_periods table policies
DROP POLICY IF EXISTS "Users can view their own vacation periods" ON public.user_vacation_periods;
DROP POLICY IF EXISTS "Users can insert their own vacation periods" ON public.user_vacation_periods;
DROP POLICY IF EXISTS "Users can update their own vacation periods" ON public.user_vacation_periods;
DROP POLICY IF EXISTS "Users can delete their own vacation periods" ON public.user_vacation_periods;

CREATE POLICY "Users can view their own vacation periods" ON public.user_vacation_periods
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own vacation periods" ON public.user_vacation_periods
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own vacation periods" ON public.user_vacation_periods
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own vacation periods" ON public.user_vacation_periods
FOR DELETE USING ((SELECT auth.uid()) = user_id);