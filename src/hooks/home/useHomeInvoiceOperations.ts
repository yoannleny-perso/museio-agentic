
import { useState } from 'react';
import { Job } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';

/**
 * Hook for invoice operations on the home page
 */
export const useHomeInvoiceOperations = (
  setSelectedJob: (job: Job | null) => void,
  setIsInvoiceModalOpen: (open: boolean) => void,
  setIsDetailsOpen: (open: boolean) => void,
  setProcessingJobId: (id: string | null) => void,
  setIsPastJobModalOpen: (open: boolean) => void
) => {
  const { toast } = useToast();
  const [isJobProcessing, setIsJobProcessing] = useState(false);
  const [localProcessingJobId, setLocalProcessingJobId] = useState<string | null>(null);
  
  // Invoice operations
  const { 
    handleComplete: invoiceComplete, 
    handleSendInvoice: sendInvoice, 
    handleMarkAsPaid: invoiceMarkAsPaid,
    isSending,
    isMarkingAsPaid,
    processingJobId: invoiceProcessingJobId
  } = useInvoiceOperations();
  
  // Handle complete
  const handleComplete = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    
    // Set the selected job for the past job modal
    setSelectedJob(job);
    
    // Open the past job modal
    setIsPastJobModalOpen(true);
    
    return invoiceComplete(e, job);
  };
  
  // Handle sending the invoice
  const handleSendInvoice = async (job: Job) => {
    // Close the details modal
    setIsDetailsOpen(false);
    
    // Open the invoice modal
    setIsInvoiceModalOpen(true);
    
    const success = await sendInvoice(job);
    
    // Close the modal regardless of success/failure
    setIsInvoiceModalOpen(false);
    
    return success;
  };
  
  // Handle marking a job as paid
  const handleMarkAsPaid = async (job: Job) => {
    setIsJobProcessing(true);
    setLocalProcessingJobId(job.id);
    setProcessingJobId(job.id);
    
    try {
      const success = await invoiceMarkAsPaid(job);
      
      if (success) {
        toast({
          title: 'Payment recorded',
          description: 'The payment has been successfully recorded.',
        });
        return true;
      } else {
        toast({
          title: 'Payment recording failed',
          description: 'There was a problem recording the payment.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error marking job as paid:', error);
      toast({
        title: 'Payment recording failed',
        description: 'There was a problem recording the payment.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsJobProcessing(false);
      setLocalProcessingJobId(null);
      setProcessingJobId(null);
    }
  };

  return {
    handleComplete,
    handleSendInvoice,
    handleMarkAsPaid,
    isSending,
    isMarkingAsPaid,
    isJobProcessing,
    localProcessingJobId,
    invoiceProcessingJobId
  };
};
