-- Add FCM token column to profiles table for push notifications
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add push notification preference to notification_settings table
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS receive_push_notifications BOOLEAN DEFAULT true;