import React, { useState, useEffect } from 'react';
import { PortfolioModeProvider } from '@/context/PortfolioModeContext';
import { ModedPortfolioDataProvider } from '@/context/PortfolioDataContextModed';
import PortfolioRenderer from '@/components/portfolio2/PortfolioRenderer';
import { useUserProfile } from '@/hooks/useUserProfile';
import UsernameRequiredDialog from '@/components/portfolio2/UsernameRequiredDialog';

const PortfolioContent: React.FC = () => {
  const { profile, loading } = useUserProfile();
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);

  useEffect(() => {
    if (!loading && !profile?.username) {
      setShowUsernameDialog(true);
    }
  }, [loading, profile?.username]);

  // Show loading state while checking profile
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <UsernameRequiredDialog
        isOpen={showUsernameDialog}
        onClose={() => setShowUsernameDialog(false)}
      />
      
      {profile?.username && (
        <PortfolioModeProvider 
          mode="edit" 
          isPublic={false} 
          isLive={false} 
          userHandle={null}
        >
          <ModedPortfolioDataProvider>
            <PortfolioRenderer mode="edit" />
          </ModedPortfolioDataProvider>
        </PortfolioModeProvider>
      )}
    </>
  );
};

const Portfolio: React.FC = () => {
  return <PortfolioContent />;
};

export default Portfolio;
