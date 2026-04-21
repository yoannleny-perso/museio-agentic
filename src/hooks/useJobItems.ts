import { useQuery } from '@tanstack/react-query';
import { fetchJobItems } from '@/services/jobItemsService';
import { JobItem } from '@/types';

export const useJobItems = (jobId: string | undefined) => {
  return useQuery<JobItem[]>({
    queryKey: ['job-items', jobId],
    queryFn: () => fetchJobItems(jobId!),
    enabled: !!jobId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};