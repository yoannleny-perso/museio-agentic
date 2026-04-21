import { DEFAULT_JOB_TAB, JOB_TAB_QUERY_PARAM, type JobTab } from './jobs.ts';

type QueryValue = string | number | boolean | null | undefined;

export const MOBILE_APP_SCHEME = 'museio';
export const DEFAULT_APP_ORIGIN = 'https://groove-flow-mobile-app.vercel.app';
export const DEFAULT_MARKETING_ORIGIN = 'https://museioapp.com';

export const UNIVERSAL_LINK_HOSTS = [
  'groove-flow-mobile-app.vercel.app',
  'museioapp.com',
  'www.museioapp.com',
] as const;

export const ROUTE_PATHS = {
  root: '/',
  auth: '/auth',
  authCallback: '/auth/callback',
  stripeCallback: '/stripe-callback',
  termsAndPrivacy: '/terms-and-privacy',
  bookingPattern: '/:nickname/book',
  bookingResponse: '/booking-response',
  portfolioPattern: '/:handle',
} as const;

export const APP_ROUTE_BASE = '/app';

export const APP_ROUTE_SEGMENTS = {
  home: 'home',
  jobs: 'jobs',
  jobsNew: 'jobs/new',
  portfolio: 'portfolio',
  clients: 'clients',
  availability: 'availability',
  more: 'more',
  settings: 'settings',
  finance: 'finance',
} as const;

export const APP_ROUTE_PATHS = {
  home: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.home}`,
  jobs: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.jobs}`,
  jobsNew: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.jobsNew}`,
  portfolio: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.portfolio}`,
  clients: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.clients}`,
  availability: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.availability}`,
  more: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.more}`,
  settings: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.settings}`,
  finance: `${APP_ROUTE_BASE}/${APP_ROUTE_SEGMENTS.finance}`,
} as const;

export type AppRouteSection = Exclude<keyof typeof APP_ROUTE_PATHS, 'jobsNew'>;
export type AppRoutePath = (typeof APP_ROUTE_PATHS)[keyof typeof APP_ROUTE_PATHS];

const APP_ROUTE_SECTIONS: AppRouteSection[] = [
  'home',
  'jobs',
  'portfolio',
  'clients',
  'availability',
  'more',
  'settings',
  'finance',
];

const APP_ROUTE_SECTION_SET = new Set<string>(APP_ROUTE_SECTIONS);
const UNIVERSAL_LINK_HOST_SET = new Set<string>(UNIVERSAL_LINK_HOSTS);

