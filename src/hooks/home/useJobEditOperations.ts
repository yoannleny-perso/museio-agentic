
import { useState } from 'react';
import { Job } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';

/**
 * Hook for job editing operations on the home page
 */
export const useJobEditOperations = (
  setProcessingJobId: (id: string | null) => void,
) => {
  const { updateJob, deleteJob } = useAppContext();
  const { toast } = useToast();
  const [isJobProcessing, setIsJobProcessing] = useState(false);
  const [localProcessingJobId, setLocalProcessingJobId] = useState<string | null>(null);

  // Handle job edit
  const handleEditJob = async (id: string, data: Partial<Job>): Promise<boolean> => {
    setIsJobProcessing(true);
    setLocalProcessingJobId(id);
    setProcessingJobId(id);
    
    try {
      const success = await updateJob(id, data);
      
      if (success) {
        toast({
          title: 'Job updated',
          description: 'Your changes have been saved successfully.',
        });
        return true;
      } else {
        toast({
          title: 'Update failed',
          description: 'There was a problem updating the job.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: 'Update failed',
        description: 'There was a problem updating the job.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsJobProcessing(false);
      setLocalProcessingJobId(null);
      setProcessingJobId(null);
    }
  };
  
  // Handle job deletion
  const handleDeleteJob = async (id: string): Promise<boolean> => {
    setIsJobProcessing(true);
    setLocalProcessingJobId(id);
    setProcessingJobId(id);
    
    try {
      const success = await deleteJob(id);
      
      if (success) {
        toast({
          title: 'Job deleted',
          description: 'The job has been successfully deleted.',
        });
        return true;
      } else {
        toast({
          title: 'Delete failed',
          description: 'There was a problem deleting the job.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Delete failed',
        description: 'There was a problem deleting the job.',
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
    handleEditJob,
    handleDeleteJob,
    isJobProcessing,
    localProcessingJobId
  };
};
