import { useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { useProfile } from '@/context/ProfileContext';
import { useBankDetails } from '@/context/BankDetailsContext';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { useAuth } from '@/context/auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNavigate } from 'react-router-dom';


export const CapacitorAppStateManager = () => {
  const { user } = useAuth();
  const { fetchJobs } = useAppContext();
  const { refreshProfile } = useProfile();
  const { refreshBankDetails } = useBankDetails();
  const { refreshInvoiceSettings } = useInvoiceSettings();
  const { refreshSettings } = useNotificationSettings();
  const { fetchClients } = useSupabaseClients();
  const navigate = useNavigate();

  const hasSetUpRef = useRef(false);
  
  // Initialize push notifications
  usePushNotifications(user?.id, navigate);

  useEffect(() => {

    if (hasSetUpRef.current)
      return; // Prevent multiple setups
    if (user && !hasSetUpRef.current) {
      hasSetUpRef.current = true;
    }
    
    let listener: PluginListenerHandle | null = null;

    const forceRefreshJWTToken = async (): Promise<boolean> => {
      try {
        console.log('[Capacitor] Force refreshing JWT token...');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error('[Capacitor] JWT token refresh failed:', error);
          return false;
        }

        console.log('[Capacitor] JWT token refreshed successfully');
        return true;
      } catch (error) {
        console.error('[Capacitor] JWT token refresh error:', error);
        return false;
      }
    };

    const forceRefreshAllData = async () => {
      if (!user) {
        console.log('[Capacitor] No authenticated user, skipping data refresh');
        return;
      }

      console.log('[Capacitor] Force refreshing all user data...');

      const refreshPromises = [
        fetchJobs(true).catch(error => console.error('[Capacitor] Jobs refresh failed:', error)),
        refreshProfile().catch(error => console.error('[Capacitor] Profile refresh failed:', error)),
        refreshBankDetails().catch(error => console.error('[Capacitor] Bank details refresh failed:', error)),
        refreshInvoiceSettings().catch(error => console.error('[Capacitor] Invoice settings refresh failed:', error)),
        refreshSettings().catch(error => console.error('[Capacitor] Notification settings refresh failed:', error)),
        fetchClients().catch(error => console.error('[Capacitor] Clients refresh failed:', error)),
      ];

      const results = await Promise.allSettled(refreshPromises);

      const names = ['Jobs', 'Profile', 'Bank Details', 'Invoice Settings', 'Notification Settings', 'Clients'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Capacitor] ${names[index]} refresh failed:`, result.reason);
        } else {
          console.log(`[Capacitor] ${names[index]} refresh completed`);
        }
      });

      console.log('[Capacitor] All data refresh attempts completed');
    };

    const setupListener = async () => {
      const handle = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && user) {
          console.log('[Capacitor] App resumed – refreshing session and data...');

          const tokenRefreshed = await forceRefreshJWTToken();
          await forceRefreshAllData();

          if (tokenRefreshed) {
            console.log('[Capacitor] App resume refresh completed successfully');
          } else {
            console.log('[Capacitor] App resume refresh completed with token refresh issues');
          }
        }
      });

      listener = handle;
    };

    if (user) {
      setupListener();
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [
    user,
    fetchJobs,
    refreshProfile,
    refreshBankDetails,
    refreshInvoiceSettings,
    refreshSettings,
    fetchClients,
  ]);

  return null;
};
