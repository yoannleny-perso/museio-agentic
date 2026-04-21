
import { useState } from 'react';
import { Job, JobStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';

/**
 * Hook for payment operations related to invoices
 */
export const usePaymentOperations = () => {
  const { updateJob } = useAppContext();
  const { toast } = useToast();
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  /**
   * Mark a job as paid
   */
  const markAsPaid = async (job: Job) => {
    console.log('[usePaymentOperations] Mark as paid clicked for job:', job.id, 'Current status:', job.status);
    
    setIsMarkingAsPaid(true);
    setProcessingJobId(job.id);
    
    try {
      const success = await updateJob(job.id, {
        status: 'paid' as JobStatus
      });
      
      if (success) {
        console.log(`[usePaymentOperations] Successfully marked job ${job.id} as paid`);
        toast({
          title: 'Payment recorded',
          description: 'The job has been marked as paid.',
        });
        
        return true;
      } else {
        console.error(`[usePaymentOperations] Failed to mark job ${job.id} as paid`);
        toast({
          title: 'Update failed',
          description: 'Could not update payment status.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('[usePaymentOperations] Error marking as paid:', error);
      toast({
        title: 'Update failed',
        description: 'An error occurred while updating payment status.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsMarkingAsPaid(false);
      setProcessingJobId(null);
    }
  };

  return {
    markAsPaid,
    isMarkingAsPaid,
    processingJobId
  };
};
