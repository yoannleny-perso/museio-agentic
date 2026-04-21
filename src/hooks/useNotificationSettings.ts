
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/context/auth';

interface NotificationSettings {
  sendJobConfirmation: boolean;
  sendJobUpdates: boolean;
  sendJobCancellations: boolean;
  receiveEmailCopies: boolean;
  receivePushNotifications: boolean;
}

// Define the database schema for notification_settings
interface NotificationSettingsRecord {
  id: string;
  user_id: string;
  send_job_confirmation: boolean;
  send_job_updates: boolean;
  send_job_cancellations: boolean;
  receive_email_copies: boolean;
  receive_push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  sendJobConfirmation: true,
  sendJobUpdates: true,
  sendJobCancellations: true,
  receiveEmailCopies: true,
  receivePushNotifications: true,
};

export const useNotificationSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  
  // Default settings
  // Function to fetch notification settings from the database
  const fetchNotificationSettings = useCallback(async () => {
    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use type assertion to handle the table not being in the Supabase types
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as { data: NotificationSettingsRecord | null, error: any };
      
      if (error) throw error;
      
      if (data) {
        // Transform database field names to our interface names
        setSettings({
          sendJobConfirmation: data.send_job_confirmation,
          sendJobUpdates: data.send_job_updates,
          sendJobCancellations: data.send_job_cancellations,
          receiveEmailCopies: data.receive_email_copies,
          receivePushNotifications: data.receive_push_notifications
        });
      } else {
        // No settings found, use defaults
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('[useNotificationSettings] Error fetching settings:', err);
      setError(err.message || "Failed to load notification settings");
      setSettings(DEFAULT_NOTIFICATION_SETTINGS); // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Update notification settings
  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to update settings.",
        variant: "destructive"
      });
      return false;
    }
    
    setIsSaving(true);
    
    try {
      // Merge new settings with current settings to ensure all fields are present
      const currentSettings = settings || DEFAULT_NOTIFICATION_SETTINGS;
      const mergedSettings = {
        ...currentSettings,
        ...newSettings
      };
      
      // First, check if a record already exists to get its ID
      const { data: existingRecord, error: fetchError } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null, error: any };
      
      if (fetchError) {
        console.error('[useNotificationSettings] Error fetching existing record:', fetchError);
      }
      
      // Map our interface names to database field names
      const dbSettings: any = {
        user_id: user.id,
        send_job_confirmation: mergedSettings.sendJobConfirmation,
        send_job_updates: mergedSettings.sendJobUpdates,
        send_job_cancellations: mergedSettings.sendJobCancellations,
        receive_email_copies: mergedSettings.receiveEmailCopies,
        receive_push_notifications: mergedSettings.receivePushNotifications
      };
      
      // Include the ID if updating an existing record
      if (existingRecord?.id) {
        dbSettings.id = existingRecord.id;
      }
      
      console.log('[useNotificationSettings] Upserting settings:', dbSettings);
      
      // Use type assertion to handle the table not being in the Supabase types
      const { error } = await supabase
        .from('notification_settings')
        .upsert(dbSettings) as { error: any };
      
      if (error) throw error;
      
      // Update local state with merged settings
      setSettings(mergedSettings);

      
      return true;
    } catch (error: any) {
      console.error('[useNotificationSettings] Error updating settings:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification settings.',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fetch settings when component mounts or user changes
  useEffect(() => {
    void fetchNotificationSettings();
  }, [fetchNotificationSettings]);
  
  // Extract values for easier access
  const sendJobConfirmation = settings?.sendJobConfirmation ?? DEFAULT_NOTIFICATION_SETTINGS.sendJobConfirmation;
  const sendJobUpdates = settings?.sendJobUpdates ?? DEFAULT_NOTIFICATION_SETTINGS.sendJobUpdates;
  const sendJobCancellations = settings?.sendJobCancellations ?? DEFAULT_NOTIFICATION_SETTINGS.sendJobCancellations;
  const receiveEmailCopies = settings?.receiveEmailCopies ?? DEFAULT_NOTIFICATION_SETTINGS.receiveEmailCopies;
  const receivePushNotifications = settings?.receivePushNotifications ?? DEFAULT_NOTIFICATION_SETTINGS.receivePushNotifications;
  
  return {
    settings,
    sendJobConfirmation,
    sendJobUpdates,
    sendJobCancellations,
    receiveEmailCopies,
    receivePushNotifications,
    isLoading,
    error,
    updateNotificationSettings,
    isSaving,
    refreshSettings: fetchNotificationSettings
  };
};
