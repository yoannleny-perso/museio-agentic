
import { useState } from 'react';
import { Job } from '@/types';
import { useJobOperations } from '@/hooks/useJobOperations';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { useModalState } from '@/hooks/useModalState';
import { useAppContext } from '@/context/AppContext';

/**
 * Main hook for jobs page operations that combines the functionality
 * of more focused hooks
 */
export const useJobsOperations = () => {
  // Use the specific hooks
  const { handleEditJob, handleDeleteJob, refreshJobs } = useJobOperations();
  const { 
    handleSendInvoice: sendInvoice, 
    handleMarkAsPaid,
    isSending,
    isMarkingAsPaid,
    processingJobId,
    isPastJobModalOpen,
    setIsPastJobModalOpen,
    isPreviewOpen,
    setIsPreviewOpen
  } = useInvoiceOperations();
  const {
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    handleJobClick,
    handleDetailsOpenChange,
    handleEditFromInvoice
  } = useModalState();
  
  // Handle sending the invoice
  const handleSendInvoice = async () => {
    if (!selectedJob) {
      console.log('[useJobsOperations] No selected job for invoice sending');
      return false;
    }
    
    const success = await sendInvoice(selectedJob);
    
    // Close the modal regardless of success/failure
    setIsInvoiceModalOpen(false);
    
    // Refresh all jobs to ensure our local state is in sync
    await refreshJobs();
    
    return success;
  };

  // Modified handleMarkAsPaid wrapper function
  const handleMarkAsPaidWrapper = async (job: Job) => {
    try {
      // Call the original handleMarkAsPaid function
      const success = await handleMarkAsPaid(job);
      
      if (success) {
        // Close the PastJobModal if payment marking was successful
        setIsPastJobModalOpen(false);
        
        // Refresh jobs to ensure our state is in sync
        await refreshJobs();
      }
      
      return success;
    } catch (error) {
      console.error('[Jobs] Error marking job as paid:', error);
      return false;
    }
  };

  return {
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    handleMarkAsPaid: handleMarkAsPaidWrapper,
    handleSendInvoice,
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
    setIsPreviewOpen
  };
};
