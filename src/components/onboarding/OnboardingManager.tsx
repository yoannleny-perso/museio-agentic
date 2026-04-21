
import React, { useEffect, useState } from 'react';
import { WelcomePopup } from './WelcomePopup';
import { useOnboardingContext } from '@/context/OnboardingContext';
import { useAuth } from '@/context/auth';

export const OnboardingManager: React.FC = () => {
  const { user } = useAuth();
  const { shouldShowWelcome, loading } = useOnboardingContext();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Only show welcome popup if user is authenticated and should see it
    if (user && !loading && shouldShowWelcome) {
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, loading, shouldShowWelcome]);

  if (!user || loading) {
    return null;
  }

  return (
    <WelcomePopup 
      open={showWelcome} 
      onClose={() => setShowWelcome(false)} 
    />
  );
};
