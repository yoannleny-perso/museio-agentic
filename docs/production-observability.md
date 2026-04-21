# Production Observability

This app now includes a first-pass client and critical-edge-function observability layer.

## What It Covers

- uncaught React render crashes through [AppErrorBoundary](/Users/yoann/groove-flow-mobile-app-main/src/components/AppErrorBoundary.tsx:1)
- unhandled async query and mutation failures from React Query in [App.tsx](/Users/yoann/groove-flow-mobile-app-main/src/App.tsx:1)
- authenticated user context from [AuthProvider](/Users/yoann/groove-flow-mobile-app-main/src/context/auth/AuthProvider.tsx:1)
- client-side monitoring bootstrap and data scrubbing in [monitoring.ts](/Users/yoann/groove-flow-mobile-app-main/src/lib/monitoring.ts:1)
- release tagging and source-map upload from [vite.config.ts](/Users/yoann/groove-flow-mobile-app-main/vite.config.ts:1)
- shared Supabase Edge Function request IDs, structured logs, and response headers in [observability.ts](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/_shared/observability.ts:1)
- backend error reporting hooks for the highest-risk flows:
  - [submit-booking-request](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/submit-booking-request/index.ts:1)
  - [send-booking-response](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/send-booking-response/index.ts:1)
  - [booking-response](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/booking-response/index.ts:1)
  - [send-job-confirmation](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/send-job-confirmation/index.ts:1)
  - [send-invoice-v2](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/send-invoice-v2/index.ts:1)
  - [stripe-webhook](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/stripe-webhook/index.ts:1)

## Required Environment Variables

Frontend runtime:

```env
VITE_SENTRY_DSN="https://public-key@example.ingest.sentry.io/project-id"
VITE_SENTRY_ENVIRONMENT="production"
VITE_SENTRY_RELEASE="2026-04-16.1"
VITE_SENTRY_TRACES_SAMPLE_RATE="0.05"
```

Build-time source-map upload:

```env
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
SENTRY_ORG="your-sentry-org-slug"
SENTRY_PROJECT="your-sentry-project-slug"
SENTRY_RELEASE="2026-04-16.1"
```

Optional backend alert delivery:

```env
OBSERVABILITY_ALERT_WEBHOOK_URL="https://hooks.example.com/services/your-alert-webhook"
```

## Recommended Production Setup

1. Create a Sentry project for the web app.
2. Add the `VITE_*` variables to the frontend hosting environment.
3. Add the `SENTRY_*` variables to the build environment so Vite can upload source maps.
4. Keep `VITE_SENTRY_RELEASE` and `SENTRY_RELEASE` aligned for each deployment.
5. Start with `VITE_SENTRY_TRACES_SAMPLE_RATE="0.05"` and raise it only if you need more traces.
6. Add `OBSERVABILITY_ALERT_WEBHOOK_URL` for Supabase Edge Function 5xx/error alerts if you want immediate backend paging to Slack, Teams, PagerDuty bridge, or another webhook receiver.

## What Gets Scrubbed

The monitoring layer removes or redacts:

- URL hashes
- `access_token`
- `refresh_token`
- `code`
- `password`
- `otp`
- `secret`
- `authorization`-style query fields
- request `Authorization` headers

This is handled centrally in [monitoring.ts](/Users/yoann/groove-flow-mobile-app-main/src/lib/monitoring.ts:1).

Server-side request correlation is handled in [observability.ts](/Users/yoann/groove-flow-mobile-app-main/supabase/functions/_shared/observability.ts:1). Patched functions now emit:

- `X-Request-Id` response headers
- JSON responses containing `requestId`
- structured logs including function name, request ID, path, method, and duration

## How To Verify

1. Set the Sentry env vars locally.
2. Restart the dev server so `VITE_*` vars are picked up.
3. Trigger a controlled frontend error, for example by temporarily throwing inside a test route or component.
4. Confirm the event appears in Sentry with:
   - release
   - environment
   - `runtime_platform` tag
   - authenticated user context when signed in
5. Build with source-map upload enabled and verify stack traces resolve to source files.

For backend verification:

1. Configure `OBSERVABILITY_ALERT_WEBHOOK_URL`.
2. Trigger a controlled failure in a patched edge function in a non-production environment.
3. Confirm the webhook receives:
   - `function`
   - `requestId`
   - `status`
   - `path`
   - `durationMs`
4. Confirm the same `requestId` is present in the HTTP response headers/body and the function logs.

## Runtime Verification

Before launch:

1. Run `npm run verify:runtime` in the deployment environment.
2. Confirm the required secrets for auth, booking, email, and Stripe are present.
3. Confirm `/healthz.json` and `/readyz.json` return `200`.
4. Run the manual flow checks in [launch_smoke_checklist.md](/Users/yoann/groove-flow-mobile-app-main/docs/launch_smoke_checklist.md:1).

## Alerting Recommendations

Create production alerts for:

- new issue rate spikes in auth flows
- repeated booking submission failures
- repeated invoice/payment UI failures
- crash-free session drops
- edge spikes in React Query mutation errors
- repeated backend failures from `send-invoice-v2`, `stripe-webhook`, and booking-response flows

## Current Limits

- This pass covers the client app plus the highest-risk Supabase Edge Functions, not every function in the repo yet.
- Backend alert delivery is webhook-based. If you want full centralized dashboards/search across all functions, the next step is a Supabase log drain or external log aggregation pipeline.
- Native Capacitor runtime uses the same web monitoring layer inside the WebView, but this is not a full native crash SDK.
