
import React, { useState } from 'react';
import { useAuthCallback } from '@/hooks/useAuthCallback';
import AuthCallbackLoading from '@/components/auth/AuthCallbackLoading';
import AuthCallbackError from '@/components/auth/AuthCallbackError';
import TroubleshootingInfo from '@/components/auth/TroubleshootingInfo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

const AuthCallback = () => {
  const { error, processingAuth, debugInfo, isPasswordRecovery } = useAuthCallback();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePasswordReset = async (password: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated. You can now sign in with your new password.',
      });
      
      // Redirect to sign in page
      navigate('/auth');
      
    } catch (error: any) {
      console.error('[ERROR] Failed to update password:', error);
      toast({
        title: 'Error Updating Password',
        description: error.message || 'An error occurred while updating your password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPasswordRecovery) {
    return (
 <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-16 px-6 pb-12">
              <div className="container mx-auto max-w-lg text-center">        <div className="flex justify-center mb-6">
            <img 
              src="/museio-gradient-logo.svg" 
              alt="Museio Logo" 
              className="h-24 md:h-24"
            />
          </div>
        <div className="w-full max-w-md space-y-8 text-center bg-white p-8 shadow-md rounded-lg">
          <div>
            <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
            <p className="text-gray-600 mb-6">Please enter your new password below.</p>
          </div>
          
          <ResetPasswordForm 
            isLoading={isSubmitting}
            onSubmit={handlePasswordReset}
          />
        </div>
      </div>
      </section>
    </div>
    );
  }

  if (processingAuth) {
    return <AuthCallbackLoading />;
  }

  if (error) {
    return (
      <AuthCallbackError error={error}>
        <TroubleshootingInfo debugInfo={debugInfo} />
      </AuthCallbackError>
    );
  }

  return <AuthCallbackLoading />;
};

export default AuthCallback;
