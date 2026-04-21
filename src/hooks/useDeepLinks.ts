import { useEffect, useRef } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { buildNativeUrl, buildUniversalUrl, resolveSupportedDeepLinkPath } from '@/contracts';

const useDeepLinks = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const processedUrls = useRef<Set<string>>(new Set());

  // Update navigate ref on each render
  navigateRef.current = navigate;

  // Prevent duplicate URL processing
  const canProcessUrl = (url: string): boolean => {
    if (processedUrls.current.has(url)) {
      console.log('[Deep Link] Skipping duplicate URL:', url);
      return false;
    }
    // Mark as processed and clear after 2 seconds
    processedUrls.current.add(url);
    setTimeout(() => processedUrls.current.delete(url), 2000);
    return true;
  };

  useEffect(() => {
    // Only register listener on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = (event: Pick<URLOpenListenerEvent, 'url'>) => {
      console.log('Deep link received:', event.url);
      
      // Prevent duplicate processing
      if (!canProcessUrl(event.url)) {
        return;
      }
      
      try {
        const url = new URL(event.url);

        const targetPath = resolveSupportedDeepLinkPath(url);
        if (!targetPath) {
          console.warn('[Deep Link] Unsupported URL:', event.url);
          return;
        }

        console.log('[Deep Link] Navigating to:', targetPath);
        setTimeout(() => navigateRef.current(targetPath), 300);
      } catch (error) {
        console.error('Error parsing deep link URL:', error);
      }
    };

    // Register the listener
    const removeListener = App.addListener('appUrlOpen', handleDeepLink);

    // Check if app was launched with a URL
    App.getLaunchUrl().then(launchUrl => {
      if (launchUrl?.url && !processedUrls.current.has(launchUrl.url)) {
        console.log('App launched with URL:', launchUrl.url);
        handleDeepLink({ url: launchUrl.url });
      }
    });

    // Cleanup listener on unmount
    return () => {
      removeListener.then(remove => remove?.remove());
    };
  }, []); // Empty deps - only run once, use navigateRef for latest navigate

  // Function to create deep links programmatically
  const createDeepLink = (path: string, params?: Record<string, string>) => {
    const segments = path.replace(/^\/+/, '').split('/').filter(Boolean);
    const [host = 'app', ...rest] = segments;

    return buildNativeUrl(host, rest, params);
  };

  // Function to create universal links
  const createUniversalLink = (path: string, params?: Record<string, string>) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return buildUniversalUrl(normalizedPath, params);
  };

  return {
    createDeepLink,
    createUniversalLink,
  };
};

export default useDeepLinks;
