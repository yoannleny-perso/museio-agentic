
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AuthContext from './AuthContext';
import { useAuthActions } from './authUtils';
import {
  captureException,
  clearMonitoringUser,
  setMonitoringTag,
  setMonitoringUser,
} from '@/lib/monitoring';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    signInWithGoogle: signInWithGoogleAction, 
    signInWithEmail: signInWithEmailAction,
    signUpWithEmail: signUpWithEmailAction,
    signOut: signOutAction 
  } = useAuthActions();
  
  // Add a reference to track if we've shown the sign-in notification already
  const hasShownSignInNotification = useRef(false);
  // Add a reference to track the previous auth state
  const previousAuthState = useRef<'SIGNED_IN' | 'SIGNED_OUT' | null>(null);
  // Add a reference to prevent navigation during path changes
  const navigationInProgress = useRef(false);
  // Add a reference to prevent navigation during path changes
  const currentPath = useRef(location.pathname);
  // Add refs for session monitoring
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshTimeout = useRef<NodeJS.Timeout | null>(null);

  // Memoized navigation function to prevent loops
  const safeNavigate = useCallback((path: string) => {
    if (navigationInProgress.current || currentPath.current === path) {
      return; // Skip navigation if already in progress or already on target path
    }
    navigationInProgress.current = true;
    currentPath.current = path;
    
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      navigate(path);
      // Reset the flag after a small delay to ensure navigation completed
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 100);
    }, 0);
  }, [navigate]);

  // Function to check if session is valid and not expired
  const isSessionValid = useCallback((currentSession: Session | null): boolean => {
    if (!currentSession) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = currentSession.expires_at;
    
    // Check if session is expired (with 5 minute buffer for refresh)
    if (expiresAt && expiresAt <= now + 300) {
      return false;
    }
    
    return true;
  }, []);

  // Enhanced session cleanup with better error handling
  const cleanupSession = useCallback(async () => {
    try {
      setSession(null);
      setUser(null);
      
      if (tokenRefreshTimeout.current) {
        clearTimeout(tokenRefreshTimeout.current);
        tokenRefreshTimeout.current = null;
      }
      
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
      
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('[AUTH] Error clearing localStorage:', error);
      }
      
    } catch (error) {
      console.error('[AUTH] Error during session cleanup:', error);
      captureException(error, {
        tags: {
          surface: 'auth',
          operation: 'cleanup-session',
        },
      });
    }
  }, []);

  // Function to schedule token refresh before expiry
  const scheduleTokenRefresh = useCallback((currentSession: Session | null) => {
    if (tokenRefreshTimeout.current) {
      clearTimeout(tokenRefreshTimeout.current);
      tokenRefreshTimeout.current = null;
    }
    
    if (!currentSession?.expires_at) return;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = currentSession.expires_at;
    const refreshTime = Math.max(0, (expiresAt - now - 300) * 1000); // Refresh 5 minutes before expiry
    
    if (refreshTime > 0) {
      tokenRefreshTimeout.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[AUTH] Proactive token refresh failed:', error);
            captureException(error, {
              tags: {
                surface: 'auth',
                operation: 'refresh-session',
              },
            });
            await cleanupSession();
            safeNavigate('/auth');
          } else {
            void data;
          }
        } catch (error) {
          console.error('[AUTH] Proactive token refresh error:', error);
          captureException(error, {
            tags: {
              surface: 'auth',
              operation: 'refresh-session',
            },
          });
          await cleanupSession();
          safeNavigate('/auth');
        }
      }, refreshTime);
    }
  }, [cleanupSession, safeNavigate]);

  // Enhanced session monitoring with better error handling
  const startSessionMonitoring = useCallback((currentSession: Session | null) => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }
    
    if (!currentSession) return;
    
    sessionCheckInterval.current = setInterval(async () => {
      try {
        if (!isSessionValid(currentSession)) {
          await cleanupSession();
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please sign in again.',
            variant: 'destructive',
          });
          safeNavigate('/auth');
        }
      } catch (error) {
        console.error('[AUTH] Error during session monitoring:', error);
        captureException(error, {
          tags: {
            surface: 'auth',
            operation: 'session-monitoring',
          },
        });
      }
    }, 120000); // Check every 2 minutes
  }, [isSessionValid, cleanupSession, toast, safeNavigate]);

  useEffect(() => {
    // Update current path ref when location changes
    currentPath.current = location.pathname;
  }, [location]);

  useEffect(() => {
    setMonitoringTag('auth_route', location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      setMonitoringUser({
        id: user.id,
        email: user.email ?? null,
        username:
          user.user_metadata?.preferred_username ??
          user.user_metadata?.full_name ??
          null,
      });
      setMonitoringTag('auth_state', 'authenticated');
      return;
    }

    clearMonitoringUser();
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (
          (currentSession?.user?.id === user?.id) && 
          (!!currentSession === !!session)
        ) {
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && currentSession) {
          previousAuthState.current = 'SIGNED_IN';
          
          // Validate the new session
          if (isSessionValid(currentSession)) {
            scheduleTokenRefresh(currentSession);
            startSessionMonitoring(currentSession);
            
            // Only navigate if not already in an authenticated route
            if (location.pathname === '/auth') {
              safeNavigate('/app/home');
            }
          } else {
            await cleanupSession();
            safeNavigate('/auth');
          }
        }
        
        if (event === 'TOKEN_REFRESHED' && currentSession) {
          if (isSessionValid(currentSession)) {
            scheduleTokenRefresh(currentSession);
            startSessionMonitoring(currentSession);
          } else {
            await cleanupSession();
            safeNavigate('/auth');
          }
        }
        
        if (event === 'SIGNED_OUT') {
          await cleanupSession();
          
          if (previousAuthState.current === 'SIGNED_IN' && !isAuthenticating) {
            toast({
              title: 'Signed out',
              description: 'You have successfully signed out.',
            });
            safeNavigate('/auth');
          }
          
          hasShownSignInNotification.current = false;
          previousAuthState.current = 'SIGNED_OUT';
        }
        
        if (event === 'PASSWORD_RECOVERY') {
          safeNavigate('/auth/callback?type=recovery');
        }
        
        setLoading(false);
      }
    );

    // Check for existing session with better error handling
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error('[AUTH] Error checking existing session:', error);
        captureException(error, {
          tags: {
            surface: 'auth',
            operation: 'get-session',
          },
        });
        setLoading(false);
        return;
      }
      
      if ((currentSession?.user?.id !== user?.id) || (!!currentSession !== !!session)) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession) {
          if (isSessionValid(currentSession)) {
            scheduleTokenRefresh(currentSession);
            startSessionMonitoring(currentSession);
            previousAuthState.current = 'SIGNED_IN';
          } else {
            cleanupSession();
            previousAuthState.current = 'SIGNED_OUT';
          }
        } else {
          previousAuthState.current = 'SIGNED_OUT';
        }
      }
      
      setLoading(false);
    }).catch(error => {
      console.error('Error checking session:', error);
      captureException(error, {
        tags: {
          surface: 'auth',
          operation: 'get-session',
        },
      });
      cleanupSession();
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (tokenRefreshTimeout.current) {
        clearTimeout(tokenRefreshTimeout.current);
      }
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [toast, isAuthenticating, safeNavigate, location.pathname, user, session, isSessionValid, scheduleTokenRefresh, startSessionMonitoring, cleanupSession]);

  // Memoized auth functions to prevent unnecessary re-renders
  const signInWithGoogle = useCallback(async () => {
    await signInWithGoogleAction(isAuthenticating, setIsAuthenticating);
  }, [signInWithGoogleAction, isAuthenticating]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAction(email, password, setIsAuthenticating);
  }, [signInWithEmailAction]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await signUpWithEmailAction(email, password, setIsAuthenticating);
  }, [signUpWithEmailAction]);

  const resetPassword = useCallback(async (email: string) => {
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      
      if (error) throw error;
      
      // Success is handled by the calling function
    } catch (error: any) {
      console.error('Error during password reset:', error);
      captureException(error, {
        tags: {
          surface: 'auth',
          operation: 'reset-password',
        },
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await cleanupSession();
    await signOutAction();
  }, [signOutAction, cleanupSession]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user, 
    session, 
    loading, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail,
    resetPassword,
    signOut
  }), [
    user, 
    session, 
    loading, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail,
    resetPassword,
    signOut
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
