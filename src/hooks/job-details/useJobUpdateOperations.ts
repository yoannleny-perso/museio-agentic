
import { useState } from 'react';
import { Job } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useJobConfirmationEmail } from '@/hooks/useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';

export const useJobUpdateOperations = (
  job: Job,
  onUpdateJob: (job: Job) => void,
  onEdit?: (id: string, data: Partial<Job>) => Promise<boolean> | void,
  onClose?: (e?: React.MouseEvent) => void
) => {
  const { toast } = useToast();
  const { sendJobConfirmation } = useNotificationSettings();
  const { sendJobConfirmationEmail } = useJobConfirmationEmail();
  const { profileData } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  const handleJobUpdate = async (data: any): Promise<boolean> => {
    try {
      const updatedJob = {
        ...job,
        ...data,
        rate: typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate
      };

      // Set saving state to show loading indicators
      setIsSaving(true);
      
      if (onEdit) {
        // Call the edit handler passed as props
        const success = await onEdit(job.id, data);
        
        // Send confirmation email when job is updated, if the setting is enabled
        // and if the job is an upcoming one
        if (success && sendJobConfirmation && job.status === 'upcoming' && job.contact_email) {
          console.log("Sending job update confirmation email");
          await sendJobConfirmationEmail(
            { ...job, ...data },
            profileData,
            'updated'
          );
        }
        
        return success || false;
      } else {
        // Fallback to direct update method
        onUpdateJob(updatedJob);
        
        // Show success toast notification
        toast({
          title: 'Job updated',
          description: 'The job details have been successfully updated.',
        });
        
        // Close the modal if onClose is provided
        if (onClose) {
          onClose();
        }
        
        return true;
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
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleJobUpdate
  };
};
