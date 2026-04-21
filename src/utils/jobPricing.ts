import { Job } from '@/types';
import { calculateJobItemsTotal } from '@/services/jobItemsService';

/**
 * Gets the display price for a job based on its pricing mode
 */
export const getJobDisplayPrice = (job: Job): number => {
  // For itemized pricing mode, calculate total from job items
  if (job.pricing_mode === 'itemized' && job.job_items && job.job_items.length > 0) {
    return calculateJobItemsTotal(job.job_items, job.discount_percent || 0);
  }
  
  // For simple pricing mode or backward compatibility, use the rate
  return job.rate;
};