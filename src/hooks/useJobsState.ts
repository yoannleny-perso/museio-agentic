
import { useState, useCallback } from 'react';
import { Job } from '@/types';

/**
 * Hook for managing jobs state
 */
export const useJobsState = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set all jobs
  const setAllJobs = useCallback((newJobs: Job[]) => {
    setJobs(newJobs);
  }, []);

  // Add a single job to state
  const addJobToState = useCallback((job: Job) => {
    setJobs(prev => [...prev, job]);
  }, []);

  // Update a job in state
  const updateJobInState = useCallback((id: string, jobData: Partial<Job>) => {
    setJobs(prev => 
      prev.map(job => 
        job.id === id ? { ...job, ...jobData } : job
      )
    );
  }, []);

  // Remove a job from state
  const removeJobFromState = useCallback((id: string) => {
    console.log(`[useJobsState] Removing job ${id} from state`);
    setJobs(prev => {
      const newJobs = prev.filter(job => job.id !== id);
      console.log(`[useJobsState] Jobs count before: ${prev.length}, after: ${newJobs.length}`);
      return newJobs;
    });
  }, []);

  return {
    jobs,
    loading,
    error,
    setLoading,
    setError,
    setAllJobs,
    addJobToState,
    updateJobInState,
    removeJobFromState
  };
};
