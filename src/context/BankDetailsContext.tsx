
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BankDetails } from '@/types';
import { useSupabaseBankDetails } from '@/hooks/useSupabaseBankDetails';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

interface BankDetailsContextType {
  bankDetails: BankDetails | null;
  loading: boolean;
  error: string | null;
  saveBankDetails: (data: BankDetails) => Promise<boolean>;
  refreshBankDetails: () => Promise<void>;
  isSaving: boolean;
}

const BankDetailsContext = createContext<BankDetailsContextType | undefined>(undefined);

export const BankDetailsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const {
    bankDetails,
    loading: bankLoading,
    error,
    fetchBankDetails,
    saveBankDetails: saveToSupabase
  } = useSupabaseBankDetails();
  
  // Combined loading state
  const loading = authLoading || bankLoading;
  
  const saveBankDetails = async (formData: BankDetails) => {
    console.log('[BankDetailsContext] Saving bank details:', formData);
    setIsSaving(true);
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to save your bank details.",
        variant: "destructive"
      });
      setIsSaving(false);
      return false;
    }
    
    try {
      // Save to Supabase
      const result = await saveToSupabase(formData);
      
      if (result) {
        // Show success toast
        toast({
          title: "Bank details saved",
          description: "Your bank details have been successfully saved.",
        });
        
        // Refresh data to ensure all components have the latest state
        await refreshBankDetails();
        
        return true;
      } else {
        toast({
          title: "Save failed",
          description: "There was an error saving your bank details.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error("[BankDetailsContext] Bank details save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "An unexpected error occurred while saving your bank details.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const refreshBankDetails = async () => {
    if (user) {
      console.log('[BankDetailsContext] Refreshing bank details for user:', user.id);
      await fetchBankDetails();
    } else {
      console.log('[BankDetailsContext] Cannot refresh bank details: No authenticated user');
    }
  };
  
  // Make sure we have the latest bank details when user changes
  useEffect(() => {
    if (user && !authLoading) {
      console.log('[BankDetailsContext] Auth state confirmed, fetching bank details for user:', user.id);
      refreshBankDetails();
    }
  }, [user, authLoading]);
  
  return (
    <BankDetailsContext.Provider value={{
      bankDetails,
      loading,
      error,
      saveBankDetails,
      refreshBankDetails,
      isSaving
    }}>
      {children}
    </BankDetailsContext.Provider>
  );
};

export const useBankDetails = () => {
  const context = useContext(BankDetailsContext);
  if (context === undefined) {
    throw new Error('useBankDetails must be used within a BankDetailsProvider');
  }
  return context;
};
