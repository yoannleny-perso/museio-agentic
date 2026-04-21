import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Job, JobStatus } from '@/types';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useJobConfirmationEmail } from '@/hooks/useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';

/**
 * Hook for handling job CRUD operations
 */
export const useJobOperations = () => {
  const { updateJob, deleteJob, fetchJobs, addJob, jobs } = useAppContext();
  const { toast } = useToast();
  const { sendJobConfirmation, sendJobCancellations, isLoading: notificationSettingsLoading } = useNotificationSettings();
  const { sendJobConfirmationEmail, isSending: isEmailSending } = useJobConfirmationEmail();
  const { profileData, loading: profileLoading } = useProfile();
  
  // Handle job edit
  const handleEditJob = (id: string, jobData: Partial<Job>) => {
    console.log('[useJobOperations] Editing job:', id, 'Status change:', 
      jobData.status ? `to ${jobData.status}` : 'no status change');
    
    return updateJob(id, jobData)
      .then(success => {
        if (success) {
          console.log(`[useJobOperations] Successfully updated job ${id}`);
          toast({
            title: 'Job updated',
            description: 'Your changes have been saved successfully.',
          });
          
          return true;
        } else {
          console.error(`[useJobOperations] Failed to update job ${id}`);
          return false;
        }
      });
  };
  
  // Handle job deletion with improved cancellation email logic
  const handleDeleteJob = async (id: string): Promise<boolean> => {
    console.log('[useJobOperations] ========== DELETION PROCESS STARTED ==========');
    console.log('[useJobOperations] Delete request received for job:', id);
    
    try {
      // 1. CAPTURE JOB DATA BEFORE DELETION
      const jobToDelete = jobs.find(job => job.id === id);
      if (!jobToDelete) {
        console.error('[useJobOperations] ❌ Job not found for deletion:', id);
        return false;
      }
      
      console.log('[useJobOperations] 📋 Captured job data before deletion:', {
        jobId: jobToDelete.id,
        jobTitle: jobToDelete.title,
        jobStatus: jobToDelete.status,
        contactEmail: jobToDelete.contact_email,
        isUpcoming: jobToDelete.status === 'upcoming',
        hasContactEmail: !!jobToDelete.contact_email
      });
      
      // 2. WAIT FOR NOTIFICATION SETTINGS TO LOAD
      if (notificationSettingsLoading) {
        console.log('[useJobOperations] ⏳ Waiting for notification settings to load...');
        let attempts = 0;
        const maxAttempts = 10; // 5 seconds max wait
        
        while (notificationSettingsLoading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          console.log(`[useJobOperations] Settings loading attempt ${attempts}/${maxAttempts}`);
        }
        
        if (notificationSettingsLoading) {
          console.warn('[useJobOperations] ⚠️ Notification settings still loading after timeout');
        }
      }
      
      console.log('[useJobOperations] 📧 Final notification settings check:', {
        sendJobCancellations,
        notificationSettingsLoading,
        profileDataAvailable: !!profileData,
        profileLoading
      });
      
      // 3. EXECUTE DELETION
      console.log('[useJobOperations] 🗑️ Calling deleteJob API...');
      const deleteSuccess = await deleteJob(id);
      console.log('[useJobOperations] Delete API returned:', deleteSuccess);
      
      if (!deleteSuccess) {
        console.error('[useJobOperations] ❌ Delete operation failed');
        return false;
      }
      
      // 4. SEND CANCELLATION EMAIL IMMEDIATELY AFTER SUCCESSFUL DELETION
      const shouldSendCancellationEmail = (
        jobToDelete.status === 'upcoming' &&
        jobToDelete.contact_email &&
        sendJobCancellations
      );
      
      console.log('[useJobOperations] 📧 Email sending decision:', {
        shouldSendCancellationEmail,
        isUpcoming: jobToDelete.status === 'upcoming',
        hasContactEmail: !!jobToDelete.contact_email,
        sendJobCancellationsEnabled: sendJobCancellations
      });
      
      if (shouldSendCancellationEmail) {
        console.log('[useJobOperations] ✅ ALL CONDITIONS MET - Sending cancellation email');
        
        // Wait for profile data if still loading
        if (profileLoading) {
          console.log('[useJobOperations] ⏳ Waiting for profile data...');
          let profileAttempts = 0;
          const maxProfileAttempts = 6; // 3 seconds max wait
          
          while (profileLoading && profileAttempts < maxProfileAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            profileAttempts++;
            console.log(`[useJobOperations] Profile loading attempt ${profileAttempts}/${maxProfileAttempts}`);
          }
        }
        
        if (!profileData) {
          console.error('[useJobOperations] ❌ Profile data not available for email sending');
          toast({
            title: 'Email not sent',
            description: 'Job was cancelled but notification email could not be sent - profile data unavailable.',
            variant: 'destructive'
          });
        } else {
          try {
            console.log('[useJobOperations] 📧 Calling sendJobConfirmationEmail...');
            const emailResult = await sendJobConfirmationEmail(jobToDelete, profileData, 'cancelled');
            console.log('[useJobOperations] 📧 Email send result:', emailResult);
            
            if (!emailResult) {
              console.warn('[useJobOperations] ⚠️ Email sending failed but job was deleted');
              toast({
                title: 'Job cancelled',
                description: 'Job was cancelled but notification email could not be sent.',
                variant: 'destructive'
              });
            }
          } catch (emailError) {
            console.error('[useJobOperations] ❌ Exception while sending email:', emailError);
            toast({
              title: 'Job cancelled',
              description: 'Job was cancelled but notification email failed to send.',
              variant: 'destructive'
            });
          }
        }
      } else {
        console.log('[useJobOperations] ℹ️ Cancellation email not sent - conditions not met');
        if (jobToDelete.status !== 'upcoming') {
          console.log('[useJobOperations] - Job is not upcoming, no cancellation needed');
        }
        if (!jobToDelete.contact_email) {
          console.log('[useJobOperations] - No contact email provided');
        }
        if (!sendJobCancellations) {
          console.log('[useJobOperations] - Cancellation emails disabled in settings');
        }
      }
      
      // Show success toast
      toast({
        title: jobToDelete.status === 'upcoming' ? 'Job cancelled' : 'Job deleted',
        description: jobToDelete.status === 'upcoming' ? 'The job has been cancelled.' : 'The job has been deleted.',
      });
      
      console.log('[useJobOperations] ========== DELETION PROCESS COMPLETED SUCCESSFULLY ==========');
      return true;
      
    } catch (error: any) {
      console.error('[useJobOperations] ❌ Exception during deletion process:', error);
      console.log('[useJobOperations] ========== DELETION PROCESS FAILED ==========');
      toast({
        title: 'Delete failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Refresh jobs
  const refreshJobs = async () => {
    try {
      await fetchJobs();
      return true;
    } catch (error) {
      console.error('[useJobOperations] Error refreshing jobs:', error);
      return false;
    }
  };
  
  // Handle adding a new job
  const handleJobSubmit = (data: Omit<Job, 'id'>) => {
    console.log('[useJobOperations] Creating new job with status:', data.status);
    
    // No longer forcing status to 'upcoming' - use the status determined by the date
    const jobData = { ...data };
    
    addJob(jobData).then(async newJob => {
      if (newJob) {
        toast({
          title: 'Job created',
          description: `${jobData.title} has been successfully booked.`,
        });
        
        // Send confirmation email only if feature is enabled AND job status is "upcoming"
        if (sendJobConfirmation && newJob.status === 'upcoming') {
          console.log('[useJobOperations] Attempting to send confirmation email for new job:', newJob.id);
          
          // Check if profile data is available
          if (profileLoading) {
            console.log('[useJobOperations] Profile data is still loading, will retry');
            
            // Wait for profile data to be available (with timeout)
            let attempts = 0;
            const maxAttempts = 3;
            const attemptSendEmail = async () => {
              attempts++;
              if (profileData && profileData.firstName && profileData.email) {
                console.log('[useJobOperations] Profile data now available, sending email');
                await sendJobConfirmationEmail(newJob, profileData, 'created');
              } else if (attempts < maxAttempts) {
                console.log(`[useJobOperations] Profile data still not available, attempt ${attempts}/${maxAttempts}`);
                setTimeout(attemptSendEmail, 500); // Retry after 500ms
              } else {
                console.warn('[useJobOperations] Failed to get profile data after multiple attempts');
                toast({
                  title: 'Could not send confirmation email',
                  description: 'Your profile data could not be loaded. The job was created successfully.',
                  variant: 'destructive'
                });
              }
            };
            
            // Start retry process
            setTimeout(attemptSendEmail, 500);
          } else if (!profileData || !profileData.firstName || !profileData.email) {
            console.warn('[useJobOperations] Cannot send email - missing required profile fields');
            toast({
              title: 'Could not send confirmation email',
              description: 'Your profile is incomplete. Please update your profile in Settings.',
              variant: 'destructive'
            });
          } else {
            console.log('[useJobOperations] Profile data available, sending confirmation email');
            sendJobConfirmationEmail(newJob, profileData, 'created');
          }
        } else {
          console.log('[useJobOperations] Not sending email - conditions not met:', {
            sendJobConfirmation,
            jobStatus: newJob.status,
            expectedStatus: 'upcoming'
          });
        }
      }
    });
  };

  return {
    handleEditJob,
    handleDeleteJob,
    refreshJobs,
    handleJobSubmit
  };
};
