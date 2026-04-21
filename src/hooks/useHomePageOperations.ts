
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useToast } from './use-toast';
import { Job } from '@/types';
import { useJobConfirmationEmail } from './useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';
import { useNotificationSettings } from './useNotificationSettings';
import { useJobOperations } from './useJobOperations';

export const useHomePageOperations = () => {
  const navigate = useNavigate();
  const { addJob } = useAppContext();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const { sendJobConfirmationEmail } = useJobConfirmationEmail();
  const { profileData } = useProfile();
  const { sendJobConfirmation } = useNotificationSettings();
  const { handleEditJob, handleDeleteJob, handleJobSubmit: globalHandleJobSubmit } = useJobOperations();

  // Handle job submission from the form
  const handleJobSubmit = async (jobData: Omit<Job, 'id'>) => {
    try {
      const newJob = await addJob(jobData);
      if (newJob) {
        toast({
          title: "Success",
          description: "Job created successfully"
        });
        
        // Send confirmation email if needed (only for upcoming jobs)
        if (newJob.status === 'upcoming' && sendJobConfirmation && newJob.contact_email) {
          console.log('[useHomePageOperations] Sending job creation email for new job:', newJob.id);
          await sendJobConfirmationEmail(newJob, profileData, 'created');
        }
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive"
      });
    }
  };

  // Navigate to new job page
  const handleNewJobNavigation = () => {
    navigate('/app/jobs/new');
  };

  return {
    handleJobSubmit,
    handleNewJobNavigation,
    handleEditJob,
    handleDeleteJob,
    isSending,
    setIsSending,
    isMarkingAsPaid,
    setIsMarkingAsPaid
  };
};