const buildSearchParams = (params?: Record<string, QueryValue>) => {
  const searchParams = new URLSearchParams();

  if (!params) {
    return searchParams;
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams;
};

export const buildPathWithQuery = (
  path: string,
  params?: Record<string, QueryValue>
) => {
  const searchParams = buildSearchParams(params);
  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export const buildAppRoute = (
  section: AppRouteSection,
  params?: Record<string, QueryValue>
) => buildPathWithQuery(APP_ROUTE_PATHS[section], params);

export const buildJobsRoute = (tab: JobTab = DEFAULT_JOB_TAB) =>
  buildPathWithQuery(APP_ROUTE_PATHS.jobs, { [JOB_TAB_QUERY_PARAM]: tab });

export const buildSettingsRoute = (params?: Record<string, QueryValue>) =>
  buildPathWithQuery(APP_ROUTE_PATHS.settings, params);

export const buildStripeCallbackRoute = (
  params?: Record<string, QueryValue>
) => buildPathWithQuery(ROUTE_PATHS.stripeCallback, params);

export const buildBookingResponseRoute = (
  params?: Record<string, QueryValue>
) => buildPathWithQuery(ROUTE_PATHS.bookingResponse, params);

export const buildPublicBookingRoute = (nickname: string) =>
  `/${encodeURIComponent(nickname)}/book`;

export const buildPortfolioRoute = (handle: string) =>
  `/${encodeURIComponent(handle)}`;

export const buildAbsoluteUrl = (
  path: string,
  origin: string = DEFAULT_APP_ORIGIN
) => new URL(path, origin.endsWith('/') ? origin : `${origin}/`).toString();

export const buildUniversalUrl = (
  path: string,
  params?: Record<string, QueryValue>,
  origin: string = DEFAULT_APP_ORIGIN
) => buildAbsoluteUrl(buildPathWithQuery(path, params), origin);

export const buildNativeUrl = (
  host: string,
  pathSegments: string[] = [],
  params?: Record<string, QueryValue>
) => {
  const url = new URL(`${MOBILE_APP_SCHEME}://${host}`);

  if (pathSegments.length > 0) {
    url.pathname = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  }

  const searchParams = buildSearchParams(params);
  const queryString = searchParams.toString();
  if (queryString) {
    url.search = queryString;
  }

  return url.toString();
};

export const buildNativeAppUrl = (
  section: AppRouteSection,
  params?: Record<string, QueryValue>
) => buildNativeUrl('app', [section], params);

export const buildNativeBookingUrl = (nickname: string) =>
  buildNativeUrl('book', [nickname]);

export const buildNativeStripeCallbackUrl = (
  params?: Record<string, QueryValue>
) => buildNativeUrl('stripe-callback', [], params);

export const isSupportedUniversalLinkHost = (hostname: string) =>
  UNIVERSAL_LINK_HOST_SET.has(hostname.toLowerCase());

const isAppRouteSection = (value: string): value is AppRouteSection =>
  APP_ROUTE_SECTION_SET.has(value);

const cloneSearchParams = (searchParams: URLSearchParams) => {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

const getPathSegments = (pathname: string) =>
  pathname.split('/').filter(Boolean);

const resolveAppRouteFromSegments = (
  segments: string[],
  searchParams: URLSearchParams
) => {
  const [section, child] = segments;

  if (!section) {
    return APP_ROUTE_PATHS.home;
  }

  if (section === 'jobs' && child === 'new') {
    return APP_ROUTE_PATHS.jobsNew;
  }

  if (!isAppRouteSection(section)) {
    return null;
  }

  return buildAppRoute(section, cloneSearchParams(searchParams));
};

export const extractBookingHandleFromPath = (pathname: string) => {
  const segments = getPathSegments(pathname);

  if (segments[0] === 'book' && segments[1]) {
    return decodeURIComponent(segments[1]);
  }

  if (segments.length === 2 && segments[1] === 'book') {
    return decodeURIComponent(segments[0]);
  }

  return null;
};

export const resolveCustomSchemePath = (url: URL) => {
  const segments = [url.hostname, ...getPathSegments(url.pathname)].filter(Boolean);
  const [root, ...rest] = segments;

  if (!root) {
    return APP_ROUTE_PATHS.home;
  }

  if (root === 'app') {
    return resolveAppRouteFromSegments(rest, url.searchParams) ?? APP_ROUTE_PATHS.home;
  }

  if (root === 'stripe-callback') {
    return buildStripeCallbackRoute(cloneSearchParams(url.searchParams));
  }

  if (root === 'booking') {
    const username = url.searchParams.get('username') ?? rest[0];
    return username ? buildPublicBookingRoute(username) : APP_ROUTE_PATHS.home;
  }

  if (root === 'book') {
    return rest[0] ? buildPublicBookingRoute(rest[0]) : APP_ROUTE_PATHS.home;
  }

  if (isAppRouteSection(root)) {
    return resolveAppRouteFromSegments([root, ...rest], url.searchParams);
  }

  return buildPublicBookingRoute(root);
};

export const resolveUniversalLinkPath = (url: URL) => {
  if (!isSupportedUniversalLinkHost(url.hostname)) {
    return null;
  }

  if (url.pathname === ROUTE_PATHS.root || url.pathname === '') {
    return APP_ROUTE_PATHS.home;
  }

  if (url.pathname === ROUTE_PATHS.stripeCallback) {
    return buildStripeCallbackRoute(cloneSearchParams(url.searchParams));
  }

  if (url.pathname === ROUTE_PATHS.bookingResponse) {
    return buildBookingResponseRoute(cloneSearchParams(url.searchParams));
  }

  if (
    url.pathname === ROUTE_PATHS.auth ||
    url.pathname === ROUTE_PATHS.authCallback ||
    url.pathname === ROUTE_PATHS.termsAndPrivacy
  ) {
    return buildPathWithQuery(url.pathname, cloneSearchParams(url.searchParams));
  }

  if (url.pathname.startsWith('/app')) {
    const segments = getPathSegments(url.pathname).slice(1);
    return resolveAppRouteFromSegments(segments, url.searchParams) ?? APP_ROUTE_PATHS.home;
  }

  const bookingHandle = extractBookingHandleFromPath(url.pathname);
  if (bookingHandle) {
    return buildPublicBookingRoute(bookingHandle);
  }

  return APP_ROUTE_PATHS.home;
};

export const resolveSupportedDeepLinkPath = (url: URL) => {
  if (url.protocol === `${MOBILE_APP_SCHEME}:`) {
    return resolveCustomSchemePath(url);
  }

  if (url.protocol === 'https:' && isSupportedUniversalLinkHost(url.hostname)) {
    return resolveUniversalLinkPath(url);
  }

  return null;
};
