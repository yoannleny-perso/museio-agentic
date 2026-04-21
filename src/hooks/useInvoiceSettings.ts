
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceSettings, DEFAULT_INVOICE_SETTINGS } from '@/types/invoiceSettings';
import { useAuth } from '@/context/auth';
import { useInvoiceLogo } from '@/hooks/useInvoiceLogo';

export const useInvoiceSettings = () => {
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadLogo, uploadBase64Logo } = useInvoiceLogo();
  
  // Define the structure of invoice_settings records in the database
  interface InvoiceSettingsRecord {
    id?: string;
    user_id: string;
    format: string;
    payment_terms: number;
    footer_notes: string;
    logo_path?: string;
    add_gst: boolean;
    auto_reminders_enabled: boolean;
    absorb_payment_fees: boolean;
  }
  
  // Fetch invoice settings from Supabase
  const fetchInvoiceSettings = useCallback(async (): Promise<InvoiceSettings> => {
    if (!user) {
      setLoading(false);
      return DEFAULT_INVOICE_SETTINGS;
    }
    
    try {
      setLoading(true);
      
      // Use type assertion to handle the table not being in the Supabase types
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as { data: InvoiceSettingsRecord | null, error: any };
      
      if (error) {
        console.error('Error fetching invoice settings:', error);
        toast({
          title: "Error loading settings",
          description: error.message,
          variant: "destructive"
        });
        
        // Initialize with default settings
        const defaultSettings = {
          ...DEFAULT_INVOICE_SETTINGS,
        };
        setInvoiceSettings(defaultSettings);
        return defaultSettings;
      }
      
      // Transform database record to InvoiceSettings type
      if (data) {
        const settings: InvoiceSettings = {
          format: data.format,
          paymentTerms: data.payment_terms,
          footerNotes: data.footer_notes,
          logo: data.logo_path,
          addGST: data.add_gst || false,
          autoRemindersEnabled: data.auto_reminders_enabled || false,
          absorbPaymentFees: data.absorb_payment_fees || false
        };
        setInvoiceSettings(settings);
        return settings;
      } else {
        // Initialize with defaults if no data
        const defaultSettings = {
          ...DEFAULT_INVOICE_SETTINGS,
        };
        setInvoiceSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error: any) {
      console.error('Unexpected error fetching invoice settings:', error);
      toast({
        title: "Error loading settings",
        description: error.message || "Failed to load invoice settings",
        variant: "destructive"
      });
      const defaultSettings = { ...DEFAULT_INVOICE_SETTINGS };
      setInvoiceSettings(defaultSettings);
      return defaultSettings;
    } finally {
      setLoading(false);
    }
  }, [toast, user]);
  
  // Refresh function that returns fresh settings directly
  const refreshInvoiceSettings = useCallback(async (): Promise<InvoiceSettings> => {
    const freshSettings = await fetchInvoiceSettings();
    return freshSettings;
  }, [fetchInvoiceSettings]);
  
  // Save invoice settings to Supabase
  const saveInvoiceSettings = async (settings: InvoiceSettings) => {
    if (!user) return false;
    
    try {
      
      const dataToSave: InvoiceSettingsRecord = {
        user_id: user.id,
        format: settings.format,
        payment_terms: settings.paymentTerms,
        footer_notes: settings.footerNotes,
        logo_path: settings.logo,
        add_gst: settings.addGST,
        auto_reminders_enabled: settings.autoRemindersEnabled,
        absorb_payment_fees: settings.absorbPaymentFees
      };
      
      // Check if settings already exist for this user
      // Use type assertion to handle the table not being in the Supabase types
      const { data: existingSettings } = await supabase
        .from('invoice_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null, error: any };
      
      let saveResult;
      if (existingSettings) {
        // Update existing settings
        saveResult = await supabase
          .from('invoice_settings')
          .update(dataToSave)
          .eq('user_id', user.id) as { error: any };
      } else {
        // Insert new settings
        saveResult = await supabase
          .from('invoice_settings')
          .insert(dataToSave) as { error: any };
      }
      
      if (saveResult.error) {
        throw saveResult.error;
      }
      
      // Update local state
      setInvoiceSettings(settings);
      
      return true;
    } catch (error: any) {
      console.error('Error saving invoice settings:', error);
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save invoice settings",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Load settings on component mount or when user changes
  useEffect(() => {
    void fetchInvoiceSettings();
  }, [fetchInvoiceSettings]);
  
  return {
    invoiceSettings,
    loading,
    fetchInvoiceSettings,
    refreshInvoiceSettings,
    saveInvoiceSettings,
    uploadLogo,
    uploadBase64Logo
  };
};
