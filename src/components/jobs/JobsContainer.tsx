import React from 'react';
import { useAppContext } from '@/context/AppContext';
import InvoiceConfirmation from '@/components/jobs/InvoiceConfirmation';
import JobsTabs from '@/components/jobs/JobsTabs';
import PastJobModal from '@/components/jobs/PastJobModal';
import PriorityJobsSection from '@/components/jobs/PriorityJobsSection';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { useJobsContext } from '@/context/JobsContext';
import { Job } from '@/types';
import { Capacitor } from '@capacitor/core';
import EditJobForm from '../edit-job/EditJobForm';

const JobsContainer: React.FC = () => {
  const { jobs, addJob, loading } = useAppContext();
  const {
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    handleSendInvoice,
    handleMarkAsPaid,
    handleJobClick,
    handleEditJob,
    handleDeleteJob,
    handleDetailsOpenChange,
    handleEditFromInvoice,
    isSending,
    isMarkingAsPaid,
    processingJobId,
    isPastJobModalOpen,
    setIsPastJobModalOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    activeTab,
    setActiveTab,
    requestedJobs,
    draftedJobs,
    upcomingJobs,
    pastJobs,
    invoiceSentJobs,
    paidJobs,
    filteredJobs,
    bookingRequests,
    onSendQuote,
    onDeclineRequest,
    onRemoveRequest
  } = useJobsContext();

  const [isTherePastJob, setIsTherePastJob] = React.useState(false);

  // Create a wrapper function with the correct signature for JobsTabs
  const handleMarkAsPaidWrapper = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); // Prevent other click handlers
    handleMarkAsPaid(job);
  };

  const setIsDetailsOpen = (v: boolean) => {
    // Only reset the selected job when closing the modal
    if (!v) {
      setSelectedJob(null);
    }
    // Open/close the job details modal
    handleDetailsOpenChange(v);
  };

  const setIsPastJobModal = (v: boolean) => {
    if (!v) {
      setSelectedJob(null);
    }
    // Close the past job modal
    setIsPastJobModalOpen(v);
  };

  // Handler for invoice click - opens PastJobModal directly
  const handleInvoiceClick = (job: Job) => {
    // Set the selected job using context function
    setSelectedJob(job);
    // Open the past job modal directly
    setIsPastJobModalOpen(true);
  };

  // Enhanced edit handler that properly transitions from PastJobModal to EditJobForm
  const handleEditFromPastJobModal = async (id: string, jobData: Partial<Job>): Promise<boolean> => {
    // Close the past job modal first
    setIsPastJobModalOpen(false);

    if (selectedJob?.id !== id) {
      setSelectedJob(jobData as Job);
    }

    // Open the edit job form without mutating the job yet
    setIsDetailsOpen(true);

    return true;
  };

  // Wrapper for sendInvoice to ensure it returns a Promise<boolean>
  const handleSendInvoicePromise = async (): Promise<boolean> => {
    if (!selectedJob) return false;
    
    // Call handleSendInvoice without arguments as it uses the selectedJob from state
    const result = await handleSendInvoice();
    // Explicitly ensure boolean return type
    return Boolean(result);
  };
  
  // Handler for duplicating a job
  const handleDuplicateJob = async (jobData: Job) => {
    // Strip the ID to ensure we create a new job
    const { id, ...dataWithoutId } = jobData;
    
    try {
      // Add the job using the AppContext addJob function
      await addJob(dataWithoutId);
    } catch (error) {
      console.error("[JobsContainer] Error duplicating job:", error);
    }
  };

  const calculateTopPadding = () => {
    // If running on a native platform, add top padding for the header
    if (Capacitor.isNativePlatform()) {
      if (isTherePastJob)
        return 'pt-14';
      else
        return 'pt-28';
    }
    else {
      return '';
    }
  };
  // If loading, show skeleton loaders

  if (loading) {
    return (
      <div className={`app-page-shell-narrow mb-20 ${Capacitor.isNativePlatform() ? 'pt-14' : ''}`}>
        <div className="space-y-6">
          <SkeletonLoader type="job-list" count={3} />
        </div>
      </div>
    );
  }

  return (
      <>
      <div className={`app-page-shell-narrow ${calculateTopPadding()}`}>
        {/* Priority Jobs Section - for past jobs that need invoicing */}
        <PriorityJobsSection 
          jobs={filteredJobs}
          onJobClick={handleJobClick}
          onInvoiceClick={handleInvoiceClick}
          setIsTherePastJob={setIsTherePastJob} // No need to set this in the container
        />
        
        <JobsTabs 
          draftedJobs={draftedJobs}
          upcomingJobs={upcomingJobs}
          pastJobs={pastJobs}
          invoiceSentJobs={invoiceSentJobs}
          paidJobs={paidJobs}
          bookingRequests={bookingRequests}
          onJobClick={handleJobClick}
          onMarkAsPaid={handleMarkAsPaidWrapper}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onInvoiceClick={handleInvoiceClick}
          onSendQuote={onSendQuote}
          onDeclineRequest={onDeclineRequest}
          onRemoveRequest={onRemoveRequest}
        />

        <InvoiceConfirmation
          open={isInvoiceModalOpen}
          onOpenChange={setIsInvoiceModalOpen}
          job={selectedJob}
          onConfirm={handleSendInvoice}
          onEdit={handleEditFromInvoice}
        />
        
        {/* Past Job Modal - now with duplication functionality */}
        <PastJobModal
          isOpen={isPastJobModalOpen}
          onOpenChange={setIsPastJobModal}
          job={selectedJob}
          onEdit={handleEditFromPastJobModal}
          onSendInvoice={handleSendInvoicePromise}
          onMarkAsPaid={handleMarkAsPaid}
          onDelete={handleDeleteJob}
          isPreviewOpen={isPreviewOpen}
          setIsPreviewOpen={setIsPreviewOpen}
          isSending={isSending}
          isMarkingAsPaid={isMarkingAsPaid}
          onDuplicateJob={handleDuplicateJob}
        />

        {selectedJob && (
          <EditJobForm 
            isDetailsOpen={isDetailsOpen}
            setIsDetailsOpen={setIsDetailsOpen}
            job={selectedJob} 
          />
        )}
        
        {/* Loading overlays for async operations */}
        <LoadingOverlay isVisible={isSending} text="Sending invoice..." />
        <LoadingOverlay isVisible={isMarkingAsPaid} text="Marking as paid..." />
      </div>
      </>
    );
  }

export default JobsContainer;
