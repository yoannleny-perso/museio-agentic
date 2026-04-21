
import { Job } from '@/types';

/**
 * Hook for navigation operations on the home page
 */
export const useHomeNavigationOperations = (
  setSelectedJob: (job: Job | null) => void,
  setIsInvoiceModalOpen: (open: boolean) => void,
  setIsDetailsOpen: (open: boolean) => void,
  setIsJobFormOpen?: (open: boolean) => void  // Make this parameter optional
) => {
  // Handle editing from invoice
  const handleEditFromInvoice = (job: Job) => {
    // Close the invoice modal
    setIsInvoiceModalOpen(false);
    
    // Set the selected job
    setSelectedJob(job);
    
    // Open the details modal
    setIsDetailsOpen(true);
  };
  
  // Handle adding a new job
  const handleAddJob = () => {
    // Open the job form modal
    if (setIsJobFormOpen) {
      setIsJobFormOpen(true);
    }
  };

  return {
    handleEditFromInvoice,
    handleAddJob
  };
};
