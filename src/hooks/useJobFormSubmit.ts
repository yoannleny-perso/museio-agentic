
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { useJobConfirmationEmail } from './useJobConfirmationEmail';
import { useProfile } from '@/context/ProfileContext';
import { useNotificationSettings } from './useNotificationSettings';
import { useSupabaseClients } from './useSupabaseClients';
import { Job } from '@/types';
import { getCanonicalJobStatus } from '@/contracts';

export interface UseJobFormSubmitProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export type JobFormValues = {
  title?: string;
  job_number?: string;
  job_description?: string;
  location?: string;
  client?: string;
  contact_name?: string;
  date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  rate?: string | number;
  notes?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: string;
  pricing_mode?: string | null;
  job_items?: Job['job_items'];
  client_id?: string | null;
};

export const useJobFormSubmit = (options: UseJobFormSubmitProps = {}) => {
  const { addJob, updateJob, deleteJob, fetchJobs } = useAppContext();
  const { findOrCreateClient } = useSupabaseClients(async () => {
    await fetchJobs(true);
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const { sendJobConfirmation } = useNotificationSettings();
  const { sendJobConfirmationEmail } = useJobConfirmationEmail();
  const { profileData } = useProfile();
  const { onSuccess } = options;

  // Format job data and handle client creation
  const formatJobData = async (
    data: JobFormValues,
    isDraft = false
  ): Promise<Omit<Job, 'id'>> => {
    // Check if we need to create a new client
    const clientData = {
      venue_name: data.client,
      contact_name: data.contact_name || undefined,
      location: data.location || undefined,
      email_address: data.contact_email || undefined,
      phone: data.contact_phone || undefined,
    };

    let clientId = undefined;
    
    // Find or create client if it doesn't exist (only if we have a venue name)
    if (clientData.venue_name && !isDraft) {
      try {
        const client = await findOrCreateClient(clientData);
        if (client) {
          clientId = client.id;
        } else {
          console.error('[useJobFormSubmit] Failed to find or create client - no client returned');
        }
      } catch (error) {
        console.error('[useJobFormSubmit] Error finding or creating client:', error);
      }
    }

    // Calculate rate from job items if using itemized pricing
    let finalRate = parseFloat(String(data.rate ?? '0'));
    let finalPricingMode: 'simple' | 'itemized' =
      data.pricing_mode === 'simple' ? 'simple' : 'itemized';
    
    // Determine pricing mode and rate
    if (data.pricing_mode === 'itemized' && data.job_items && data.job_items.length > 0) {
      const { calculateJobItemsTotal } = await import('@/services/jobItemsService');
      finalRate = calculateJobItemsTotal(data.job_items);
      finalPricingMode = 'itemized';
    } else if (data.job_items && data.job_items.length > 0 && !data.pricing_mode) {
      // Backward compatibility: if we have job items but no explicit pricing mode
      const { calculateJobItemsTotal } = await import('@/services/jobItemsService');
      finalRate = calculateJobItemsTotal(data.job_items);
      finalPricingMode = 'itemized';
    }

    const schedule = {
      date: data.date || '',
      end_date: data.end_date || data.date || '',
      start_time: data.start_time || '09:00',
      end_time: data.end_time || '17:00',
    };

    return {
      title: data.title || '',
      job_number: data.job_number || '',
      job_description: data.job_description || '',
      location: data.location || '',
      client: data.client || '',
      client_id: clientId,
      date: data.date || '',
      end_date: data.end_date || data.date || '',
      start_time: data.start_time || '09:00',
      end_time: data.end_time || '17:00',
      rate: finalRate,
      status: getCanonicalJobStatus(schedule, undefined, { isDraft }),
      notes: data.notes || '',
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      job_items: finalPricingMode === 'itemized' ? (data.job_items || []) : undefined,
      pricing_mode: finalPricingMode
    };
  };

  // Handle form submission for new jobs
  const handleFormSubmit = async (data: JobFormValues, jobId?: string) => {
    setIsSaving(true);
    
    try {
      const formattedData = await formatJobData(data, false);
            
      if (jobId) {
        // Update existing job
        const success = await updateJob(jobId, formattedData);
        if (success) {
          toast({
            title: "Success",
            description: "Job updated successfully"
          });
          
          // If updating to upcoming status, may need to send confirmation email
          if (formattedData.status === 'upcoming' && sendJobConfirmation && formattedData.contact_email) {
            await sendJobConfirmationEmail({...formattedData, id: jobId} as Job, profileData, 'updated');
          }
          
          if (onSuccess) onSuccess();
        } else {
          toast({
            title: "Error",
            description: "Failed to update job",
            variant: "destructive"
          });
        }
      } else {
        // Create new job
        const newJob = await addJob(formattedData);
        if (newJob) {
          toast({
            title: "Success",
            description: "Job created successfully"
          });
          
          // Send confirmation email if needed (only for upcoming jobs)
          if (newJob.status === 'upcoming' && sendJobConfirmation && newJob.contact_email) {
            await sendJobConfirmationEmail(newJob, profileData, 'created');
          }
          
          if (onSuccess) onSuccess();
        } else {
          toast({
            title: "Error",
            description: "Failed to create job",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error submitting job form:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving as draft - explicitly guarantee draft status
  const handleSaveDraft = async (data: JobFormValues, jobId?: string) => {
    setIsSaving(true);
    
    try {
      // Force draft status regardless of date
      const draftData = await formatJobData(data, true);
      
      if (jobId) {
        // Update existing draft
        const success = await updateJob(jobId, draftData);
        if (success) {
          toast({
            title: "Success",
            description: "Draft saved successfully"
          });
          
          if (onSuccess) onSuccess();
        } else {
          toast({
            title: "Error",
            description: "Failed to save draft",
            variant: "destructive"
          });
        }
      } else {
        // Create new draft
        const newDraft = await addJob(draftData);
        if (newDraft) {
          toast({
            title: "Success",
            description: "Draft saved successfully"
          });
          
          if (onSuccess) onSuccess();
        } else {
          toast({
            title: "Error",
            description: "Failed to create draft",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId: string) => {
    setIsSaving(true);
    
    try {
      const success = await deleteJob(jobId);
      if (success) {
        toast({
          title: "Success",
          description: "Job deleted successfully"
        });
        
        if (onSuccess) onSuccess();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle closing the form - just navigate away
  const handleClose = () => {
      navigate(-1);
  };

  return {
    isSaving,
    handleClose,
    handleFormSubmit,
    handleSaveDraft,
    handleDeleteJob,
    formatJobData
  };
};
