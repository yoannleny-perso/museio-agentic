import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BankDetails } from '@/types';
import { useAuth } from '@/context/auth';

// Define the database schema for bank_details
interface BankDetailsRecord {
  id: string;
  user_id: string;
  account_holder_name: string;
  bsb_number: string;
  account_number: string;
  fund_name: string | null;
  member_number: string | null;
  fund_abn: string | null;
  fund_usi: string | null;
  include_super_in_invoices: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseBankDetails = () => {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch bank details for the authenticated user
  const fetchBankDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }
 
      // Use type assertion to handle the table not being in the Supabase types
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as { data: BankDetailsRecord | null, error: any };
      
      if (error) throw error;
      
      if (data) {
        // Transform data to match the BankDetails type
        const transformedData: BankDetails = {
          accountHolderName: data.account_holder_name,
          bsbNumber: data.bsb_number,
          accountNumber: data.account_number,
          fundName: data.fund_name || undefined,
          memberNumber: data.member_number || undefined,
          fundAbn: data.fund_abn || undefined,
          fundUsi: data.fund_usi || undefined,
          includeSuperInInvoices: data.include_super_in_invoices
        };
        
        setBankDetails(transformedData);
      } else {
        setBankDetails(null);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching bank details:', error);
      toast({
        title: 'Error fetching bank details',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Save or update bank details
  const saveBankDetails = async (formData: BankDetails) => {
    if (!user) {
      console.error('Cannot save bank details - no authenticated user');
      return false;
    }
    
    try {
      console.log('Saving bank details:', formData);
      
      // Prepare data for Supabase format
      const dataToSave = {
        user_id: user.id,
        account_holder_name: formData.accountHolderName,
        bsb_number: formData.bsbNumber,
        account_number: formData.accountNumber,
        fund_name: formData.fundName || null,
        member_number: formData.memberNumber || null,
        fund_abn: formData.fundAbn || null,
        fund_usi: formData.fundUsi || null,
        include_super_in_invoices: formData.includeSuperInInvoices ?? false
      };
      
      console.log('Data to save:', dataToSave);
      
      // Check if bank details already exist for this user
      // Use type assertion to handle the table not being in the Supabase types
      const { data: existingRecord } = await supabase
        .from('bank_details')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null, error: any };
      
      console.log('Existing record:', existingRecord);
      
      let result;
      
      if (existingRecord) {
        // Update existing record
        console.log('Updating existing record');
        result = await supabase
          .from('bank_details')
          .update(dataToSave)
          .eq('user_id', user.id) as { error: any };
      } else {
        // Insert new record
        console.log('Inserting new record');
        result = await supabase
          .from('bank_details')
          .insert(dataToSave) as { error: any };
      }
      
      console.log('Save result:', result);
      
      if (result.error) {
        console.error('Error from Supabase:', result.error);
        throw result.error;
      }
      
      // Update local state
      setBankDetails(formData);
      
      // Show success message
      toast({
        title: 'Bank details saved',
        description: 'Your bank details have been successfully saved.',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error saving bank details:', error);
      toast({
        title: 'Error saving bank details',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  // Fetch bank details on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchBankDetails();
    } else {
      setBankDetails(null);
      setLoading(false);
    }
  }, [user, fetchBankDetails]);

  return {
    bankDetails,
    loading,
    error,
    fetchBankDetails,
    saveBankDetails
  };
};
