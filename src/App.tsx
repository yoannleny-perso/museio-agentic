
import { App as CapacitorApp } from '@capacitor/app';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AuthProvider } from '@/context/auth';
import { AppProvider } from '@/context/AppContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { BankDetailsProvider } from '@/context/BankDetailsContext';
import { SignatureProvider } from '@/context/SignatureContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { JobsProvider } from '@/context/JobsContext';
import { SocialMediaLinksProvider } from '@/contexts/SocialMediaLinksContext';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConditionalLanding from '@/components/ConditionalLanding';
import Layout from '@/components/Layout';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { Suspense, lazy, useEffect, useState } from 'react';
import { OnboardingManager } from './components/onboarding/OnboardingManager';
import { CapacitorAppStateManager } from './components/CapacitorAppStateManager';
import useDeepLinks from '@/hooks/useDeepLinks';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { APP_ROUTE_BASE, APP_ROUTE_PATHS, APP_ROUTE_SEGMENTS, ROUTE_PATHS } from '@/contracts';
import { captureException } from '@/lib/monitoring';

//import './App.css';

const Auth = lazy(() => import('@/pages/Auth'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const StripeCallback = lazy(() => import('@/pages/StripeCallback'));
const Home = lazy(() => import('@/pages/Home'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const NewJob = lazy(() => import('@/pages/NewJob'));
const Settings = lazy(() => import('@/pages/Settings'));
const Finance = lazy(() => import('@/pages/Finance'));
const Clients = lazy(() => import('@/pages/Clients'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const PortfolioLivePage = lazy(() => import('@/pages/PortfolioLivePage'));
const More = lazy(() => import('@/pages/More'));
const TermsAndPrivacy = lazy(() => import('@/pages/TermsAndPrivacy'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Availability = lazy(() => import('@/pages/Availability'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const BookingResponse = lazy(() => import('@/pages/BookingResponse'));

const serializeKey = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable-key]';
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError(error, query) {
      captureException(error, {
        tags: {
          surface: 'react-query',
          operation: 'query',
        },
        contexts: {
          query: {
            queryHash: query.queryHash,
            queryKey: serializeKey(query.queryKey),
            stateStatus: query.state.status,
            fetchStatus: query.state.fetchStatus,
            meta: query.meta,
          },
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError(error, variables, _context, mutation) {
      captureException(error, {
        tags: {
          surface: 'react-query',
          operation: 'mutation',
        },
        contexts: {
          mutation: {
            mutationKey: serializeKey(mutation.options.mutationKey),
            meta: mutation.meta,
            stateStatus: mutation.state.status,
            variables,
          },
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const isIOS = Capacitor.getPlatform() === 'ios';
    const mode = isIOS ? KeyboardResize.Native : KeyboardResize.Body;

    // Use the ENUM values, not strings like "Body"/"Native"
    Keyboard.setResizeMode({ mode }).catch(() => {});
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
  }, []);
  
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);

  // Initialize deep link handling
  useDeepLinks();

  const handleJobFormOpenChange = (open: boolean) => {
    setIsJobFormOpen(open);
  };

  const handleAddJob = () => {
    setIsJobFormOpen(true);
  };

  // call CapacitorAppStateManager to handle app state changes
  //CapacitorAppStateManager();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme="light"
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <BankDetailsProvider>
              <SignatureProvider>
                <OnboardingProvider>
                  <AppProvider>
                    <SocialMediaLinksProvider>
                    <CapacitorAppStateManager />
                    <AppErrorBoundary>
                      <Suspense fallback={<div className="min-h-screen bg-background" />}>
                        <Routes>
                          <Route path={ROUTE_PATHS.root} element={<ConditionalLanding />} />
                          <Route path={ROUTE_PATHS.auth} element={<Auth />} />
                          <Route path={ROUTE_PATHS.authCallback} element={<AuthCallback />} />
                          <Route path={ROUTE_PATHS.stripeCallback} element={<StripeCallback />} />
                          <Route path={ROUTE_PATHS.termsAndPrivacy} element={<TermsAndPrivacy />} />
                          <Route path={ROUTE_PATHS.bookingPattern} element={<BookingPage />} />
                          <Route path={ROUTE_PATHS.bookingResponse} element={<BookingResponse />} />
                          <Route path={APP_ROUTE_BASE} element={
                              <ProtectedRoute>
                                <JobsProvider>
                                  <Layout onAddJob={handleAddJob}/>
                                  <OnboardingManager />
                                </JobsProvider>
                              </ProtectedRoute>
                            }>
                            <Route index element={<Navigate to={APP_ROUTE_PATHS.home} replace />} />
                            <Route path={APP_ROUTE_SEGMENTS.home} element={
                              <Home
                                isJobFormOpen={isJobFormOpen}
                                onJobFormOpenChange={handleJobFormOpenChange}
                              />
                            } />
                            <Route path={APP_ROUTE_SEGMENTS.jobs} element={<Jobs />} />
                            <Route path={APP_ROUTE_SEGMENTS.jobsNew} element={<NewJob />} />
                            <Route path={APP_ROUTE_SEGMENTS.portfolio} element={<Portfolio />} />
                            <Route path={APP_ROUTE_SEGMENTS.clients} element={<Clients />} />
                            <Route path={APP_ROUTE_SEGMENTS.availability} element={<Availability />} />
                            <Route path={APP_ROUTE_SEGMENTS.more} element={<More />} />
                            <Route path={APP_ROUTE_SEGMENTS.settings} element={<Settings />} />
                            <Route path={APP_ROUTE_SEGMENTS.finance} element={<Finance />} />
                          </Route>
                          {/* Portfolio live route */}
                          <Route path={ROUTE_PATHS.portfolioPattern} element={<PortfolioLivePage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </AppErrorBoundary>
                      <Toaster />
                    </SocialMediaLinksProvider>
                  </AppProvider>
                </OnboardingProvider>
              </SignatureProvider>
            </BankDetailsProvider>
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
