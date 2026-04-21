
import { useState } from 'react';
import { useOnboardingContext } from '@/context/OnboardingContext';

export const useSetupValidation = () => {
  const { setupCompletion } = useOnboardingContext();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const validateSetupBeforeInvoice = (): boolean => {
    const isSetupComplete = setupCompletion.profile && setupCompletion.invoice && setupCompletion.bank;
    
    if (!isSetupComplete) {
      setIsPopupOpen(true);
      return false;
    }
    
    return true;
  };

  const getMissingSetup = () => ({
    profile: !setupCompletion.profile,
    invoice: !setupCompletion.invoice,
    bank: !setupCompletion.bank
  });

  return {
    validateSetupBeforeInvoice,
    isPopupOpen,
    setIsPopupOpen,
    missingSetup: getMissingSetup(),
    setupCompletion
  };
};
