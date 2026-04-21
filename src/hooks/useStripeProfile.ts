import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import {
  STRIPE_FUNCTIONS,
  type StripeAccountStatusResponse,
  type StripeCreateAccountLinkRequest,
  type StripeOAuthConnectRequest,
} from '@/contracts';
import {
  fetchStripeAccountStatus,
  fetchStripeProfileSnapshot,
  getDefaultStripeProfileSnapshot,
  getDefaultStripeStatus,
  openStripeConnectFlow,
  openStripeDashboard,
  requestStripeLink,
  type StripeProfileSnapshot,
} from '@/utils/stripeConnect';

interface RefreshStripeOptions {
  showErrors?: boolean;
}

export const useStripeProfile = () => {
  const { toast } = useToast();
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatusResponse>(
    getDefaultStripeStatus()
  );
  const [profileStripeData, setProfileStripeData] =
    useState<StripeProfileSnapshot>(getDefaultStripeProfileSnapshot());
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  const loadProfileStripeData = useCallback(async () => {
    const snapshot = await fetchStripeProfileSnapshot();
    setProfileStripeData(snapshot);
    return snapshot;
  }, []);

  const checkStripeAccountStatus = useCallback(
    async (options: RefreshStripeOptions = {}) => {
      const { showErrors = true } = options;

      setCheckingStatus(true);

      try {
        const status = await fetchStripeAccountStatus();
        setStripeStatus(status);
        setProfileStripeData({
          hasAccount: status.has_account,
          isConnected: status.onboarding_completed,
          loaded: true,
        });
        return status;
      } catch (error) {
        console.error('Error checking Stripe status:', error);

        if (showErrors) {
          toast({
            title: 'Error',
            description: 'Failed to check Stripe account status',
            variant: 'destructive',
          });
        }

        return null;
      } finally {
        setCheckingStatus(false);
      }
    },
    [toast]
  );

  const refreshStripeState = useCallback(
    async (options: RefreshStripeOptions = {}) => {
      await loadProfileStripeData();
      return checkStripeAccountStatus(options);
    },
    [checkStripeAccountStatus, loadProfileStripeData]
  );

  const resetStripeLoading = useCallback(() => {
    setStripeLoading(false);
  }, []);

  const connectStripe = useCallback(async () => {
    setStripeLoading(true);

    try {
      if (stripeStatus.has_account && stripeStatus.account_id) {
        const requestBody: StripeCreateAccountLinkRequest = {
          account_id: stripeStatus.account_id,
        };

        const linkData = await requestStripeLink(
          STRIPE_FUNCTIONS.createAccountLink,
          requestBody
        );

        await openStripeConnectFlow(linkData.url!);
      } else {
        const requestBody: StripeOAuthConnectRequest = {
          platform: Capacitor.isNativePlatform() ? 'native' : 'web',
        };

        const oauthData = await requestStripeLink(
          STRIPE_FUNCTIONS.oauthConnect,
          requestBody
        );

        await openStripeConnectFlow(oauthData.url!);
      }

      if (Capacitor.isNativePlatform()) {
        toast({
          title: stripeStatus.has_account ? 'Opening Stripe' : 'Redirecting to Stripe',
          description:
            'Complete the setup in your browser, then return to the app',
        });
      }

      return true;
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to connect with Stripe',
        variant: 'destructive',
      });
      setStripeLoading(false);
      return false;
    }
  }, [stripeStatus, toast]);

  const openDashboard = useCallback(async () => {
    setStripeLoading(true);

    try {
      const dashboardData = await requestStripeLink(
        STRIPE_FUNCTIONS.dashboardLogin
      );

      await openStripeDashboard(dashboardData.url!);

      toast({
        title: 'Opening Stripe Dashboard',
        description: 'Your secure Stripe dashboard is opening.',
      });

      return true;
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to open Stripe dashboard',
        variant: 'destructive',
      });
      return false;
    } finally {
      setStripeLoading(false);
    }
  }, [toast]);

  return {
    stripeStatus,
    profileStripeData,
    checkingStatus,
    stripeLoading,
    loadProfileStripeData,
    checkStripeAccountStatus,
    refreshStripeState,
    connectStripe,
    openDashboard,
    resetStripeLoading,
  };
};
