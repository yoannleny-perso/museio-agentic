
import { Job } from '@/types';
import { isJobLive } from '@/utils/jobStatusUpdater';

/**
 * Sorts jobs based on date and current tab
 * Also prioritizes live jobs in the upcoming tab
 * 
 * @param jobs The jobs to sort
 * @param isCompletedTab Whether we're in the completed tab
 * @returns Sorted array of jobs
 */
export const sortjobs = (jobs: Job[], isCompletedTab: boolean): Job[] => {
  return [...jobs].sort((a, b) => {
    // For upcoming tab, prioritize live jobs at the top
    if (!isCompletedTab) {
      const isALive = isJobLive(a);
      const isBLive = isJobLive(b);
      
      // If one is live and the other isn't, the live one comes first
      if (isALive && !isBLive) return -1;
      if (!isALive && isBLive) return 1;
      
      // If both are either live or not live, fall back to date sorting
    }
    
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // For completed tab, sort in reverse chronological order (newest first)
    if (isCompletedTab) {
      return dateB.getTime() - dateA.getTime();
    }
    
    // For confirmed tab, keep the existing sort (chronological)
    return dateA.getTime() - dateB.getTime();
  });
};
