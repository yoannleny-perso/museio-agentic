
import { useState } from 'react';
import { Job, JobStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useJobConfirmationEmail } from '@/hooks/useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';

export const useJobConfirmationOperations = (
  job: Job,
  onEdit?: (id: string, data: Partial<Job>) => Promise<boolean> | void,
  onClose?: (e?: React.MouseEvent) => void
) => {
  const { toast } = useToast();
  const { sendJobConfirmation } = useNotificationSettings();
  const { sendJobConfirmationEmail } = useJobConfirmationEmail();
  const { profileData } = useProfile();
  const [isConfirming, setIsConfirming] = useState(false);

  // Handle confirming a draft job
  const handleConfirmJob = async (): Promise<boolean> => {
    setIsConfirming(true);
    try {
      // Update the job status to upcoming
      const updatedData = {
        status: 'upcoming' as JobStatus
      };
      if (onEdit) {
        const success = await onEdit(job.id, updatedData);
        if (!success) return false;
      }

      // Send confirmation email if enabled
      if (sendJobConfirmation) {
        await sendJobConfirmationEmail({
          ...job,
          ...updatedData
        }, profileData, 'created');
      }
      toast({
        title: 'Job confirmed',
        description: 'This job has been confirmed and is now scheduled.'
      });

      // Close the modal if a close handler was provided
      if (onClose) {
        onClose();
      }
      
      return true;
    } catch (error) {
      console.error("Error confirming job:", error);
      toast({
        title: 'Confirmation failed',
        description: 'There was a problem confirming this job.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle saving a draft
  const handleSaveDraft = async (): Promise<boolean> => {
    try {
      if (onEdit) {
        // Make sure status remains as 'drafted'
        const success = await onEdit(job.id, {
          status: 'drafted' as JobStatus
        });
        if (!success) return false;
      }
      toast({
        title: 'Draft saved',
        description: 'Your draft has been successfully saved.'
      });

      // Close the modal if a close handler was provided
      if (onClose) {
        onClose();
      }
      
      return true;
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: 'Save failed',
        description: 'There was a problem saving this draft.',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    isConfirming,
    handleConfirmJob,
    handleSaveDraft
  };
};
