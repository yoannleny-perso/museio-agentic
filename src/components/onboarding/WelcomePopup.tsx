
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Settings, Sparkles, X } from 'lucide-react';
import { useOnboardingContext } from '@/context/OnboardingContext';

interface WelcomePopupProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { setupCompletion, markWelcomeSeen } = useOnboardingContext();

  const handleTakeToSettings = async () => {
    onClose();
    navigate('/app/settings');
  };

  const handleSkipForNow = () => {
    onClose();
  };

  const handleDontShowAgain = async () => {
    await markWelcomeSeen();
    onClose();
  };

  const setupItems = [
    {
      id: 'account',
      title: 'Personal account',
      description: 'So clients know who they\'re working with.',
      completed: setupCompletion.profile,
      mandatory: true,
      link: '/app/settings',
      setTab: "account",
    },
    {
      id: 'invoice',
      title: 'Invoicing Details',
      description: 'Add your signature, optionally your company name, logo, and business details to make your invoices look professional.',
      completed: setupCompletion.invoice,
      mandatory: true,
      link: '/app/settings',
      setTab: "invoice",
    },
    {
      id: 'bank',
      title: 'Bank Account',
      description: 'Make it easy to get paid by telling your clients exactly where to send the money.',
      completed: setupCompletion.bank,
      mandatory: true,
      link: '/app/settings',
      setTab: "bank",
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="max-w-md rounded-[32px] border-[#E9E4F6] p-0 shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#8B5CF6]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="mb-4 text-center text-2xl font-bold bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] bg-clip-text text-transparent">
            Welcome to MUSEIO
          </h2>

          <p className="text-center text-[#4F5868] mb-8 leading-relaxed">
            We're excited to have you here. To get the most out of MUSEIO, let's set up your account with these essential details for invoicing and mailing:
          </p>

          <div className="mb-8 space-y-6">
            {setupItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full gap-4 text-left transition hover:opacity-85"
                onClick={() => {
                  onClose();
                  navigate(`${item.link}?tab=${item.setTab}`);
                }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
                  ) : (
                    <Circle className="h-6 w-6 text-[#DDDCE7]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-[#1F2430]">{item.title}</span>
                    <span className="text-xs font-semibold uppercase text-[#8B5CF6]">
                      {item.mandatory ? 'Required' : 'Recommended'}
                    </span>
                  </div>
                  <p className="text-sm text-[#7A7F8C]">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          <Button 
            onClick={handleTakeToSettings}
            className="mb-3 w-full rounded-2xl bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] py-6 text-white hover:shadow-lg"
            size="lg"
          >
            <Settings className="h-5 w-5 mr-2" />
            Take me to Settings
          </Button>
          
          <Button 
            onClick={handleSkipForNow}
            variant="ghost"
            className="mb-3 w-full text-[#4F5868] hover:text-[#1F2430]"
          >
            Skip for now
          </Button>
          
          <Button 
            onClick={handleDontShowAgain}
            variant="ghost"
            className="mb-6 w-full text-[#7A7F8C] hover:text-[#1F2430]"
          >
            <X className="h-4 w-4 mr-2" />
            Don't show this again
          </Button>

          <div className="text-center text-xs text-[#A4A9B6]">
            You can access these settings anytime
            <br />
            from the Settings page
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
