# Remediation Execution Plan

Date: 2026-04-21
Scope: full remediation and hardening pass based on the 2026-04-21 audit package

## Objective

Strengthen the app for launch without expanding product scope. The work in this phase focused on:

1. security and access control
2. core business correctness
3. deployment/runtime readiness
4. product-truth alignment
5. performance
6. UI consistency and accessibility
7. maintainability in the highest-risk modules

## Completed execution summary

### 1. Security and access control hardening

- Replaced browser auth implicit flow with PKCE in `src/integrations/supabase/client.ts`.
- Hardened auth callback processing in `src/hooks/useAuthCallback.ts` to exchange authorization codes explicitly.
- Tightened Edge Function CORS behavior in `supabase/functions/_shared/security.ts` so disallowed origins no longer receive fallback allow-origin headers.
- Retired the insecure generic mail relay in `supabase/functions/send-email/index.ts` with a clear `410` response.
- Reduced sensitive logging across auth, profile, signature, invoice logo, invoice send, and Stripe webhook flows.

### 2. Core correctness and product-truth fixes

- Replaced mock external calendar behavior with an explicitly disabled state in:
  - `src/hooks/useConnectedCalendarsState.ts`
  - `src/components/availability/ConnectedCalendarsModal.tsx`
  - `src/pages/Availability.tsx`
- Corrected onboarding invoice readiness rules in `src/context/OnboardingContext.tsx`.
- Removed passive background job status mutation in `src/hooks/useSupabaseJobs.ts`.
- Fixed portfolio image deletion so storage objects are cleaned up when metadata is removed:
  - `src/hooks/usePortfolioPhoto.ts`
  - `src/hooks/usePhotoManagement.ts`

### 3. Deployment/runtime hardening

- Made lint green and excluded generated native build artifacts from source-quality gates:
  - `eslint.config.js`
  - `src/context/PortfolioDataContextModed.tsx`
  - `supabase/functions/stripe-webhook/index.ts`
- Expanded environment documentation in `.env.example`.
- Added runtime verification tooling in `scripts/verify-runtime-config.mjs`.
- Added basic health/readiness assets:
  - `public/healthz.json`
  - `public/readyz.json`
- Added launch operational docs:
  - `docs/launch_smoke_checklist.md`
  - updated `docs/production-observability.md`

### 4. Performance and maintainability

- Moved `jspdf` to a dynamic import in `src/pages/Finance.tsx`.
- Reduced jobs polling/network churn in `src/hooks/useSupabaseJobs.ts`.
- Reintroduced a single light-theme source of truth for the app shell in `src/App.tsx`.

## What remains blocked by environment or larger follow-up work

These are not code regressions; they are launch inputs or broader follow-up items:

- Production runtime secrets are still missing locally for:
  - `BOOKING_RESPONSE_SECRET`
  - `BOOKING_REQUEST_RATE_LIMIT_SALT`
  - `RESEND_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Sentry is only partially configured in local env.
- `pdf-vendor` and `charts-vendor` remain larger than desired and need a deeper split strategy.
- External calendar sync is now truthfully disabled, but a real server-backed sync still does not exist.

## Launch recommendation after remediation

The codebase is materially stronger than before this phase and the previously identified critical code-level blockers are addressed. Public launch should still wait for:

1. production secrets to be configured and verified
2. production smoke checks to be executed
3. explicit product acceptance of disabled external calendar sync
4. final QA pass on the hardened auth + booking + invoice + payment flows
