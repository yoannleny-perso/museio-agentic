import { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from './use-toast';
import { Job } from '@/types';
import { formatTimeWithoutSeconds } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/auth';
import { useNotificationSettings } from './useNotificationSettings';
import { useInvoiceSettings } from './useInvoiceSettings';

type EmailType = 'created' | 'updated' | 'cancelled';

// Interface for the job confirmation request
interface JobConfirmationRequest {
  job: {
    id: string;
    title: string;
    client: string;
    location: string;
    date: string;
    start_time: string;
    end_time: string;
    formattedDate: string;
    contact_email: string;
    total: string; // Changed from number to string since it's formatted with toFixed(2)
  };
  artist: {
    name: string;
    email: string;
    phone?: string;
    username?: string;
  };
  action: EmailType;
  userId?: string; // Add user ID to check notification settings
  receiveEmailCopy?: boolean; // Add flag to indicate if user wants to receive a copy
}

interface JobConfirmationResult {
  success: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
}

/**
 * Hook for sending job confirmation emails to clients
 */
export const useJobConfirmationEmail = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const { profileData } = useProfile();
  const { user } = useAuth();
  const { 
    sendJobConfirmation, 
    sendJobUpdates, 
    sendJobCancellations, 
    receiveEmailCopies
  } = useNotificationSettings();

  const { invoiceSettings} = useInvoiceSettings();
  
  /**
   * Format job data for the email request
   */
  const formatJobForEmail = (job: Job, type: EmailType) => {
    // Format the date for display in DD Mon YYYY format
    const formattedDate = format(new Date(job.date), 'dd MMM yyyy');
    
    // Format the time for display
    const startTime = formatTimeWithoutSeconds(job.start_time);
    const endTime = formatTimeWithoutSeconds(job.end_time);

    // Calculate the total as a number (not string)
    const totalAmount = invoiceSettings.addGST ? Math.round((job.rate * 1.1) * 100) / 100 : job.rate;
    
    // Build the job object for the email request
    return {
      job: {
        id: job.id,
        title: job.title,
        client: job.client,
        location: job.location,
        date: job.date,
        start_time: startTime,
        end_time: endTime,
        formattedDate: formattedDate,
        contact_email: job.contact_email,
        total: totalAmount.toFixed(2) // Ensure total is a string with 2 decimal places
      },
      artist: {
        name: profileData?.firstName && profileData?.lastName 
          ? `${profileData.firstName} ${profileData.lastName}` 
          : 'Your service provider',
        email: profileData?.email || '',
        phone: profileData?.phone,
        username: profileData?.username
      },
      action: type,
      userId: user?.id, // Include the user ID to check notification settings
      receiveEmailCopy: receiveEmailCopies // Include flag for receiving email copy
    };
  };
  
  /**
   * Send a job confirmation email using the Edge Function
   */
  const sendJobConfirmationRequest = async (
    requestData: JobConfirmationRequest
  ): Promise<JobConfirmationResult> => {
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-job-confirmation', {
        body: requestData
      });
      
      if (error) {
        console.error('[useJobConfirmationEmail] ❌ Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Edge function returned a non-2xx status code',
        };
      }
      
      // Check for errors in the response
      if (!data.success) {
        console.error('[useJobConfirmationEmail] ❌ Email sending failed:', data.error);
        return {
          success: false,
          error: data.error || 'Email sending failed',
        };
      }
      
      return {
        success: true,
        skipped: data.skipped === true,
        message: data.message,
      };
    } catch (error) {
      console.error('[useJobConfirmationEmail] ❌ Exception calling edge function:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown exception while sending email',
      };
    }
  };
  
  /**
   * Send a job confirmation email to the client
   */
  const sendJobConfirmationEmail = async (
    job: Job,
    profileData: any,
    type: EmailType = 'created'
  ) => {
    // Skip if no email provided
    if (!job.contact_email) {
      return false;
    }

    // Skip if no profile data available
    if (!profileData) {
      console.error('[useJobConfirmationEmail] ❌ No profile data available, cannot send email');
      return false;
    }
    
    // Check if this type of notification is enabled
    const settingEnabled = 
      (type === 'created' && sendJobConfirmation) || 
      (type === 'updated' && sendJobUpdates) || 
      (type === 'cancelled' && sendJobCancellations);
    
    if (!settingEnabled) {
      return false;
    }
    
    setIsSending(true);
    
    try {
      // Format the job data for the email request
      const requestData = formatJobForEmail(job, type);
      
      // Send the email request to the edge function
      const result = await sendJobConfirmationRequest(requestData);
      
      if (!result.success) {
        console.log('[useJobConfirmationEmail] ❌ Edge function returned failure');
        toast({
          title: 'Email failed',
          description: result.error || 'Could not send confirmation email to the client.',
          variant: 'destructive'
        });
        return false;
      }

      if (result.skipped) {
        console.log('[useJobConfirmationEmail] ℹ️ Email sending skipped:', result.message);
        return true;
      }
      
      console.log('[useJobConfirmationEmail] ✅ Email sent successfully!');
      toast({
        title: 'Email sent',
        description: `Confirmation email has been sent to ${job.contact_email}.`
      });
      
      console.log('[useJobConfirmationEmail] 📧 ========== EMAIL SENDING PROCESS COMPLETED ==========');
      return true;
    } catch (error) {
      console.error('[useJobConfirmationEmail] ❌ Exception while sending confirmation email:', error);
      console.log('[useJobConfirmationEmail] 📧 ========== EMAIL SENDING PROCESS FAILED ==========');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while sending the confirmation.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };
  
  return {
    sendJobConfirmationEmail,
    isSending
  };
};
