
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useBankDetails } from '@/context/BankDetailsContext';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import Image from '@/components/ui/image';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useStripeProfile } from '@/hooks/useStripeProfile';

const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(1, { message: 'Account holder name is required' }),
  bsbNumber: z
    .string()
    .min(6, { message: 'BSB must be 6 digits' })
    .max(7, { message: 'BSB cannot exceed 7 characters' })
    .refine(
      (val) => /^\d{3}-?\d{3}$/.test(val), 
      { message: 'BSB must be in format XXX-XXX or XXXXXX' }
    ),
  accountNumber: z
    .string()
    .min(5, { message: 'Account number must have at least 5 digits' })
    .max(10, { message: 'Account number cannot exceed 10 digits' })
    .refine(
      (val) => /^\d+$/.test(val), 
      { message: 'Account number must contain only digits' }
    ),
  fundName: z.string().optional(),
  memberNumber: z.string().optional(),
  fundAbn: z.string().optional(),
  fundUsi: z.string().optional(),
  includeSuperInInvoices: z.boolean().optional(),
});

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

const BankDetailsForm = () => {
  const { bankDetails, loading, saveBankDetails, isSaving } = useBankDetails();
  const { invoiceSettings, saveInvoiceSettings } = useInvoiceSettings();
  const { toast } = useToast();
  const {
    stripeStatus,
    profileStripeData,
    stripeLoading,
    checkingStatus,
    refreshStripeState,
    checkStripeAccountStatus,
    connectStripe,
    resetStripeLoading,
  } = useStripeProfile();
  
  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountHolderName: '',
      bsbNumber: '',
      accountNumber: '',
      fundName: '',
      memberNumber: '',
      fundAbn: '',
      fundUsi: '',
      includeSuperInInvoices: false,
    },
  });

  // Check Stripe account status on load
  useEffect(() => {
    const initializeStripe = async () => {
      await refreshStripeState();
      
      // Check for return from Stripe onboarding
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('stripe_return') === 'true') {
        // CRITICAL FIX: Reset loading state when returning from Stripe
        resetStripeLoading();
        
        // Remove the Stripe parameter but keep other params like tab
        urlParams.delete('stripe_return');
        const cleanUrl = urlParams.toString() 
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Recheck status after return from Stripe
        setTimeout(() => {
          void checkStripeAccountStatus();
        }, 1000);
        toast({
          title: "Welcome back!",
          description: "Checking your account status...",
        });
      }
      if (urlParams.get('stripe_refresh') === 'true') {
        // ALSO FIX: Reset loading state on refresh
        resetStripeLoading();
        
        // Handle refresh case - redirect back to onboarding
        urlParams.delete('stripe_refresh');
        const cleanUrl = urlParams.toString() 
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        toast({
          title: "Session expired",
          description: "Please try connecting with Stripe again.",
          variant: "destructive",
        });
      }
    };

    void initializeStripe();
  }, [checkStripeAccountStatus, refreshStripeState, resetStripeLoading, toast]);

  // Safety timeout: reset loading after 30 seconds
  useEffect(() => {
    if (stripeLoading) {
      const timeout = setTimeout(() => {
        console.log('[BankDetailsForm] Stripe loading timeout, resetting state');
        resetStripeLoading();
        toast({
          title: "Connection timeout",
          description: "Please try again. If the issue persists, refresh the page.",
          variant: "destructive",
        });
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [resetStripeLoading, stripeLoading, toast]);

  // Populate form when bank details are loaded
  useEffect(() => {
    if (bankDetails) {
      form.reset({
        accountHolderName: bankDetails.accountHolderName,
        bsbNumber: bankDetails.bsbNumber,
        accountNumber: bankDetails.accountNumber,
        fundName: bankDetails.fundName || '',
        memberNumber: bankDetails.memberNumber || '',
        fundAbn: bankDetails.fundAbn || '',
        fundUsi: bankDetails.fundUsi || '',
        includeSuperInInvoices: bankDetails.includeSuperInInvoices ?? false,
      });
    }
  }, [bankDetails, form]);

  const onSubmit = async (data: BankDetailsFormValues) => {
    // Format BSB if needed (add dash if missing)
    if (data.bsbNumber && !data.bsbNumber.includes('-') && data.bsbNumber.length === 6) {
      data.bsbNumber = `${data.bsbNumber.substring(0, 3)}-${data.bsbNumber.substring(3)}`;
    }
    
    // Ensure all required properties are present (not optional) to match BankDetails type
    const bankDetailsData = {
      accountHolderName: data.accountHolderName,
      bsbNumber: data.bsbNumber,
      accountNumber: data.accountNumber,
      fundName: data.fundName,
      memberNumber: data.memberNumber,
      fundAbn: data.fundAbn,
      fundUsi: data.fundUsi,
      includeSuperInInvoices: data.includeSuperInInvoices,
    };
    
    await saveBankDetails(bankDetailsData);
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
        <span className="ml-2 text-gray-600">Loading bank details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pay Now Container */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Pay Now</h2>
          <Image 
            src="/stripe.png" 
            alt="Stripe logo" 
            className="h-6 w-auto opacity-80"
          />
        </div>
        
        {checkingStatus || (!profileStripeData.loaded && !stripeStatus.has_account) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#8B5CF6] mr-2" />
            <span className="text-sm text-gray-600">Loading Stripe information...</span>
          </div>
        ) : (profileStripeData.loaded && profileStripeData.isConnected) || stripeStatus.onboarding_completed ? (
          <div>
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-700">Stripe Connected</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your Stripe account is connected and ready to process payments. The 'Pay Now' button is enabled on your invoices.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${stripeStatus.charges_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={stripeStatus.charges_enabled ? 'text-green-700' : 'text-red-600'}>
                  Payments {stripeStatus.charges_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${stripeStatus.payouts_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={stripeStatus.payouts_enabled ? 'text-green-700' : 'text-red-600'}>
                  Payouts {stripeStatus.payouts_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        ) : (profileStripeData.loaded && profileStripeData.hasAccount && !profileStripeData.isConnected) || (stripeStatus.has_account && !stripeStatus.onboarding_completed) ? (
          <div>
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-yellow-700">Setup Incomplete</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your Stripe account needs additional information to process payments.
            </p>
            {stripeStatus.requirements && stripeStatus.requirements.currently_due.length > 0 && (
              <p className="text-xs text-red-600 mb-4">
                {stripeStatus.requirements.currently_due.length} requirement(s) due now
              </p>
            )}
            <PrimaryActionButton 
              width="full" 
              onClick={connectStripe}
              isLoading={stripeLoading}
              loadingText="Opening Stripe..."
            >
              Complete Setup
            </PrimaryActionButton>
          </div>
        ) : profileStripeData.loaded && profileStripeData.isConnected ? (
          <div>
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mr-3">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-green-700">Stripe Connected</span>
                <p className="text-xs text-gray-500">Account setup complete</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Your Stripe account is connected and ready to process payments. The 'Pay Now' button is enabled on your invoices.
            </p>
            <PrimaryActionButton 
              width="full" 
              disabled={true}
              className="bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100"
            >
              <Check className="mr-2 h-4 w-4" />
              Connected with Stripe
            </PrimaryActionButton>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-6">
              Connect your Stripe account to enable instant payments. With a quick authorization, a 'Pay Now' button will be added to your invoices, allowing clients to pay instantly
            </p>
            <PrimaryActionButton 
              width="full" 
              onClick={connectStripe}
              isLoading={stripeLoading}
              loadingText="Setting up Stripe..."
            >
              Connect with Stripe
            </PrimaryActionButton>
          </div>
        )}
      </div>

      {/* Absorb Fees Toggle - Only show if Stripe is connected */}
      {((profileStripeData.loaded && profileStripeData.isConnected) || stripeStatus.onboarding_completed) && (
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-medium">Absorb Fees</h3>
              <p className="text-sm text-muted-foreground">
                Payment fees are deducted from your revenue
              </p>
            </div>
            <Switch
              checked={invoiceSettings?.absorbPaymentFees || false}
              onCheckedChange={async (checked) => {
                if (!invoiceSettings) return;
                
                const success = await saveInvoiceSettings({
                  ...invoiceSettings,
                  absorbPaymentFees: checked
                });
                
                if (success) {
                  toast({
                    title: "Settings updated",
                    description: checked 
                      ? "You will now absorb payment fees" 
                      : "Customers will now pay payment fees"
                  });
                }
              }}
              disabled={!stripeStatus.onboarding_completed}
            />
          </div>
        </div>
      )}

      {/* Banking Information Container */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">Banking Information</h2>
        
        {checkingStatus && (
          <div className="flex items-center justify-center py-4 mb-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
            <Loader2 className="h-4 w-4 animate-spin text-[#8B5CF6] mr-2" />
            <span className="text-sm text-gray-600">Loading banking information...</span>
          </div>
        )}
      <p className="text-sm text-gray-500 mb-4">
        These details will appear on your invoices to help clients pay you directly.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="accountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Holder Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., John Smith" 
                    disabled={checkingStatus}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bsbNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BSB Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 123-456" 
                    disabled={checkingStatus}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Format: XXX-XXX or XXXXXX
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your account number" 
                    disabled={checkingStatus}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          
          {/* Super Details Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-6">
              <FormField
                control={form.control}
                name="includeSuperInInvoices"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Include Super fund details in my invoices</FormLabel>
                      <FormDescription>
                        When enabled, your super fund details will appear on invoices you send to clients.
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
            </div>
            
            <h3 className="text-base font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">
              Super Details (Optional)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your superannuation fund details for payroll purposes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fundName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Australian Super" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="memberNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your member number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fundAbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund ABN</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 94 006 457 987" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fundUsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund USI</FormLabel>
                    <FormControl>
                      <Input placeholder="Unique Superannuation Identifier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="pt-6">
            <PrimaryActionButton 
              type="submit" 
              width="full"
              isLoading={isSaving || checkingStatus}
              loadingText={checkingStatus ? "Loading..." : "Saving..."}
              disabled={checkingStatus}
            >
              Save Bank Details
            </PrimaryActionButton>
          </div>
        </form>
      </Form>
      </div>
    </div>
  );
};

export default BankDetailsForm;
