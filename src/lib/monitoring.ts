import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/react';

type MonitoringExtras = Record<string, unknown>;
type MonitoringTags = Record<string, string | number | boolean>;
type MonitoringContextMap = Record<string, Record<string, unknown>>;

interface MonitoringScopeOptions {
  extras?: MonitoringExtras;
  tags?: MonitoringTags;
  contexts?: MonitoringContextMap;
  fingerprint?: string[];
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}

const SENSITIVE_QUERY_KEYS = new Set([
  'access_token',
  'refresh_token',
  'token',
  'code',
  'password',
  'otp',
  'secret',
  'apikey',
  'api_key',
  'authorization',
]);

let isMonitoringInitialized = false;

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim();

const sanitizeText = (value: string) =>
  value
    .replace(
      /([?&](?:access_token|refresh_token|token|code|password|otp|secret|apikey|api_key|authorization)=)[^&]+/gi,
      '$1[REDACTED]',
    )
    .replace(/#.*$/, '');

const sanitizeUrl = (value?: string | null) => {
  if (!value) {
    return value;
  }

  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    const url = new URL(value, base);

    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }

    url.hash = '';
    return url.toString();
  } catch {
    return sanitizeText(value);
  }
};

const parseSampleRate = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, parsed));
};

const sanitizeObject = (input: unknown): unknown => {
  if (typeof input === 'string') {
    return sanitizeText(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item));
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => {
        if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
          return [key, '[REDACTED]'];
        }

        if (key.toLowerCase().includes('url') && typeof value === 'string') {
          return [key, sanitizeUrl(value)];
        }

        return [key, sanitizeObject(value)];
      }),
    );
  }

  return input;
};

const applyScopeOptions = (
  scope: Sentry.Scope,
  options?: MonitoringScopeOptions,
) => {
  if (!options) {
    return;
  }

  if (options.level) {
    scope.setLevel(options.level);
  }

  if (options.fingerprint?.length) {
    scope.setFingerprint(options.fingerprint);
  }

  if (options.tags) {
    for (const [key, value] of Object.entries(options.tags)) {
      scope.setTag(key, String(value));
    }
  }

  if (options.extras) {
    scope.setExtras(sanitizeObject(options.extras) as MonitoringExtras);
  }

  if (options.contexts) {
    for (const [name, context] of Object.entries(options.contexts)) {
      scope.setContext(name, sanitizeObject(context) as Record<string, unknown>);
    }
  }
};

export const isMonitoringEnabled = () => Boolean(sentryDsn);

export const initMonitoring = () => {
  if (!sentryDsn || isMonitoringInitialized) {
    return;
  }

  const tracesSampleRate = parseSampleRate(
    import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
    0,
  );

  const integrations =
    tracesSampleRate > 0 ? [Sentry.browserTracingIntegration()] : [];

  Sentry.init({
    dsn: sentryDsn,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || import.meta.env.MODE,
    release: __APP_RELEASE__,
    integrations,
    tracesSampleRate,
    attachStacktrace: true,
    sendDefaultPii: false,
    normalizeDepth: 6,
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url) ?? event.request.url;
      }

      if (event.user?.ip_address) {
        delete event.user.ip_address;
      }

      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        delete headers.Authorization;
        delete headers.authorization;
        event.request.headers = headers;
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          const nextBreadcrumb = { ...breadcrumb };

          if (typeof nextBreadcrumb.message === 'string') {
            nextBreadcrumb.message = sanitizeText(nextBreadcrumb.message);
          }

          if (nextBreadcrumb.data) {
            nextBreadcrumb.data = sanitizeObject(nextBreadcrumb.data) as Record<
              string,
              unknown
            >;
          }

          return nextBreadcrumb;
        });
      }

      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      const nextBreadcrumb = { ...breadcrumb };

      if (typeof nextBreadcrumb.message === 'string') {
        nextBreadcrumb.message = sanitizeText(nextBreadcrumb.message);
      }

      if (nextBreadcrumb.data) {
        nextBreadcrumb.data = sanitizeObject(nextBreadcrumb.data) as Record<
          string,
          unknown
        >;
      }

      return nextBreadcrumb;
    },
  });

  Sentry.setTag(
    'runtime_platform',
    Capacitor.isNativePlatform()
      ? `capacitor-${Capacitor.getPlatform()}`
      : 'web',
  );
  Sentry.setTag('app_mode', import.meta.env.MODE);

  isMonitoringInitialized = true;
};

export const captureException = (
  error: unknown,
  options?: MonitoringScopeOptions,
) => {
  if (!sentryDsn) {
    return undefined;
  }

  return Sentry.withScope((scope) => {
    applyScopeOptions(scope, options);
    return Sentry.captureException(error);
  });
};

export const captureMessage = (
  message: string,
  options?: MonitoringScopeOptions,
) => {
  if (!sentryDsn) {
    return undefined;
  }

  return Sentry.withScope((scope) => {
    applyScopeOptions(scope, options);
    return Sentry.captureMessage(sanitizeText(message), options?.level);
  });
};

export const setMonitoringUser = (user: {
  id: string;
  email?: string | null;
  username?: string | null;
}) => {
  if (!sentryDsn) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
    username: user.username ?? undefined,
  });
  Sentry.setTag('auth_state', 'authenticated');
};

export const clearMonitoringUser = () => {
  if (!sentryDsn) {
    return;
  }

  Sentry.setUser(null);
  Sentry.setTag('auth_state', 'anonymous');
};

export const setMonitoringTag = (
  key: string,
  value: string | number | boolean | null | undefined,
) => {
  if (!sentryDsn || value === null || value === undefined) {
    return;
  }

  Sentry.setTag(key, String(value));
};

export const setMonitoringContext = (
  name: string,
  context: Record<string, unknown> | null | undefined,
) => {
  if (!sentryDsn || !context) {
    return;
  }

  Sentry.setContext(name, sanitizeObject(context) as Record<string, unknown>);
};
