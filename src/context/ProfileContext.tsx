
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProfileData } from '@/types';
import { useSupabaseProfileDetails } from '@/hooks/useSupabaseProfileDetails';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

// Extended ProfileData to include notification_settings
interface ExtendedProfileData extends ProfileData {
  notification_settings?: {
    sendJobConfirmation: boolean;
  };
}

interface ProfileContextType {
  profileData: ExtendedProfileData | null;
  loading: boolean;
  error: string | null;
  saveProfile: (data: ProfileData) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  saveStatus: boolean;
  isSaving: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saveStatus, setSaveStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const {
    profileData,
    loading: profileLoading,
    error,
    fetchProfileDetails,
    saveProfileDetails
  } = useSupabaseProfileDetails();
  
  // Combined loading state
  const loading = authLoading || profileLoading;
  
  const saveProfile = async (formData: ProfileData) => {
    console.log('Saving profile data:', formData);
    setIsSaving(true);
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to save your profile.",
        variant: "destructive"
      });
      setIsSaving(false);
      return false;
    }
    
    try {
      // Save to Supabase with improved error handling
      const result = await saveProfileDetails(formData);
      
      if (result.success) {
        // Set saved status
        setSaveStatus(true);
        
        // Show success toast
        toast({
          title: "Profile updated",
          description: "Your profile information has been successfully saved.",
        });
        
        // Reset saved status after 3 seconds
        setTimeout(() => {
          setSaveStatus(false);
        }, 3000);

        return true;
      } else {
        toast({
          title: "Save failed",
          description: result.error || "There was an error saving your profile information.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error("Profile save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "An unexpected error occurred while saving your profile.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const refreshProfile = async () => {
    if (user) {
      console.log('Refreshing profile for user:', user.id);
      await fetchProfileDetails();
    } else {
      console.log('Cannot refresh profile: No authenticated user');
    }
  };
  
  // Make sure we have the latest profile data when user changes
  useEffect(() => {
    if (user && !authLoading) {
      console.log('Auth state confirmed, fetching profile data for user:', user.id);
      refreshProfile();
    }
  }, [user, authLoading]);
  
  return (
    <ProfileContext.Provider value={{
      profileData: profileData as ExtendedProfileData | null,
      loading,
      error,
      saveProfile,
      refreshProfile,
      saveStatus,
      isSaving
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
