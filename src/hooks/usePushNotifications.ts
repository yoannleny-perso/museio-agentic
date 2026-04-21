import { useEffect, useCallback } from 'react';
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildJobsRoute, JOB_TAB, type JobTab } from '@/contracts';

export const usePushNotifications = (userId: string | undefined, navigate: (path: string) => void) => {
  const { toast } = useToast();

  const registerNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) {
      return;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.error('[Push Notifications] Permission not granted');
        return;
      }

      // Register with FCM
      await PushNotifications.register();
    } catch (error) {
      console.error('[Push Notifications] Registration error:', error);
    }
  }, [userId]);

  const storeFcmToken = useCallback(async (token: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', userId);

      if (error) {
        console.error('[Push Notifications] Error storing FCM token:', error);
      }
    } catch (error) {
      console.error('[Push Notifications] Error storing FCM token:', error);
    }
  }, [userId]);

  const addListeners = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    // Use standard Capacitor Push Notifications for both platforms
    PushNotifications.addListener('registration', async () => {
      const result = await FCM.getToken();
      storeFcmToken(result.token);
    });

    // Registration error (both platforms)
    PushNotifications.addListener('registrationError', (error: unknown) => {
      console.error('[Push Notifications] Registration error:', error);
    });

    // Notification received while app is in foreground (both platforms)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      toast({
        title: notification.title || 'New Notification',
        description: notification.body,
      });
    });

    // Notification tapped (both platforms)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      // Extract notification type from data
      const notificationType = notification.notification.data?.type;
      
      // Determine which tab to navigate to based on notification type
      let targetTab: JobTab = JOB_TAB.upcoming;
      
      if (notificationType === 'booking_request') {
        targetTab = JOB_TAB.requests;
      } else if (notificationType === 'payment_received' || notificationType === 'job_paid') {
        targetTab = JOB_TAB.paid;
      }

      navigate(buildJobsRoute(targetTab));
    });
  }, [navigate, storeFcmToken, toast]);

  useEffect(() => {
    if (!userId) return;

    addListeners();
    registerNotifications();

    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [userId, registerNotifications, addListeners]);

  return {
    registerNotifications,
  };
};
