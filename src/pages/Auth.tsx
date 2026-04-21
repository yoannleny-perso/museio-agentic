
import React, { useState } from 'react';
import { Chrome } from 'lucide-react';
import AuthError from '@/components/auth/AuthError';
import EmailForm from '@/components/auth/EmailForm';
import { useAuthPage } from '@/hooks/useAuthPage';
import ConfirmEmail from '../components/auth/ConfirmEmail';
import PasswordResetEmailSent from '@/components/auth/PasswordResetEmailSent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const {
    isLoading,
    error,
    handleGoogleSignIn,
    handleEmailSignIn,
    handleEmailSignUp,
    handlePasswordReset,
  } = useAuthPage();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset' | 'confirm' | 'resetSent' >('signin');
  const [emailToVerify, setEmailToVerify] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const toggleAuthMode = (mode: 'signin' | 'signup' | 'reset'  |'confirm' | 'resetSent') => {
    setAuthMode(mode);
  };
 
  const handleSignUp = async (email: string, password: string) => {
    const result = await handleEmailSignUp(email, password);
    setEmailToVerify(email);
    if (result && result.success) {
      setAuthMode('confirm');
    }
  };

  const handleResendEmail = async () => {
    if (!emailToVerify) return;
    
    try {
      setIsResending(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToVerify,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Email sent',
        description: 'A new verification email has been sent to your inbox.',
      });
      
    } catch (error: any) {
      console.error('[ERROR] Failed to resend email:', error);
      toast({
        title: 'Error resending email',
        description: error.message || 'Failed to resend verification email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {authMode === 'resetSent' ? (
        <PasswordResetEmailSent 
          emailToVerify={emailToVerify || ''} 
          onResendEmail={handleResendEmail}
          isResending={isResending}
        />
      ) : authMode === 'confirm' ? (
        <ConfirmEmail 
          emailToVerify={emailToVerify || ''} 
          onResendEmail={handleResendEmail}
          isResending={isResending}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          {/* Hero Section */}
          <section className="pt-16 px-6 pb-12">
            <div className="container mx-auto max-w-lg text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src="/museio-gradient-logo.svg" 
                  alt="Museio Logo" 
                  className="h-24 md:h-24"
                />
              </div>
              <div className="w-full max-w-md space-y-8 text-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {authMode === 'reset' ? 'Reset Password' : 
                      authMode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {authMode === 'reset' ? 'Enter your email to receive a password reset link' :
                      authMode === 'signin' ? 'Sign in to access your account' : 'Sign up to get started'}
                  </p>
                </div>
                
                <AuthError error={error} />
                
                {authMode === 'reset' ? (
                  // For reset password, show only email form without tabs
                  <EmailForm 
                    isLoading={isLoading} 
                    mode={authMode}
                    onSubmit={async (email: string, _password: string) => {
                      await handlePasswordReset(email);
                      setEmailToVerify(email);
                      toggleAuthMode('resetSent');
                    }}
                    onToggleMode={toggleAuthMode}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleGoogleSignIn()}
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#DDDCE7] bg-white px-4 py-4 text-[#1F2430] transition hover:bg-[#F8F9FB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <Chrome className="h-5 w-5" />
                          <span>{authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
                        </>
                      )}
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#DDDCE7]" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-[#7A7F8C]">Or continue with email</span>
                      </div>
                    </div>

                    <EmailForm 
                      isLoading={isLoading} 
                      mode={authMode}
                      onSubmit={authMode === 'signin' 
                        ? handleEmailSignIn 
                        : handleSignUp}
                      onToggleMode={toggleAuthMode}
                    />
                  </>
                )}
                
                <div className="text-sm text-gray-500 mt-6">
                  <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default Auth;
