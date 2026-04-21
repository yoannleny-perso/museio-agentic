
import { useState } from 'react';
import { Job } from '@/types';

/**
 * Hook for clock-off operations
 */
export const useClockOffOperations = () => {
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  
  /**
   * Handle complete action for a job
   */
  const clockOff = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); // Prevent card click when clicking button
    console.log('[useClockOffOperations] complete clicked for job:', job.id, 'Current status:', job.status);
    
    // Return the job for further processing
    return job;
  };

  return {
    clockOff,
    processingJobId,
    setProcessingJobId
  };
};
