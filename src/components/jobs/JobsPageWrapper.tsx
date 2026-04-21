import React from 'react';
import { useLocation } from 'react-router-dom';
import JobsContainer from '@/components/jobs/JobsContainer';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useJobsContext } from '@/context/JobsContext';
import { useAppContext } from '@/context/AppContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import {
  JOB_TAB_QUERY_PARAM,
  normalizeJobTab,
} from '@/contracts';

const JobsPageContent = () => {
  const { loading } = useAppContext();
  const { user, loading: authLoading } = useAuthRedirect();
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const { 
    isDetailsOpen, 
    isInvoiceModalOpen, 
    isPastJobModalOpen,
    isPreviewOpen,
    isQuoteModalOpen,
    isSending,
    isMarkingAsPaid,
    activeTab,
    setActiveTab
  } = useJobsContext();

  React.useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const nextTab = normalizeJobTab(searchParams.get(JOB_TAB_QUERY_PARAM));

    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, authLoading, location.search, setActiveTab, user]);
  
  // Set up UI refresh for live job indicators (no data fetching)
  React.useEffect(() => {
    if (!user || authLoading || isDetailsOpen || isInvoiceModalOpen || isPastJobModalOpen || isPreviewOpen || isQuoteModalOpen) return;

    // Set up interval just to update the UI for live job indicators
    // This doesn't fetch data, just forces a re-render to update the live status
    const liveUpdateInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(liveUpdateInterval);
    };
  }, [user, authLoading, isDetailsOpen, isInvoiceModalOpen, isPastJobModalOpen, isPreviewOpen, isQuoteModalOpen]);
  
  if (authLoading) {
    return <LoadingOverlay isVisible={true} text="Loading your workspace..." />;
  }
  
  if (!user) {
    return null; // The useAuthRedirect hook will handle the redirect
  }
  
  return (
    <>
      <JobsContainer key={refreshTrigger} />
      
      {/* Loading overlay for jobs data */}
      <LoadingOverlay 
        isVisible={loading} 
        text="Refreshing jobs..." 
      />
      
      {/* Loading overlay for invoice operations */}
      <LoadingOverlay 
        isVisible={isSending} 
        text="Sending invoice..." 
      />
      
      {/* Loading overlay for payment operations */}
      <LoadingOverlay 
        isVisible={isMarkingAsPaid} 
        text="Updating payment status..." 
      />
    </>
  );
};

const JobsPageWrapper = () => {
  return (
    <JobsPageContent />
  );
};

export default JobsPageWrapper;
