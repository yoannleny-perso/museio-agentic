
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProfileData } from '@/types';
import { useAuth } from '@/context/auth';

// Define the shape of profile data from the database
interface ProfileRecord {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  company_name: string | null;
  company_address: string | null;
  abn: string | null;
  created_at: string;
  updated_at: string;
}

export const useSupabaseProfileDetails = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch profile details for the authenticated user
  const fetchProfileDetails = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() as { data: ProfileRecord | null, error: any };
      
      if (error) throw error;

      if (data) {
        const transformedData: ProfileData = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          nickname: data.nickname || '',
          username: data.username || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          industry: data.industry || '',
          companyName: data.company_name || '',
          companyAddress: data.company_address || '',
          abn: data.abn || ''
        };
        
        
        if (!transformedData.email && user.email) {
          transformedData.email = user.email;
        }

        setProfileData(transformedData);
      } else {
        const defaultProfile: ProfileData = {
          firstName: user.user_metadata?.name?.split(' ')[0] || '',
          lastName: user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
          nickname: user.user_metadata?.nickname || '',
          username: user.user_metadata?.username || '',
          email: user.email || '',
          phone: user.user_metadata?.phone_number || '',
          industry: user.user_metadata?.industry || '',
          companyName: user.user_metadata?.company_name || '',
          companyAddress: user.user_metadata?.company_address || '',
          abn: user.user_metadata?.abn || ''
        };
        
        const hasRequiredFields = !!defaultProfile.firstName && !!defaultProfile.email;
        if (!hasRequiredFields) {
          toast({
            title: 'Profile Incomplete',
            description: 'Please complete your profile settings to enable email notifications.',
            variant: 'destructive'
          });
        }
        
        setProfileData(defaultProfile);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error fetching profile details';
      setError(errorMessage);
      toast({
        title: 'Error fetching profile details',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Save or update profile details
  const saveProfileDetails = async (formData: ProfileData): Promise<{ success: boolean, error?: string }> => {
    if (!user || !user.id) {
      return { success: false, error: 'You must be logged in to save profile details' };
    }
    
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle() as { data: { id: string } | null, error: any };

      const dataToSave = {
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        nickname: formData.nickname || null,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        industry: formData.industry,
        company_name: formData.companyName || null,
        company_address: formData.companyAddress || null,
        abn: formData.abn || null
      };

      let result;
      
      if (existingProfile) {
        result = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', user.id) as { error: any };
      } else {
        result = await supabase
          .from('profiles')
          .insert(dataToSave) as { error: any };
      }
      
      const { error } = result;

      if (error) {
        throw error;
      }

      setProfileData(formData);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Error saving profile details';
      return { success: false, error: errorMessage };
    }
  };

  return {
    profileData,
    loading,
    error,
    fetchProfileDetails,
    saveProfileDetails
  };
};
