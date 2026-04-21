import { useState } from 'react';
import { Job, ProfileData, BankDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useInvoiceSettings } from '../useInvoiceSettings';
import { useSignature } from '@/context/SignatureContext';
import { useBankDetails } from '@/context/BankDetailsContext';
import { useProfile } from '@/context/ProfileContext';
import {
  getInvoiceFunctionName,
  isInvoiceSendResponse,
  type InvoiceRequestPayload,
} from '@/contracts';

/**
 * Convert a URL to base64 data URL
 */
const convertUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    console.log("Converting URL to base64:", url.substring(0, 100) + "...");
    
    // If it's already a data URL, return as is
    if (url.startsWith('data:image')) {
      return url;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert to base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to base64:", error);
    return null;
  }
};

/**
 * Ensure we have a valid session with retries and refresh logic
 */
const ensureValidSession = async (maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[ensureValidSession] Attempt ${attempt}/${maxRetries}`);
    
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`[ensureValidSession] Session error on attempt ${attempt}:`, sessionError);
        if (attempt === maxRetries) return false;
        continue;
      }
      
      if (!session) {
        console.error(`[ensureValidSession] No session found on attempt ${attempt}`);
        return false;
      }
      
      // Check if session is expired or about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const isExpiringSoon = expiresAt && expiresAt <= now + 300;
      
      if (isExpiringSoon) {
        console.log(`[ensureValidSession] Session expiring soon, refreshing...`);
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error(`[ensureValidSession] Refresh failed on attempt ${attempt}:`, refreshError);
          if (attempt === maxRetries) return false;
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        if (!refreshData.session) {
          console.error(`[ensureValidSession] No session after refresh on attempt ${attempt}`);
          if (attempt === maxRetries) return false;
          continue;
        }
        
        console.log(`[ensureValidSession] Session refreshed successfully on attempt ${attempt}`);
        return true;
      }
      
      // Session is valid
      console.log(`[ensureValidSession] Valid session confirmed on attempt ${attempt}`);
      return true;
      
    } catch (error) {
      console.error(`[ensureValidSession] Unexpected error on attempt ${attempt}:`, error);
      if (attempt === maxRetries) return false;
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

/**
 * Hook for sending invoices
 */
export const useInvoiceSender = () => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { receiveEmailCopies } = useNotificationSettings();
  const { refreshInvoiceSettings } = useInvoiceSettings();
  const { signature, fetchSignature } = useSignature();
  const { refreshBankDetails } = useBankDetails();
  const { refreshProfile } = useProfile();

  
  /**
   * Send an invoice for the job with improved authentication handling
   * @param job The job to send an invoice for
   * @param profileData The user's profile data (optional, will fetch fresh if not provided)
   * @param bankDetails The user's bank details (optional, will fetch fresh if not provided)
   * @param logo The logo URL or base64 string (optional, will fetch fresh if not provided)
   */
  const sendInvoice = async (
    job: Job,
    profileData?: ProfileData | null,
    bankDetails?: BankDetails | null,
    logo?: string | null
  ): Promise<boolean> => {
    console.log("Sending invoice for job:", job.id, job.title);
    if (!job || !job.contact_email) {
      toast({
        title: "Cannot send invoice",
        description: "Job or client email is missing",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSending(true);
      console.log("Starting invoice send process for job:", job.id, job.title);
      
      // Step 1: Ensure we have a valid session before proceeding
      console.log("[useInvoiceSender] Ensuring valid session...");
      const hasValidSession = await ensureValidSession();
      
      if (!hasValidSession) {
        console.error("[useInvoiceSender] Failed to establish valid session");
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("[useInvoiceSender] Valid session confirmed, proceeding with invoice...");
      
      // Step 2: Get fresh data before sending invoice
      console.log("[useInvoiceSender] Fetching fresh data before sending invoice...");
      
      // Refresh profile data to ensure we have the latest
      await refreshProfile();
      
      // Refresh bank details to ensure we have the latest
      await refreshBankDetails();
      
      // Get fresh invoice settings
      const freshInvoiceSettings = await refreshInvoiceSettings();
      console.log("[useInvoiceSender] Fresh invoice settings retrieved:", freshInvoiceSettings);
      
      // Get fresh signature data
      await fetchSignature();
      
      // Note: The actual profile and bank details will be fetched by the contexts
      // We'll use the context data which should now be fresh
      
      // Step 3: Validate required data - these will now be the fresh values from contexts
      if (!profileData) {
        toast({
          title: "Cannot send invoice",
          description: "Your profile details are missing. Please complete your profile settings first.",
          variant: "destructive"
        });
        return false;
      }

      console.log("Sending invoice - Passed profileData check")

      if (!bankDetails) {
        toast({
          title: "Cannot send invoice",
          description: "Your bank details are missing. Please add your bank details in settings first.",
          variant: "destructive"
        });
        return false;
      }

      console.log("Sending invoice - Passed bankDetails check")
      
      // Step 4: Convert logo to base64 if it exists and is a URL
      let logoBase64: string | null = null;
      if (freshInvoiceSettings.logo) {
        console.log("Converting logo to base64...");
        logoBase64 = await convertUrlToBase64(freshInvoiceSettings.logo);
        if (logoBase64) {
          console.log("Logo converted to base64 successfully");
        } else {
          console.log("Failed to convert logo to base64, proceeding without logo");
        }
      }
      
      // Step 5: Convert signature to base64 if it exists
      let signatureBase64: string | null = null;
      if (signature) {
        console.log("Converting fresh signature to base64...", signature);
        signatureBase64 = await convertUrlToBase64(signature.displayUrl);
        if (signatureBase64) {
          console.log("Fresh signature converted to base64 successfully");
        } else {
          console.log("Failed to convert signature to base64, proceeding without signature");
        }
      }
      
      // Step 6: Calculate amounts
      const amount = job.rate || 0;
      const gstAmount = Math.round((amount * 0.1) * 100) / 100; // 10% GST
      
      // Step 7: Prepare the artist data from profile
      const artist = {
        name: profileData.firstName && profileData.lastName 
          ? `${profileData.firstName} ${profileData.lastName}`
          : profileData.username || "Artist",
        email: profileData.email || "",
        companyName: profileData.companyName || "",
        companyAddress: profileData.companyAddress || "",
        abn: profileData.abn || ""
      };
      
      console.log("Artist data prepared, fresh signature data being sent:", {
        hasSignature: !!signatureBase64,
        signatureType: signature?.signature_type,
        hasLogo: !!logoBase64
      });
      
      // Step 8: Create invoice settings with base64 data and fresh settings
      const invoiceSettings = {
        format: freshInvoiceSettings.format,
        paymentTerms: freshInvoiceSettings.paymentTerms,
        footerNotes: freshInvoiceSettings.footerNotes,
        addGST: freshInvoiceSettings.addGST,
        absorbPaymentFees: freshInvoiceSettings.absorbPaymentFees,
        signature: signatureBase64,
        signatureType: signature?.signature_type || null,
        receiveEmailCopy: receiveEmailCopies,
        logo: logoBase64,
      }

      console.log("[useInvoiceSender] Final invoice settings being sent:", {
        addGST: invoiceSettings.addGST,
        hasSignature: !!signatureBase64,
        signatureType: invoiceSettings.signatureType,
        hasLogo: !!logoBase64
      });
      
      // Step 9: Determine which invoice function to use based on pricing mode
      const functionName = getInvoiceFunctionName(job.pricing_mode);
      
      console.log(`[useInvoiceSender] Using ${functionName} for job with pricing_mode: ${job.pricing_mode || 'undefined'}`);
      
      // Step 10: Send invoice with retry logic for authentication failures
      const maxRetries = 2;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[useInvoiceSender] Invoice send attempt ${attempt}/${maxRetries} using ${functionName}`);
        
        try {
          // Ensure session is still valid before each attempt
          if (attempt > 1) {
            console.log(`[useInvoiceSender] Re-validating session before retry attempt ${attempt}`);
            const sessionValid = await ensureValidSession();
            if (!sessionValid) {
              throw new Error('Session validation failed on retry');
            }
          }
          
          // Use supabase.functions.invoke with the appropriate function name
          const payload: InvoiceRequestPayload = {
            job,
            artist,
            invoiceSettings,
            amount,
            gstAmount,
            bankDetails: bankDetails as unknown as Record<string, unknown>,
          };

          const { data, error } = await supabase.functions.invoke(functionName, {
            body: payload
          });
          
          if (error) {
            throw new Error(`Failed to send invoice: ${error.message}`);
          }
          
          if (!isInvoiceSendResponse(data)) {
            throw new Error('Invalid response received from invoice service');
          }

          const result = data;
          const resultMessage = result.error || result.message || 'Failed to send invoice';
          
          if (!result.success) {
            // Check if it's an authentication error that we can retry
            if (resultMessage.includes('Authentication failed') && attempt < maxRetries) {
              console.log(`[useInvoiceSender] Authentication failed on attempt ${attempt}, will retry...`);
              lastError = new Error(resultMessage);
              
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
            
            throw new Error(resultMessage);
          }
          
          // Success!
          console.log(`[useInvoiceSender] Invoice sent successfully on attempt ${attempt}`);
          toast({
            title: "Invoice sent",
            description: `Invoice #${result.invoiceNumber} sent to ${job.contact_email}`
          });
          
          return true;
          
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          console.error(`[useInvoiceSender] Error on attempt ${attempt}:`, error);
          lastError = error instanceof Error ? error : new Error(errorMessage);
          
          // If it's an authentication-related error and we have retries left, continue
          if (attempt < maxRetries && (
            errorMessage.includes('Authentication failed') ||
            errorMessage.includes('Session from session_id claim in JWT does not exist') ||
            errorMessage.includes('session_not_found')
          )) {
            console.log(`[useInvoiceSender] Authentication error on attempt ${attempt}, retrying...`);
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          // For non-auth errors or final attempt, break out of retry loop
          break;
        }
      }
      
      // If we get here, all retry attempts failed
      throw lastError || new Error('Invoice sending failed after all retry attempts');
      
    } catch (error: unknown) {
      console.error("[useInvoiceSender] Final error sending invoice:", error);
      
      // Provide more helpful error messages for common issues
      let errorMessage = getErrorMessage(error);
      if (errorMessage.includes('Authentication failed') || 
          errorMessage.includes('session_not_found') ||
          errorMessage.includes('Session from session_id claim in JWT does not exist')) {
        errorMessage = 'Your session has expired. Please refresh the page and try again.';
      }
      
      toast({
        title: "Error sending invoice",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };
  
  return {
    isSending,
    sendInvoice
  };
};
