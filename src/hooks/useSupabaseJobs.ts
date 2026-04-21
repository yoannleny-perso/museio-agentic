import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Job } from '@/types';
import { useAuth } from '@/context/auth';
import { useJobsState } from './useJobsState';
import { useSupabaseClients } from './useSupabaseClients';
import { 
  fetchJobsFromSupabase, 
  addJobToSupabase, 
  updateJobInSupabase,
  deleteJobFromSupabase
} from '@/services/jobService';
import { mapToJobs, mapToJob } from '@/services/jobMapper';

export const useSupabaseJobs = () => {
  const { 
    jobs, 
    loading, 
    error, 
    setLoading, 
    setError, 
    setAllJobs,
    addJobToState,
    updateJobInState,
    removeJobFromState 
  } = useJobsState();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { findOrCreateClient } = useSupabaseClients();
  const lastFetchTime = useRef<number>(0);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const MIN_FETCH_INTERVAL = 60 * 1000;

  // Fetch all jobs for the authenticated user
  const fetchJobs = useCallback(async (force: boolean = false) => {
    if (!user) return;
    
    // Check if we should skip fetching (unless forced)
    const now = Date.now();
    if (!force && (now - lastFetchTime.current) < MIN_FETCH_INTERVAL) {
      return;
    }
    
    try {
      setLoading(true);
      lastFetchTime.current = now;
      
      const data = await fetchJobsFromSupabase();
      const transformedData = mapToJobs(data);
      setAllJobs(transformedData);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Error fetching jobs',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, setLoading, setError, setAllJobs, MIN_FETCH_INTERVAL]);

  // Add a new job
  const addJob = async (jobData: Omit<Job, 'id'>) => {
    if (!user) return null;
    
    try {
      const data = await addJobToSupabase(jobData, user.id);
      const newJob = mapToJob(data);
      
      addJobToState(newJob);
      
      return newJob;
    } catch (error: any) {
      toast({
        title: 'Error creating job',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  // Update an existing job
  const updateJob = async (id: string, jobData: Partial<Job>) => {
    if (!user) return false;
    
    try {
      const processedJobData = { ...jobData };
      
      if (jobData.client && (jobData.contact_name || jobData.contact_email || jobData.location || jobData.contact_phone)) {
        const clientData = {
          venue_name: jobData.client,
          contact_name: jobData.contact_name || undefined,
          location: jobData.location || undefined,
          email_address: jobData.contact_email || undefined,
          phone: jobData.contact_phone || undefined,
        };

        try {
          const client = await findOrCreateClient(clientData);
          if (client) {
            processedJobData.client_id = client.id;
          }
        } catch (_clientError) {
          // Allow the job update to continue even if client linking fails.
        }
      }
      
      updateJobInState(id, processedJobData);
      await updateJobInSupabase(id, processedJobData);
      
      return true;
    } catch (error: any) {
      fetchJobs();
      
      toast({
        title: 'Error updating job',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  // Delete a job
  const deleteJob = async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await deleteJobFromSupabase(id);
      removeJobFromState(id);
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      
      return true;
    } catch (error: any) {
      let errorMessage = 'An error occurred while deleting the job.';
      
      // Check for specific foreign key constraint error
      if (error.message && error.message.includes('violates foreign key constraint')) {
        errorMessage = 'This job has associated invoices that need to be deleted first. Please try again.';
      }
      
      toast({
        title: 'Error deleting job',
        description: errorMessage,
        variant: 'destructive'
      });
      
      fetchJobs();
      
      return false;
    }
  };

  // Fetch jobs on mount and when user changes, set up global refresh interval
  useEffect(() => {
    if (user) {
      // Initial fetch with force=true
      fetchJobs(true);
      
      // Keep server data fresh without frequent wakeups on mobile.
      refreshInterval.current = setInterval(() => {
        fetchJobs(false);
      }, 120000);
    } else {
      setAllJobs([]);
      setLoading(false);
      
      // Clear interval when no user
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    }

    // Cleanup interval on unmount or user change
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, [user, fetchJobs, setAllJobs, setLoading]);

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    addJob,
    updateJob,
    deleteJob
  };
};
