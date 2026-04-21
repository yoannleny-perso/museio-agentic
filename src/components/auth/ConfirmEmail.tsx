
import { Mail } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';


interface ConfirmEmailProps {
  emailToVerify: string;
  onResendEmail: () => Promise<void>;
  isResending?: boolean;
}

const ConfirmEmail = ({ emailToVerify, onResendEmail, isResending = false }: ConfirmEmailProps) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
        <div className="flex items-center justify-center mt-2 mb-6">
          <img 
            src="/museio-gradient-logo.svg" 
            alt="Museio Logo" 
            className="h-24 md:h-24"
          />
        </div>
        <h1 className="text-2xl text-[#222] font-semibold mb-4">Verify your email address</h1>
        <p className="text-base mb-2">
          We have sent a verification link to{' '}
          <span className="font-bold text-[#8A71CF]">{emailToVerify}</span>
        </p>
        <p className="text-base mb-2">Click on the link to complete the verification process.</p>
        <p className="text-base">You might need to <span className="font-bold text-[#8A71CF]">check your spam folder</span>.</p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <LoadingButton 
            onClick={onResendEmail}
            isLoading={isResending}
            loadingText="Sending..."
            className="inline-block bg-[#8A71CF] text-white rounded-lg hover:bg-[#5e07a1] transition-colors"
          >
            Resend email
            </LoadingButton>
        <Button
            onClick={() => {
                navigate("/");
            }}
            className="inline-block text-[#8A71CF] bg-white border border-[#8A71CF] rounded-lg hover:bg-[#f3edfa] transition-colors"
        >
            Return to Site →
        </Button>
        </div>

        <div className="mt-10 text-sm text-gray-500">
          You can reach us if you have any questions.
          <br />
          <div className="flex items-center justify-center mt-2">
            <Mail className="text-[#8A71CF] mr-2" size={20} />
            <a href="mailto:support@museioapp.com" className="text-[#8A71CF] hover:underline">
              support@museioapp.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmEmail;
