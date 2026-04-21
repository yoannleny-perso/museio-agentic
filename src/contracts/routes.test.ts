import { describe, expect, it } from 'vitest';

import {
  APP_ROUTE_PATHS,
  buildJobsRoute,
  buildNativeAppUrl,
  buildStripeCallbackRoute,
  buildUniversalUrl,
  resolveSupportedDeepLinkPath,
} from './routes';
import { JOB_TAB } from './jobs';

describe('route contracts', () => {
  it('builds app routes with stable query params', () => {
    expect(buildJobsRoute(JOB_TAB.requests)).toBe('/app/jobs?tab=requests');
    expect(buildStripeCallbackRoute({ stripe_return: true })).toBe(
      '/stripe-callback?stripe_return=true'
    );
  });

  it('resolves custom-scheme app links into app routes', () => {
    expect(
      resolveSupportedDeepLinkPath(
        new URL(buildNativeAppUrl('settings', { tab: 'bank', stripe_return: true }))
      )
    ).toBe('/app/settings?tab=bank&stripe_return=true');
  });

  it('resolves booking deep links across formats', () => {
    expect(
      resolveSupportedDeepLinkPath(new URL('museio://book/dj-sample'))
    ).toBe('/dj-sample/book');

    expect(
      resolveSupportedDeepLinkPath(new URL('https://museioapp.com/dj-sample/book'))
    ).toBe('/dj-sample/book');
  });

  it('rejects unsupported hosts and preserves universal callback params', () => {
    expect(
      resolveSupportedDeepLinkPath(new URL('https://example.com/app/jobs?tab=paid'))
    ).toBeNull();

    expect(
      resolveSupportedDeepLinkPath(
        new URL(buildUniversalUrl('/stripe-callback', { stripe_refresh: true }))
      )
    ).toBe('/stripe-callback?stripe_refresh=true');
  });

  it('falls back to home for empty app deep links', () => {
    expect(resolveSupportedDeepLinkPath(new URL('museio://app'))).toBe(
      APP_ROUTE_PATHS.home
    );
  });
});
