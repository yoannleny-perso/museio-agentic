
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

export const useSessionMonitor = () => {
  const { session, signOut } = useAuth();
  const { toast } = useToast();
  const warningShownRef = useRef(false);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session) {
      // Clear monitoring if no session
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      warningShownRef.current = false;
      return;
    }

    // Start monitoring session expiry
    const startMonitoring = () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }

      monitorIntervalRef.current = setInterval(() => {
        if (!session?.expires_at) return;

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;
        const timeUntilExpiry = expiresAt - now;

        // Show warning 5 minutes before expiry
        if (timeUntilExpiry <= 300 && timeUntilExpiry > 0 && !warningShownRef.current) {
          warningShownRef.current = true;
          toast({
            title: 'Session Expiring Soon',
            description: 'Your session will expire in 5 minutes. Please save your work.',
            variant: 'destructive',
          });
        }

        // Auto sign out if session has expired
        if (timeUntilExpiry <= 0) {
          console.log('[SESSION_MONITOR] Session expired, signing out');
          signOut();
          
          if (monitorIntervalRef.current) {
            clearInterval(monitorIntervalRef.current);
            monitorIntervalRef.current = null;
          }
        }
      }, 30000); // Check every 30 seconds
    };

    startMonitoring();

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };
  }, [session, signOut, toast]);

  return null;
};
