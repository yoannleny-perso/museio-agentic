
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useProfile } from '@/context/ProfileContext';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useSignature } from '@/context/SignatureContext';
import { useBankDetails } from '@/context/BankDetailsContext';

interface OnboardingState {
  id?: string;
  user_id: string;
  has_seen_welcome_popup: boolean;
  onboarding_completed: boolean;
  profile_completed: boolean;
  invoice_setup_completed: boolean;
  bank_details_completed: boolean;
  welcome_shown_at?: string | null;
  completed_at?: string | null;
}

interface SetupCompletion {
  profile: boolean;
  invoice: boolean;
  bank: boolean;
}

interface OnboardingContextType {
  onboardingState: OnboardingState | null;
  loading: boolean;
  setupCompletion: SetupCompletion;
  markWelcomeSeen: () => Promise<void>;
  updateOnboardingState: (updates: Partial<OnboardingState>) => Promise<void>;
  shouldShowWelcome: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);
const WELCOME_POPUP_RELEASE_AT = Date.parse('2026-04-15T00:00:00.000Z');

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { profileData } = useProfile();
  const { bankDetails } = useBankDetails();
  const { invoiceSettings } = useInvoiceSettings();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const { signature, loading: loadingSignature } = useSignature();

  const shouldReshowWelcomePopup = (state: OnboardingState | null) => {
    if (!state) {
      return false;
    }

    if (!state.has_seen_welcome_popup) {
      return true;
    }

    if (!state.welcome_shown_at) {
      return true;
    }

    const shownAt = Date.parse(state.welcome_shown_at);
    return Number.isNaN(shownAt) || shownAt < WELCOME_POPUP_RELEASE_AT;
  };

  const checkSetupCompletion = (): SetupCompletion => {
    const profileComplete = !!(
      profileData?.firstName && 
      profileData?.lastName && 
      profileData?.email
    );

    const invoiceComplete = !!(
      (signature?.displayUrl || signature?.signature) &&
      invoiceSettings?.format &&
      Number(invoiceSettings?.paymentTerms ?? 0) > 0 &&
      typeof invoiceSettings?.footerNotes === 'string'
    );

    const bankComplete = !!(
      bankDetails?.accountHolderName && 
      bankDetails?.bsbNumber && 
      bankDetails?.accountNumber
    );

    return {
      profile: profileComplete,
      invoice: invoiceComplete,
      bank: bankComplete
    };
  };

  // Fetch onboarding state from database
  const fetchOnboardingState = async () => {
    if (!user) {
      setOnboardingState(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        return;
      }

      if (!data) {
        // Create initial onboarding record if it doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('user_onboarding')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (insertError) {
          return;
        }

        setOnboardingState(newData);
      } else {
        setOnboardingState(data);
      }
    } catch (_error) {
      // Keep onboarding non-blocking if the record cannot be read.
    } finally {
      setLoading(false);
    }
  };

  // Update onboarding state
  const updateOnboardingState = async (updates: Partial<OnboardingState>) => {
    if (!user) return;

    try {
      const query = onboardingState
        ? supabase
            .from('user_onboarding')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single()
        : supabase
            .from('user_onboarding')
            .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
            .select()
            .single();

      const { data, error } = await query;

      if (error) {
        return;
      }

      setOnboardingState(data);
    } catch (_error) {
      // Preserve the current local state if the remote update fails.
    }
  };

  // Mark welcome popup as seen
  const markWelcomeSeen = async () => {
    await updateOnboardingState({
      has_seen_welcome_popup: true,
      welcome_shown_at: new Date().toISOString()
    });
  };

  // Update setup completion status with improved logic
  const updateSetupCompletion = async () => {
    if (!onboardingState) return;

    const completion = checkSetupCompletion();
    const allComplete = completion.profile && completion.invoice && completion.bank;

    // Only update if there are actual changes
    const hasChanges = 
      onboardingState.profile_completed !== completion.profile ||
      onboardingState.invoice_setup_completed !== completion.invoice ||
      onboardingState.bank_details_completed !== completion.bank ||
      onboardingState.onboarding_completed !== allComplete;

    if (hasChanges) {
      await updateOnboardingState({
        profile_completed: completion.profile,
        invoice_setup_completed: completion.invoice,
        bank_details_completed: completion.bank,
        onboarding_completed: allComplete,
        completed_at: allComplete ? new Date().toISOString() : null
      });
    }
  };

  useEffect(() => {
    fetchOnboardingState();
  }, [user]);

  // Update completion status when any of the dependencies change
  useEffect(() => {
    if (onboardingState) {
      updateSetupCompletion();
    }
  }, [
    profileData,
    bankDetails,
    invoiceSettings,
    signature,
    loadingSignature,
    onboardingState?.id,
  ]);

  const setupCompletion = checkSetupCompletion();

  // Show the welcome popup on the user's first authenticated app entry
  // until they explicitly dismiss it permanently.
  const shouldShowWelcome = shouldReshowWelcomePopup(onboardingState);

  const value: OnboardingContextType = {
    onboardingState,
    loading,
    setupCompletion,
    markWelcomeSeen,
    updateOnboardingState,
    shouldShowWelcome
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
