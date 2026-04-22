
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const useAuthActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Enhanced cleanup function for auth state
   */
  const cleanupAuthState = () => {
    try {
      // Remove all Supabase auth keys from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Remove from sessionStorage if in use
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
      
    } catch (error) {
      console.warn('[AUTH_UTILS] Error during auth state cleanup:', error);
    }
  };

  const signInWithGoogle = async (isAuthenticating: boolean, setIsAuthenticating: (value: boolean) => void) => {
    try {
      setIsAuthenticating(true);
      cleanupAuthState();

      const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account', // Forces Google to always show account selector
            access_type: 'offline',   // Request a refresh token
          }
        }
      });
      
      if (error) {
        setIsAuthenticating(false);
        throw error;
      }
      void data;
      
      toast({
        title: 'Redirecting to Google',
        description: 'Please wait while we redirect you to the Google sign-in page',
      });
      
    } catch (error: any) {
      setIsAuthenticating(false);
      toast({
        title: 'Error signing in',
        description: error.message || 'An error occurred during sign in.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string, setIsAuthenticating: (value: boolean) => void) => {
    try {
      setIsAuthenticating(true);
      cleanupAuthState();

      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.request({
          url: `${SUPABASE_URL}/auth/v1/token`,
          method: 'POST',
          params: {
            grant_type: 'password',
          },
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          data: {
            email,
            password,
          },
        });

        const responseError =
          response.status >= 400
            ? response.data?.error_description ||
              response.data?.msg ||
              response.data?.error ||
              `Request failed with status ${response.status}`
            : null;

        if (responseError) {
          setIsAuthenticating(false);
          throw new Error(responseError);
        }

        const accessToken = response.data?.access_token;
        const refreshToken = response.data?.refresh_token;

        if (!accessToken || !refreshToken) {
          setIsAuthenticating(false);
          throw new Error('Supabase did not return a valid session.');
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setIsAuthenticating(false);
          throw error;
        }

        void data;
        navigate('/app/home');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setIsAuthenticating(false);
        throw error;
      }
      void data;
      navigate('/app/home');
      
    } catch (error: any) {
      setIsAuthenticating(false);
      toast({
        title: 'Error signing in',
        description: error.message || 'An error occurred during sign in.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, setIsAuthenticating: (value: boolean) => void) => {
    try {
      setIsAuthenticating(true);
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        setIsAuthenticating(false);
        throw error;
      }
      setIsAuthenticating(false);
      
      if (data.user?.identities?.length === 0) {
        // User already exists
        toast({
          title: 'Account exists',
          description: 'An account with this email already exists. Please sign in instead.',
        });
      } else {
        // New user created
        toast({
          title: 'Account created',
          description: 'Your account has been created. Please check your email for a confirmation link.',
        });
      }
      
    } catch (error: any) {
      setIsAuthenticating(false);
      toast({
        title: 'Error signing up',
        description: error.message || 'An error occurred during sign up.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.warn('Sign-out completed with warnings');
      }
      
    } catch (error: any) {
      console.warn('Sign-out process completed with errors');
    }
  };

  return {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut
  };
};
