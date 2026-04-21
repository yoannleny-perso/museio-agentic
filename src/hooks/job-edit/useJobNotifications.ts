
import { Job } from '@/types';
import { useNotificationSettings } from '../useNotificationSettings';
import { useJobConfirmationEmail } from '../useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '../use-toast';

// Fields to exclude from change detection (internal/system fields)
const EXCLUDED_FIELDS = ['id', 'created_at', 'updated_at', 'status', 'user_id'];

export const useJobNotifications = () => {
  const { sendJobConfirmationEmail } = useJobConfirmationEmail();
  const { sendJobUpdates } = useNotificationSettings();
  const { profileData } = useProfile();
  const { toast } = useToast();

  const getComparableFields = (jobData: Partial<Job>) =>
    Object.keys(jobData).filter(
      (field): field is keyof Job => !EXCLUDED_FIELDS.includes(field)
    );

  // Check if any meaningful fields have changed
  const haveFieldsChanged = (originalJob: Job, updatedData: Partial<Job>): boolean => {
    // Check if any field (except excluded ones) has changed
    return getComparableFields(updatedData).some((field) =>
      updatedData[field] !== undefined && updatedData[field] !== originalJob[field]
    );
  };

  // Determine if a notification should be sent and send it if needed
  const handleJobUpdateNotification = async (
    currentJob: Job, 
    updatedData: Partial<Job>, 
    id: string
  ): Promise<void> => {
    // Check if any meaningful fields were changed that would warrant a notification
    const shouldSendNotification = 
      sendJobUpdates &&
      updatedData.contact_email && 
      currentJob.status === 'upcoming' && 
      haveFieldsChanged(currentJob, updatedData);

    console.log('[useJobNotifications] Should send notification sendJobUpdates:', sendJobUpdates);
    
    console.log('[useJobNotifications] Should send notification:', shouldSendNotification, {
      hasEmail: !!updatedData.contact_email,
      isUpcoming: currentJob.status === 'upcoming',
      hasFieldChanges: haveFieldsChanged(currentJob, updatedData),
      changedFields: getComparableFields(updatedData).filter(
        (field) =>
          updatedData[field] !== undefined && updatedData[field] !== currentJob[field]
      )
    });
    
    // Send notification email if needed
    if (shouldSendNotification) {
      console.log('[useJobNotifications] Sending update notification email');
      // Combine original job with updated data for the email
      const updatedJob: Job = {
        ...currentJob,
        ...updatedData,
        id
      };
      
      await sendJobConfirmationEmail(updatedJob, profileData, 'updated');
      
      toast({
        title: "Client Notified",
        description: "Update notification email sent to client",
      });
    }
  };

  return {
    handleJobUpdateNotification,
    haveFieldsChanged
  };
};
