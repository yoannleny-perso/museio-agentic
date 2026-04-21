
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PortfolioModeProvider } from '@/context/PortfolioModeContext';
import { ModedPortfolioDataProvider, useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import PortfolioRenderer from '@/components/portfolio2/PortfolioRenderer';

// Component to check portfolio status after data is loaded
const PortfolioStatusChecker: React.FC<{ 
  handle: string;
  children: React.ReactNode;
}> = ({ handle, children }) => {
  const { data, loading, userProfile } = useModedPortfolioData();
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // Wait for data to load, then check status
    if (!loading) {
      setCheckingStatus(false);
    }
  }, [loading]);

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading portfolio...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Portfolio not found</div>
      </div>
    );
  }

  if (!data?.is_public) {
    return (
        <div className="text-center space-y-4">
          <div className="text-lg">Portfolio not available</div>
          <div className="text-sm text-muted-foreground">
            This portfolio is not currently public
          </div>
        </div>
    );
  }

  return <>{children}</>;
};

const PortfolioLivePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();

  if (!handle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Invalid portfolio URL</div>
      </div>
    );
  }

  return (
    <PortfolioModeProvider 
      mode="live" 
      isPublic={true} 
      isLive={true} 
      userHandle={handle}
    >
      <ModedPortfolioDataProvider username={handle}>
        <PortfolioStatusChecker handle={handle}>
          <PortfolioRenderer mode="live" />
        </PortfolioStatusChecker>
      </ModedPortfolioDataProvider>
    </PortfolioModeProvider>
  );
};

export default PortfolioLivePage;
