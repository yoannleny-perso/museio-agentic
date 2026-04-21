
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import HomeCalendarSection from '@/components/home/HomeCalendarSection';
import HomePageModals from '@/components/home/HomePageModals';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useHomePageState } from '@/hooks/useHomePageState';
import { useJobsContext } from '@/context/JobsContext';
import { useJobFormSubmit } from '@/hooks/useJobFormSubmit';
import { Job } from '@/types';

interface HomeProps {
  isJobFormOpen: boolean;
  onJobFormOpenChange: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ isJobFormOpen, onJobFormOpenChange }) => {
  // Use auth redirect to ensure user is logged in
  const { user, loading: authLoading } = useAuthRedirect('/home');
  
  // Get jobs context
  const {
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    //setIsDetailsOpen,
    handleDetailsOpenChange,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    handleJobClick,
    handleEditJob,
    handleDeleteJob,
    handleSendInvoice,
    handleEditFromInvoice,
    handleMarkAsPaid,
    isSending,
    isMarkingAsPaid,
    processingJobId,
    isPastJobModalOpen,
    setIsPastJobModalOpen,
    isPreviewOpen,
    setIsPreviewOpen
  } = useJobsContext();
  
  // Get state management from our custom hook (excluding job form state)
  const {
    selectedDate,
    handleSelectDate,
    //handleDetailsOpenChange
  } = useHomePageState();
  
  // Use job form submit hook for handling new job creation with client support
  const { handleFormSubmit, handleSaveDraft, isSaving } = useJobFormSubmit({
    onSuccess: () => onJobFormOpenChange(false)
  });

  const setIsDetailsOpen = (v: boolean) => {
    // Reset the selected job
    setSelectedJob(null);
    // Close the job details modal
    handleDetailsOpenChange(v);
  };
  
  const { jobs, addJob, loading: dataLoading } = useAppContext();
  
  // Add state to force re-renders for live job updates
  const [, setRefreshTrigger] = useState(0);

  const anyModalOpen = isDetailsOpen || isInvoiceModalOpen || isPastJobModalOpen || isPreviewOpen || isJobFormOpen;
  const isLoading = authLoading || dataLoading;
  
  // Wrapper function for job submission to close the modal after submission
  const handleSubmitJobForm = async (data: Omit<Job, 'id'>) => {
    await handleFormSubmit(data);
  };

  const handleSaveJobDraft = async (data: any) => {
    await handleSaveDraft(data);
  };
  
  // Create a function to check if a job is being processed
  const isJobBeingProcessed = (jobId: string) => {
    return processingJobId === jobId;
  };

  // New handler for invoice click
  const handleInvoiceClick = (job: Job) => {
    setSelectedJob(job); // Set the selected job
    setIsPastJobModalOpen(true); // Open the past job modal directly
  };
  
  // Add handler for job duplication
  const handleDuplicateJob = async (job: Job) => {
    // Strip the ID to ensure we create a new job
    const { id, ...dataWithoutId } = job;
    
    try {
      // Add the job using the AppContext addJob function
      await addJob(dataWithoutId);
    } catch (error) {
      console.error("[Home] Error duplicating job:", error);
    }
  };

  // Handler for opening job form
  const handleOpenJobForm = () => {
    onJobFormOpenChange(true);
  };
  
  // No need to fetch jobs here - useSupabaseJobs handles it globally

  
  // Set up UI refresh for live job indicators (no data fetching)
  useEffect(() => {
    if (!user || authLoading || anyModalOpen) return;

    // Set up interval just to update the UI for live job indicators (every 10 seconds)
    const liveUpdateInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 10000);
    
    return () => {
      clearInterval(liveUpdateInterval);
    };
  }, [user, authLoading, anyModalOpen]);
  
  if (authLoading) {
    return <LoadingOverlay isVisible={true} text="Loading your workspace..." />;
  }
  
  if (!user) {
    return null; // The useAuthRedirect hook will handle the redirect
  }
  
  return (
    <>
      <div>
      <HomeCalendarSection
      selectedDate={selectedDate}
      onSelectDate={handleSelectDate}
      jobs={jobs}
      onJobClick={handleJobClick}
      onAddJob={handleOpenJobForm}
      isProcessing={isJobBeingProcessed}
      onInvoiceClick={handleInvoiceClick}
        />
      <HomePageModals
        isDetailsOpen={isDetailsOpen}
        onDetailsOpenChange={setIsDetailsOpen}
        selectedJob={selectedJob}
        onEditJob={handleEditJob}
        onDeleteJob={handleDeleteJob}
        isInvoiceModalOpen={isInvoiceModalOpen}
        onInvoiceModalOpenChange={setIsInvoiceModalOpen}
        onConfirmInvoice={handleSendInvoice}
        onEditFromInvoice={handleEditFromInvoice}
        onMarkAsPaid={handleMarkAsPaid}
        isSending={isSending}
        isMarkingAsPaid={isMarkingAsPaid}
        isJobFormOpen={isJobFormOpen}
        onJobFormOpenChange={onJobFormOpenChange}
        selectedDate={selectedDate}
        onJobSubmit={handleSubmitJobForm}
        onJobSaveDraft={handleSaveJobDraft}
        isPastJobModalOpen={isPastJobModalOpen}
        onPastJobModalOpenChange={setIsPastJobModalOpen}
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        onDuplicateJob={handleDuplicateJob} />
      
      {/* Loading overlay for initial data loading */}
      <LoadingOverlay 
        isVisible={isLoading} 
        text="Loading your workspace..." 
      />
      
      {/* Loading overlay for job submission */}
      <LoadingOverlay 
        isVisible={isSaving} 
        text="Creating job..." 
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
      </div>
    </>
  );
};

export default Home;
