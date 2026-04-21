
import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';

interface GoogleSignInButtonProps {
  isLoading: boolean;
  onClick: () => Promise<void>;
  label?: string;
}

const GoogleSignInButton = ({
  isLoading,
  onClick,
  label = 'Continue with Google',
}: GoogleSignInButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl border-[#DDDCE7] bg-white text-[#1F2430] hover:bg-[#F8F9FB]"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <FcGoogle className="h-5 w-5" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
};

export default GoogleSignInButton;
