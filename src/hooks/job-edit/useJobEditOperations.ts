
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '../use-toast';
import { Job } from '@/types';
import { useJobConfirmationEmail } from '../useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';
import { useNotificationSettings } from '../useNotificationSettings';
import { useJobOperations } from '../useJobOperations';
import { useJobNotifications } from './useJobNotifications';
import { useSupabaseClients } from '../useSupabaseClients';
import { evaluateJobStatus } from '@/utils/jobStatusUpdater';

export const useJobEditOperations = (currentJob: Job | null, id: string) => {
  const navigate = useNavigate();
  const { handleEditJob, handleDeleteJob } = useJobOperations();
  const { fetchJobs } = useAppContext();
  const { findOrCreateClient } = useSupabaseClients(async () => {
    await fetchJobs(true);
  });
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { sendJobConfirmationEmail } = useJobConfirmationEmail();
  const { profileData } = useProfile();
  const { sendJobConfirmation } = useNotificationSettings();
  const { handleJobUpdateNotification } = useJobNotifications();

  // Handle form submission
  const handleFormSubmit = async (jobData: any) => {
    if (!id || !currentJob) return;
    
    setIsSaving(true);
    setServerError(null);
    
    try {
      // Convert string rate to number before sending to API
      const formattedData: Partial<Job> = {
        ...jobData,
        rate: Number(jobData.rate)
      };
      
      // Check if this is a draft being converted to a job
      const isDraftConversion = currentJob.status === 'drafted';
      
      // Re-evaluate job status based on date/time data and current status
      const previousStatus = currentJob.status;
      let newStatus = previousStatus;
      
      if (isDraftConversion) {
        // For draft conversions, evaluate the appropriate status based on date/time
        newStatus = evaluateJobStatus(
          {
            date: formattedData.date || currentJob.date,
            end_date: formattedData.end_date || currentJob.end_date,
            start_time: formattedData.start_time || currentJob.start_time,
            end_time: formattedData.end_time || currentJob.end_time,
          },
          currentJob.status,
          false // Not saving as draft
        );
      } else {
        // For regular edits, re-evaluate status but preserve invoice-sent/paid statuses
        newStatus = evaluateJobStatus(
          {
            date: formattedData.date || currentJob.date,
            end_date: formattedData.end_date || currentJob.end_date,
            start_time: formattedData.start_time || currentJob.start_time,
            end_time: formattedData.end_time || currentJob.end_time,
          },
          currentJob.status,
          false // Not saving as draft
        );
      }
      
      // Apply the evaluated status
      formattedData.status = newStatus;
      
      // Handle client creation/finding logic
      const clientData = {
        venue_name: formattedData.client || jobData.client,
        contact_name: formattedData.contact_name || jobData.contact_name || undefined,
        location: formattedData.location || jobData.location || undefined,
        email_address: formattedData.contact_email || jobData.contact_email || undefined,
        phone: formattedData.contact_phone || jobData.contact_phone || undefined,
      };

      // Check if we need to create a new client (if client name exists and no client_id is set)
      if (clientData.venue_name && !formattedData.client_id && !currentJob.client_id) {
        console.log('[useJobEditOperations] Finding or creating client data:', clientData);
        const client = await findOrCreateClient(clientData);
        if (client) {
          formattedData.client_id = client.id;
          console.log('[useJobEditOperations] Client found/created with ID:', client.id);
        }
      }
      
      console.log('[useJobEditOperations] Status evaluation:', {
        isDraftConversion,
        previousStatus,
        newStatus,
        statusChanged: previousStatus !== newStatus,
        hasContactEmail: !!formattedData.contact_email,
        clientId: formattedData.client_id
      });
      
      const success = await handleEditJob(id, formattedData);
      if (success) {
        toast({
          title: "Success",
          description: isDraftConversion ? "Draft converted to job" : "Job updated successfully",
        });
        
        // Handle email notifications for draft conversions
        if (isDraftConversion && sendJobConfirmation && formattedData.status === 'upcoming') {
          console.log('[useJobEditOperations] Draft converted to job, sending confirmation email');
          
          // Create the complete job object for email sending
          const completeJobData: Job = {
            ...currentJob,
            ...formattedData,
            id
          };
          
          // Only send if there's a contact email
          if (completeJobData.contact_email) {
            console.log('[useJobEditOperations] Sending job creation email for converted draft:', completeJobData.id);
            await sendJobConfirmationEmail(completeJobData, profileData, 'created');
          } else {
            console.log('[useJobEditOperations] No contact email provided for converted draft');
          }
        }
        // Handle email notifications for regular job updates (not draft conversions)
        else if (!isDraftConversion && currentJob.status === 'upcoming') {
          console.log('[useJobEditOperations] Regular job update, checking if notification should be sent');
          await handleJobUpdateNotification(currentJob, formattedData, id);
        }
        
      } else {
        setServerError('Failed to update job. Please try again later.');
      }
    } catch (error: any) {
      console.error('[useJobEditOperations] Error updating job:', error);
      setServerError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save as draft - FIXED: Now uses the provided form data
  const handleSaveDraft = async (formData: any) => {
    if (!id) return;
    
    setIsSaving(true);
    setServerError(null);
    
    try {
      // Get current form data and mark as draft
      const draftData: Partial<Job> = {
        ...formData,
        status: 'drafted' as const,
        rate: Number(formData.rate)
      };
      
      console.log('[useJobEditOperations] Saving draft with data:', draftData);
      
      const success = await handleEditJob(id, draftData);
      if (success) {
        toast({
          title: "Success",
          description: "Draft saved successfully",
        });
      } else {
        setServerError('Failed to save draft. Please try again later.');
      }
    } catch (error: any) {
      console.error('[useJobEditOperations] Error saving draft:', error);
      setServerError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle job deletion
  const handleDelete = async () => {
    if (!id) return false;
    
    setIsSaving(true);
    setServerError(null);
    
    try {
      const success = await handleDeleteJob(id);
      if (success) {
        // Success notification is now handled in the deleteJob function itself
        return true;
      } else {
        setServerError('Failed to delete job. Please try again later.');
        return false;
      }
    } catch (error: any) {
      console.error('[useJobEditOperations] Error deleting job:', error);
      setServerError(error.message || 'An unexpected error occurred.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    serverError,
    setServerError,
    handleFormSubmit,
    handleSaveDraft,
    handleDelete
  };
};
