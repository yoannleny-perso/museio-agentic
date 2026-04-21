
import { Mail } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';


interface PasswordResetEmailSentProps {
  emailToVerify: string;
  onResendEmail: () => Promise<void>;
  isResending?: boolean;
}

const PasswordResetEmailSent = ({ emailToVerify, onResendEmail, isResending = false }: PasswordResetEmailSentProps) => {
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
         

        <h1 className="text-2xl text-[#222] font-semibold mb-4">Reset Password Email Sent!</h1>
        <p className="text-base mb-2">
          We have sent the email to{' '}
          <span className="font-bold text-[#8A71CF]">{emailToVerify}</span>
        </p>
        <p className="text-base mb-2">Please go to your email and click on the link to reset your password.</p>
        <p className="text-base">You might need to <span className="font-bold text-[#8A71CF]">check your spam folder</span>.</p>

        <div className="mt-8 flex items-center justify-center gap-4">
      
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

export default PasswordResetEmailSent;
