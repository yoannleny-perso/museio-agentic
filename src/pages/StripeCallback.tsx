import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  STRIPE_FUNCTIONS,
  buildNativeAppUrl,
  buildSettingsRoute,
  buildUniversalUrl,
  isStripeOAuthCallbackResponse,
} from '@/contracts';

type Status = 'processing' | 'success' | 'error';

const UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isIOS = /iPhone|iPad|iPod/.test(UA);
const isAndroid = /Android/.test(UA);
const isMobile = isIOS || isAndroid;

const SUCCESS_SETTINGS_PATH = buildSettingsRoute({
  tab: 'bank',
  stripe_return: true,
});

const REFRESH_SETTINGS_PATH = buildSettingsRoute({
  tab: 'bank',
  stripe_refresh: true,
});

const ERROR_SETTINGS_PATH = buildSettingsRoute({ tab: 'bank' });

const SUCCESS_UNIVERSAL_URL = buildUniversalUrl(SUCCESS_SETTINGS_PATH);
const REFRESH_UNIVERSAL_URL = buildUniversalUrl(REFRESH_SETTINGS_PATH);
const ERROR_UNIVERSAL_URL = buildUniversalUrl(ERROR_SETTINGS_PATH);

const SUCCESS_NATIVE_URL = buildNativeAppUrl('settings', {
  tab: 'bank',
  stripe_return: true,
});

const REFRESH_NATIVE_URL = buildNativeAppUrl('settings', {
  tab: 'bank',
  stripe_refresh: true,
});

const ERROR_NATIVE_URL = buildNativeAppUrl('settings', { tab: 'bank' });

const StripeCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('Connecting your Stripe account...');
  const [showOpenAppButton, setShowOpenAppButton] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const processingRef = useRef(false);
  const processedRef = useRef(false);

  const stripeReturn = searchParams.get('stripe_return') === 'true';
  const stripeRefresh = searchParams.get('stripe_refresh') === 'true';

  const getReturnTarget = useCallback((ok: boolean) => {
    if (ok) {
      return {
        path: SUCCESS_SETTINGS_PATH,
        universalUrl: SUCCESS_UNIVERSAL_URL,
        nativeUrl: SUCCESS_NATIVE_URL,
      };
    }

    if (stripeRefresh) {
      return {
        path: REFRESH_SETTINGS_PATH,
        universalUrl: REFRESH_UNIVERSAL_URL,
        nativeUrl: REFRESH_NATIVE_URL,
      };
    }

    return {
      path: ERROR_SETTINGS_PATH,
      universalUrl: ERROR_UNIVERSAL_URL,
      nativeUrl: ERROR_NATIVE_URL,
    };
  }, [stripeRefresh]);

  useEffect(() => {
    if (!isNative && isMobile) {
      setShowOpenAppButton(true);
    }
  }, [isNative]);

  const openApp = useCallback((ok: boolean) => {
    const target = getReturnTarget(ok);

    if (isNative) {
      window.location.href = target.nativeUrl;
      return;
    }

    window.location.assign(target.universalUrl);
  }, [getReturnTarget, isNative]);

  const postResultRouting = useCallback(async (ok: boolean) => {
    const target = getReturnTarget(ok);

    if (isMobile && !isNative) {
      setShowOpenAppButton(true);
      return;
    }

    if (!isMobile) {
      setTimeout(() => navigate(target.path), 1200);
    }
  }, [getReturnTarget, isNative, navigate]);

  useEffect(() => {
    const handleCallback = async () => {
      if (processingRef.current || processedRef.current) {
        return;
      }

      processingRef.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const oauthError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      try {
        if (stripeReturn) {
          setStatus('success');
          setMessage('Stripe setup complete. Returning you to payment settings...');
          processedRef.current = true;
          await postResultRouting(true);
          return;
        }

        if (stripeRefresh) {
          setStatus('error');
          setMessage('Stripe setup was not completed. Return to payment settings to try again.');
          processedRef.current = true;
          await postResultRouting(false);
          return;
        }

        if (oauthError) {
          setStatus('error');
          setMessage(errorDescription || 'Failed to connect Stripe account');
          toast({
            title: 'Connection Failed',
            description: errorDescription || 'Failed to connect with Stripe',
            variant: 'destructive',
          });
          processedRef.current = true;
          await postResultRouting(false);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Invalid callback parameters');
          toast({
            title: 'Error',
            description: 'Invalid callback from Stripe',
            variant: 'destructive',
          });
          processedRef.current = true;
          await postResultRouting(false);
          return;
        }

        const { data, error: callbackError } = await supabase.functions.invoke(
          STRIPE_FUNCTIONS.oauthCallback,
          { body: { code, state } }
        );

        if (!isStripeOAuthCallbackResponse(data)) {
          throw new Error('Invalid Stripe callback response');
        }

        processedRef.current = true;

        if (data.already_connected) {
          setStatus('success');
          setMessage('Your Stripe account is already connected!');
          toast({
            title: 'Already Connected',
            description: 'Account was previously connected',
          });
          await postResultRouting(true);
          return;
        }

        if (callbackError || !data.success) {
          throw new Error(data.error || 'Failed to connect Stripe account');
        }

        setStatus('success');
        setMessage('Successfully connected to Stripe!');
        toast({
          title: 'Success',
          description: 'Your Stripe account has been connected',
        });
        await postResultRouting(true);
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : 'Failed to connect account'
        );
        toast({
          title: 'Error',
          description: 'Failed to complete Stripe connection',
          variant: 'destructive',
        });

        if (!processedRef.current) {
          processedRef.current = true;
          await postResultRouting(false);
        }
      } finally {
        processingRef.current = false;
      }
    };

    void handleCallback();
  }, [postResultRouting, searchParams, stripeRefresh, stripeReturn, toast]);

  const ok = status !== 'error';
  const manualOpenTarget = getReturnTarget(ok);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-8 shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-4">
          {(showOpenAppButton || isNative) && (
            <div className="w-full space-y-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 font-medium">
                {status === 'success'
                  ? 'Connection successful! Return to the Museio app to continue.'
                  : 'Return to the Museio app'}
              </p>

              {isNative ? (
                <button
                  onClick={() => openApp(ok)}
                  className="w-full bg-purple-museio hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Open Museio App
                </button>
              ) : (
                <a
                  href={manualOpenTarget.universalUrl}
                  onClick={() => openApp(ok)}
                  className="block w-full text-center bg-purple-museio hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Open Museio App
                </a>
              )}

              {!isNative && (
                <p className="text-xs text-gray-500">
                  Or tap the native “Open” banner at the top of this page
                </p>
              )}
            </div>
          )}

          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Connecting to Stripe
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                {isNative ? 'Processing your connection...' : 'Please wait...'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connection Successful!
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                {isNative
                  ? 'Tap "Open Museio App" above to continue'
                  : 'Taking you back to settings...'}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connection Failed
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                {isNative ? 'Return to the app' : 'Taking you back to settings...'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeCallback;
