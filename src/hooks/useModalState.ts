
import { useState } from 'react';
import { Job } from '@/types';

/**
 * Hook for managing job-related modal states
 */
export const useModalState = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  // Handle job click - opens details modal with selected job
  const handleJobClick = (job: Job) => {
    console.log('[useModalState] Job clicked:', job.id);
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };
  
  // Handle details dialog open/close state
  const handleDetailsOpenChange = (open: boolean) => {
    console.log('[useModalState] Details open change:', open);
    
    setIsDetailsOpen(open);
    
    // Reset selected job when closing the details dialog
    if (!open) {
      setSelectedJob(null);
    }
  };
  
  // Handle edit from invoice modal
  const handleEditFromInvoice = () => {
    console.log('[useModalState] Edit from invoice clicked');
    
    // Close the invoice modal
    setIsInvoiceModalOpen(false);
    
    // Open the details modal for editing
    setIsDetailsOpen(true);
  };

  return {
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    handleJobClick,
    handleDetailsOpenChange,
    handleEditFromInvoice
  };
};
