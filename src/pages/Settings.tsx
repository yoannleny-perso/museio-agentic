import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import PasswordSettingsForm from '@/components/settings/PasswordSettingsForm';
import InvoiceSettingsForm from '@/components/settings/InvoiceSettingsForm';
import BankDetailsForm from '@/components/settings/BankDetailsForm';
import { NotificationSettingsSection } from '@/components/settings/NotificationSettingsSection';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useSearchParams } from 'react-router-dom';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Capacitor } from '@capacitor/core';
import { User, Receipt, CreditCard, Mail } from 'lucide-react';

const tabKeys = ["account", "invoice", "bank", "emails"];

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabKeys.includes(initialTab ?? "") ? initialTab! : "account");
  
  // Use loading state hook for settings operations
  const { isAnyLoading } = useLoadingState(['account', 'invoice', 'bank', 'notifications']);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className={`app-page-shell-narrow ${Capacitor.isNativePlatform() ? 'pt-14' : ''}`}>
      <div className="mb-6">
        <p className="text-sm text-gray-500 mt-1">
          Manage your account, invoice, and payment details
        </p>
      </div>

      {/* Add onboarding progress indicator */}
      <OnboardingProgress />

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="flex justify-between w-full mb-6 bg-transparent h-auto p-0">
          <TabsTrigger 
            value="account"
            className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="invoice"
            className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
          >
            <Receipt className="w-4 h-4" />
            <span>Invoice</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="bank"
            className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            <span>Banking</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="emails"
            className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>Emails</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 focus:outline-none">
          <ProfileSettingsForm />
          <PasswordSettingsForm />
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4 focus:outline-none">
          <InvoiceSettingsForm />
        </TabsContent>

        <TabsContent value="bank" className="space-y-4 focus:outline-none">
          <BankDetailsForm />
        </TabsContent>

        <TabsContent value="emails" className="space-y-4 focus:outline-none">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">Email Notification Settings</h2>
            <p className="text-sm text-gray-500 mb-6">
              Control which emails are sent to your clients and whether you receive copies of those communications.
            </p>
            <NotificationSettingsSection />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Loading overlay for settings operations */}
      <LoadingOverlay 
        isVisible={isAnyLoading()} 
        text="Saving settings..." 
      />
    </div>
  );
};

export default Settings;
