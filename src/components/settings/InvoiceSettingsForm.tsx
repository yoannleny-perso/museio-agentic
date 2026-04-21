import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { InvoiceSettings } from '@/types/invoiceSettings';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Info } from 'lucide-react';
import LogoUploader from '@/components/settings/LogoUploader';
import InvoicePreviewButton from '@/components/settings/InvoicePreviewButton';
import InvoicePreviewDialog from '@/components/settings/InvoicePreviewDialog';
import { useProfile } from '@/context/ProfileContext';
import { useSignature } from '@/context/SignatureContext';
import SignatureField from './signature/SignatureField';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { useToast } from '@/hooks/use-toast';
import { useBankDetails } from '@/context/BankDetailsContext';

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  username: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  industry: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  abn: z.string().optional(),
});

const invoiceFormSchema = z.object({
  format: z.string().min(1, { message: 'Invoice format is required' }),
  paymentTerms: z.preprocess(
    (val) => {
      // allow empty UI state while typing
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    },
    z
      .number({ required_error: 'Payment terms is required' })
      .int('Payment terms must be a whole number')
      .min(0, { message: 'Payment terms must be 0 or more days' })
      .max(365, { message: 'Payment terms cannot exceed 365 days' })
  ),
  footerNotes: z.string().optional(),
  logo: z.string().optional(),
  addGST: z.boolean().default(false),
  autoRemindersEnabled: z.boolean().default(false),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const InvoiceSettingsForm = () => {
  const { invoiceSettings, saveInvoiceSettings, loading, uploadLogo, refreshInvoiceSettings } = useInvoiceSettings();
  const { profileData, loading: loadingProfile } = useProfile();
  const { signature, loading: loadingSignature, saveSignature, removeSignature, fetchSignature } = useSignature();
  const { toast } = useToast();
  
  const { bankDetails } = useBankDetails();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      format: 'INV-{YYYY}{MM}{DD}{NUM}',
      paymentTerms: 14,
      footerNotes: 'Thank you for choosing to do business with us',
      logo: '',
      addGST: false,
      autoRemindersEnabled: false,
    },
  });

  const form2 = useForm<ProfileFormValues>({
      resolver: zodResolver(profileFormSchema),
      defaultValues: {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        industry: '',
        companyName: '',
        companyAddress: '',
        abn: '',
      },
    });
  
    // Populate form when profile data is loaded
    React.useEffect(() => {
      if (profileData) {
        form2.reset({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          username: profileData.username || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          industry: profileData.industry || '',
          companyName: profileData.companyName || '',
          companyAddress: profileData.companyAddress || '',
          abn: profileData.abn || '',
        });
      }
    }, [profileData, form2]);

  // Populate form when invoice settings are loaded
  React.useEffect(() => {
    if (invoiceSettings) {
      console.log('[InvoiceSettingsForm] Updating form with settings:', invoiceSettings);
      form.reset({
        format: invoiceSettings.format,
        paymentTerms: invoiceSettings.paymentTerms,
        footerNotes: invoiceSettings.footerNotes || '',
        logo: invoiceSettings.logo || '',
        addGST: invoiceSettings.addGST,
        autoRemindersEnabled: invoiceSettings.autoRemindersEnabled,
      });
    }
  }, [invoiceSettings, form]);

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      setIsSaving(true);
      console.log('[InvoiceSettingsForm] Saving form data:', data);
      
      // Ensure all required properties are present (not optional) to match InvoiceSettings type
      const invoiceData: InvoiceSettings = {
        // Always use the standardized format, regardless of what might be in the form
        format: 'INV-{YYYY}{MM}{DD}{NUM}',
        paymentTerms: data.paymentTerms,
        footerNotes: data.footerNotes || '',
        logo: data.logo || '',
        addGST: data.addGST,
        autoRemindersEnabled: data.autoRemindersEnabled,
        absorbPaymentFees: invoiceSettings?.absorbPaymentFees || false
      };
      
      console.log('[InvoiceSettingsForm] Saving GST setting:', data.addGST);
      
      const success = await saveInvoiceSettings(invoiceData);
      
      if (success) {
        toast({
          title: "Settings saved",
          description: "Your invoice settings have been updated successfully.",
        });
        
        // Trigger a refresh to ensure all components get the latest settings
        console.log('[InvoiceSettingsForm] Triggering global settings refresh after save...');
        const freshSettings = await refreshInvoiceSettings();
        console.log('[InvoiceSettingsForm] Global refresh completed, fresh GST setting:', freshSettings.addGST);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      console.log('[InvoiceSettingsForm] Starting logo upload process');
      
      const logoUrl = await uploadLogo(file);
      if (logoUrl) {
        console.log('[InvoiceSettingsForm] Logo uploaded successfully:', logoUrl);
        form.setValue('logo', logoUrl);
        
        // Force a form re-render to ensure the LogoUploader gets the new value
        form.trigger('logo');
      } else {
        console.error('[InvoiceSettingsForm] Logo upload failed - no URL returned');
        toast({
          title: "Upload failed",
          description: "Failed to upload logo. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[InvoiceSettingsForm] Logo upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle logo removal
  const handleLogoRemove = () => {
    console.log("[InvoiceSettingsForm] Removing logo");
    form.setValue('logo', '');
    
    // Force a form re-render to ensure the LogoUploader gets the updated value
    form.trigger('logo');
  };
  
  const handlePreviewClick = async () => {
    console.log('Opening preview dialog, ensuring we have latest signature data');
    // Refresh signature data before opening preview to ensure we have the latest
    await fetchSignature();
    setIsPreviewOpen(true);
  };

  const handleSaveSignature = async (signatureData: string, type: 'drawn' | 'typed') => {
    try {
      console.log('Saving signature in InvoiceSettingsForm');
      const success = await saveSignature(signatureData, type);
      if (success) {
        // Force refresh the signature data to get the latest displayUrl
        console.log('Signature saved successfully, refreshing signature data');
        await fetchSignature();
      }
      return success;
    } catch (error) {
      console.error('Error saving signature:', error);
      return false;
    }
  };

  if (loading || loadingProfile || loadingSignature) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
        <span className="ml-2 text-gray-600">Loading invoice settings...</span>
      </div>
    );
  }
  
  // Get current form values for preview
  const currentSettings = form.getValues();

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
      <h2 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">Invoice Preferences</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* 1. Invoice Logo - Moved to top */}
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Logo</FormLabel>
                  <FormControl>
                    <LogoUploader 
                      currentLogo={field.value || ''} 
                      onLogoChange={handleLogoChange}
                      isUploading={isUploading}
                      onLogoSelected={(url) => {
                        console.log('[InvoiceSettingsForm] Logo selected callback:', url);
                        field.onChange(url);
                      }}
                      onLogoRemove={handleLogoRemove}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload your business logo to appear on invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 2. Payment Terms - Moved to second */}
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms (Days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ''} // blank UI allowed
                    // (optional) prevent negative typing if you want:
                    onKeyDown={(e) => {
                      if (e.key === '-' ) e.preventDefault();
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Number of days clients have to pay after receiving the invoice
                </FormDescription>
                <FormMessage />
              </FormItem>
              )}
              />

            {/* Auto Payment Reminders Toggle */}
            <FormField
              control={form.control}
              name="autoRemindersEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-purple-200 p-4 bg-purple-50/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto Payment Reminders</FormLabel>
                    <FormDescription>
                      Automatically send email reminders for overdue invoices
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* 3. Footer Notes - Moved to third */}
            <FormField
              control={form.control}
              name="footerNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Thank you for choosing to do business with us"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Notes to appear at the bottom of your invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 4. Invoice Number Format - Moved to last */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Invoice Number Format</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="cursor-pointer">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs">
                        This format is standardized across all accounts and cannot be changed to ensure consistent invoice numbering.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        value="INV-{YYYY}{MM}{DD}{NUM}" 
                        disabled
                        className="bg-gray-100 text-gray-600"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Standard format using {'{YYYY}'} for year, {'{MM}'} for month, {'{DD}'} for day, and {'{NUM}'} for sequential numbering
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            
            {/* Add signature field */}
            <div className="pt-4">
              <h3 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">Invoice Signature</h3>
              <div className="rounded-md border border-gray-200 p-4">
                <SignatureField
                  signature={signature?.signature || null}
                  signatureType={signature?.signature_type || null}
                  displayUrl={signature?.displayUrl}
                  onSave={handleSaveSignature}
                  onRemove={removeSignature}
                />
                <p className="text-sm text-gray-500 mt-4">
                  Your signature will appear at the bottom of your invoices
                </p>
              </div>
            </div>
            
            {/* Tax Configuration Section with enhanced GST toggle */}
            <div className="pt-4">
              <h3 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">Tax Configuration</h3>
              <FormField
                control={form.control}
                name="addGST"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Add GST to Invoices</FormLabel>
                      <FormDescription>
                        Automatically calculate and add 10% GST to your invoice amounts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          console.log('[InvoiceSettingsForm] GST toggle changed to:', checked);
                          field.onChange(checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Preview Invoice button comes before the Save button */}
          <InvoicePreviewButton 
            onClick={handlePreviewClick}
          />
          
          {/* Save button comes after the Preview button */}
          <PrimaryActionButton 
            type="submit" 
            width="full"
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Invoice Settings
          </PrimaryActionButton>
        </form>
      </Form>
      
      <InvoicePreviewDialog 
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        invoiceSettings={{
          format: 'INV-{YYYY}{MM}{DD}{NUM}',
          paymentTerms: currentSettings.paymentTerms,
          footerNotes: currentSettings.footerNotes || '',
          logo: currentSettings.logo,
          addGST: currentSettings.addGST,
          autoRemindersEnabled: currentSettings.autoRemindersEnabled || false,
          absorbPaymentFees: invoiceSettings?.absorbPaymentFees || false
        }}
        profileData={profileData}
        bankDetails={bankDetails}
        signature={signature?.displayUrl || signature?.signature}
        signatureType={signature?.signature_type}
      />
    </div>
  );
};

export default InvoiceSettingsForm;
