
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, FileText, CreditCard, Settings, CheckCircle, Circle, Sparkles } from 'lucide-react';


interface MissingSetup {
  profile?: boolean;
  invoice?: boolean;
  bank?: boolean;
}

interface SetupValidationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingSetup: MissingSetup;
}

const SetupValidationPopup: React.FC<SetupValidationPopupProps> = ({
  open,
  onOpenChange,
  missingSetup
}) => {
  const navigate = useNavigate();


  const [ setup, setSetup ] = React.useState(missingSetup);


  useEffect(() => {
    setSetup(missingSetup);
    console.log("Setup validation popup opened with missing setup:", missingSetup);
  }, [missingSetup]);

  const handleCompleteSetup = () => {
    onOpenChange(false);
    navigate('/app/settings');
  };


  const setupItems = [
    {
      id: 'account',
      title: 'Personal account',
      description: 'So clients know who they\'re working with.',
      mandatory: true,
      link: '/app/settings',
      setTab: "account",
    },
    {
      id: 'invoice',
      title: 'Invoicing Details',
      description: 'Add your signature, optionally add your company name, logo, and business details to make your invoices look professional.',
      mandatory: true,
      link: '/app/settings',
      setTab: "invoice",
    },
    {
      id: 'bank',
      title: 'Bank Account',
      description: 'Make it easy to get paid by telling your clients exactly where to send the money.',
      mandatory: true,
      link: '/app/settings',
      setTab: "bank",
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-sm rounded-3xl">
        <DialogHeader className="!text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#A98CFF] to-[#6E59A5]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent text-center">
            We noticed some missing details
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm leading-relaxed">
            To send invoices, we need these essential details for invoicing and mailing:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-6">
          {setupItems.map((item) => (
            !setup[item.id] ? null : (
            <div
              key={item.id}
              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => {
              onOpenChange(false);
              navigate(`${item.link}?tab=${item.setTab}`);
              }}
            >
              <div className="mt-0.5">
                <Circle className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                {item.mandatory ? (
                <span className="text-xs px-2 py-0.5 bg-[#A98CFF]/10 text-[#6E59A5] rounded-full font-medium">
                  Required
                </span>
                ) : (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                  Recommended
                </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          )))}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleCompleteSetup}
            className="w-full bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] hover:from-[#9B70F9] to-[#5F4A8A] text-white"
            size="lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            Take me to Settings
          </Button>
          
          <Button 
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500 mt-4">
          You can access these settings anytime
          <br />
          from the Settings page
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetupValidationPopup;
