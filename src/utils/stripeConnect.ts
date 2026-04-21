import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import {
  STRIPE_FUNCTIONS,
  isStripeAccountStatusResponse,
  isStripeLinkResponse,
  type StripeAccountStatusResponse,
  type StripeLinkFunctionName,
  type StripeLinkResponse,
} from '@/contracts';

export interface StripeProfileSnapshot {
  hasAccount: boolean;
  isConnected: boolean;
  loaded: boolean;
}

export const getDefaultStripeStatus = (): StripeAccountStatusResponse => ({
  has_account: false,
  onboarding_completed: false,
});

export const getDefaultStripeProfileSnapshot = (): StripeProfileSnapshot => ({
  hasAccount: false,
  isConnected: false,
  loaded: false,
});

export const getStripeFunctionHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
};

export const fetchStripeProfileSnapshot =
  async (): Promise<StripeProfileSnapshot> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return getDefaultStripeProfileSnapshot();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        throw error ?? new Error('Stripe profile not found');
      }

      return {
        hasAccount: !!data.stripe_account_id,
        isConnected: data.stripe_onboarding_completed === true,
        loaded: true,
      };
    } catch (error) {
      console.log('Could not load profile Stripe data:', error);
      return getDefaultStripeProfileSnapshot();
    }
  };

export const fetchStripeAccountStatus =
  async (): Promise<StripeAccountStatusResponse> => {
    const { data, error } = await supabase.functions.invoke(
      STRIPE_FUNCTIONS.accountStatus,
      {
        headers: await getStripeFunctionHeaders(),
      }
    );

    if (error) {
      throw error;
    }

    if (!isStripeAccountStatusResponse(data)) {
      throw new Error('Invalid Stripe account status response');
    }

    return data;
  };

export const requestStripeLink = async (
  functionName: StripeLinkFunctionName,
  body?: unknown
): Promise<StripeLinkResponse> => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    headers: await getStripeFunctionHeaders(),
    body,
  });

  if (error) {
    throw error;
  }

  if (!isStripeLinkResponse(data)) {
    throw new Error('Invalid Stripe link response');
  }

  if (!data.success || !data.url) {
    throw new Error(data.error || 'Failed to create Stripe link');
  }

  return data;
};

export const openStripeConnectFlow = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({
      url,
      windowName: '_system',
    });
    return;
  }

  window.location.href = url;
};

export const openStripeDashboard = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({
      url,
      windowName: '_system',
    });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};
