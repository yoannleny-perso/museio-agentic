
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

const normalizeAuthErrorMessage = (error: unknown) => {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message)
        : '';

  const message = rawMessage || 'An unexpected authentication error occurred.';
  const isNetworkFailure = /load failed|failed to fetch|network request failed/i.test(message);

  if (!isNetworkFailure) {
    return message;
  }

  if (Capacitor.isNativePlatform()) {
    return 'Could not reach Supabase from the iOS simulator. This is usually a simulator HTTPS trust, VPN, or proxy issue. Try opening the Supabase URL in Simulator Safari, or disable SSL-inspecting VPN/proxy or trust the required root certificate, then try again.';
  }

  return 'Could not reach Supabase. Check your internet connection or proxy settings, then try again.';
};

export const useAuthPage = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to app
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);
  
  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      await signInWithGoogle();
      // The redirect will happen automatically via Supabase
      
      // We may not reach here because of the redirect, but just in case
      setTimeout(() => {
        // If we're still here after 5 seconds, something might be wrong
        if (isLoading) {
          setIsLoading(false);
          setError('Authentication redirect failed. Please check your browser settings and try again.');
        }
      }, 5000);
      
    } catch (error: any) {
      console.error('[ERROR] Google sign-in error:', error);
      const errorMessage = normalizeAuthErrorMessage(error);
      setError(errorMessage);
      toast({
        title: 'Error signing in',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithEmail(email, password);
      
      // No need for toast notification here as navigation will happen
      navigate('/app');
    } catch (error: any) {
      console.error('[ERROR] Email sign-in error:', error);
      const errorMessage = normalizeAuthErrorMessage(error);
      setError(errorMessage);
      toast({
        title: 'Error signing in',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await signUpWithEmail(email, password);
      
      toast({
        title: 'Success',
        description: 'Your account has been created. Please check your email to confirm your account.',
      });
      
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('[ERROR] Email sign-up error:', error);
      const errorMessage = normalizeAuthErrorMessage(error);
      setError(errorMessage);
      toast({
        title: 'Error signing up',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return { success: false };
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await resetPassword(email);
      
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists with this email, you will receive a password reset link.',
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('[ERROR] Password reset error:', error);
      const errorMessage = normalizeAuthErrorMessage(error);
      setError(errorMessage);
      toast({
        title: 'Error resetting password',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleGoogleSignIn,
    handleEmailSignIn,
    handleEmailSignUp,
    handlePasswordReset,
  };
};
