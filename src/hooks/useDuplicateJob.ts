
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '@/types';
import { useJobFormSubmit } from './useJobFormSubmit';
import { useToast } from '@/components/ui/use-toast';

interface UseDuplicateJobOptions {
  onCloseCurrentModal?: () => void;
}

export const useDuplicateJob = (options?: UseDuplicateJobOptions) => {
  const [jobToDuplicate, setJobToDuplicate] = useState<Job | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleFormSubmit } = useJobFormSubmit({
    //: '/app/jobs'
  });
  
  // Handle job duplication request
  const handleDuplicateJob = (job: Job) => {
    // Store the job to duplicate
    setJobToDuplicate({
      ...job,
      // Remove ID to ensure we create a new job
      id: undefined as any
    });
    
    /*
    // Close current modal if provided
    if (options?.onCloseCurrentModal) {
      options.onCloseCurrentModal();
    }*/
    
    // Open the new job form with pre-populated data
    setIsDuplicateModalOpen(true);
  };
  
  // Handle submitting the duplicated job - using the same flow as creating a new job
  const handleDuplicatedJobSubmit = async (data: Omit<Job, 'id'>) => {
    
    try {
      // Use the job form submit handler to ensure proper status determination and notification handling
      await handleFormSubmit(data);
      
      // Close the modal after successful submission
      setIsDuplicateModalOpen(false);
      setJobToDuplicate(null);
    } catch (error) {
      console.error('[useDuplicateJob] Error creating duplicated job:', error);
      toast({
        title: "Error",
        description: "Failed to create duplicated job",
        variant: "destructive"
      });
    }
  };
  
  // Close the duplication modal
  const handleCloseDuplicateModal = () => {
    setIsDuplicateModalOpen(false);
    setJobToDuplicate(null);
  };
  
  return {
    jobToDuplicate,
    isDuplicateModalOpen,
    setIsDuplicateModalOpen,
    handleDuplicateJob,
    handleDuplicatedJobSubmit,
    handleCloseDuplicateModal
  };
};
