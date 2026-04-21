
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthCallbackDebugInfo {
  hasHashParams: boolean;
  hasSearchParams: boolean;
  callbackType: string | null;
  errorCode: string | null;
  timestamp: string;
}

export const useAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState(true);
  const [debugInfo, setDebugInfo] = useState<AuthCallbackDebugInfo | null>(null);
  
  // Add new state to check if this is a password recovery flow
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorDescription = hashParams.get('error_description');
        const errorCode = hashParams.get('error');
        const searchParams = new URLSearchParams(window.location.search);
        const type = searchParams.get('type');
        const code = searchParams.get('code');

        if (type === 'recovery') {
          setIsPasswordRecovery(true);
          setProcessingAuth(false);
          return;
        }

        setDebugInfo({
          hasHashParams: hashParams.toString().length > 0,
          hasSearchParams: searchParams.toString().length > 0,
          callbackType: type,
          errorCode: errorCode,
          timestamp: new Date().toISOString()
        });
        
        if (errorDescription || errorCode) {
          const errorMsg = errorDescription || `Error code: ${errorCode}`;
          setError(errorMsg);
          setProcessingAuth(false);
          toast({
            title: 'Authentication Error',
            description: errorMsg,
            variant: 'destructive',
          });
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError(exchangeError.message);
            setProcessingAuth(false);
            toast({
              title: 'Authentication Error',
              description: exchangeError.message,
              variant: 'destructive',
            });
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          setProcessingAuth(false);
          toast({
            title: 'Authentication Error',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
        
        if (data.session) {
          setTimeout(() => {
            toast({
              title: 'Authentication Successful',
              description: 'You have been successfully signed in.',
            });
            navigate('/');
          }, 500);
        } else {
          const message = 'No session found. Please try signing in again.';
          setError(message);
          setProcessingAuth(false);
          toast({
            title: 'Authentication Error',
            description: message,
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        setProcessingAuth(false);
        toast({
          title: 'Authentication Error',
          description: err.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return {
    error,
    processingAuth,
    debugInfo,
    isPasswordRecovery
  };
};
