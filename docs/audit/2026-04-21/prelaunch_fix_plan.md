# Prelaunch Fix Plan

Date: 2026-04-21
Priority order follows the requested audit sequence.

## Phase 0: Must fix before launch

### 1. Security and access control

1. Replace browser auth implicit flow with PKCE.
   - Files: `src/integrations/supabase/client.ts`, auth callback/session flow files
   - Outcome: removes the riskiest session-token posture in the browser

2. Redesign or retire `send-email`.
   - Files: `supabase/functions/send-email/index.ts`
   - Outcome: no internal mail relay authenticated by a raw service-role-key header

3. Tighten CORS rejection behavior.
   - Files: `supabase/functions/_shared/security.ts`
   - Outcome: disallowed origins receive no fallback allow-origin behavior

4. Remove sensitive payload logging from financial/auth/profile flows.
   - Files: `send-invoice-v2`, `stripe-webhook`, profile/signature hooks, invoice/logo hooks
   - Outcome: safer logs and lower privacy exposure

### 2. Correctness of core business logic

1. Gate or remove the mock external calendar integration until a real sync exists.
   - Files: `src/hooks/useConnectedCalendarsState.ts`, `src/pages/Availability.tsx`
   - Outcome: users do not rely on fake Google/Calendly state

2. Fix onboarding completion logic for invoice readiness.
   - Files: `src/context/OnboardingContext.tsx`
   - Outcome: “invoice complete” reflects actual invoice/business setup, not signature-only state

3. Re-review background auto status mutation in jobs.
   - Files: `src/hooks/useSupabaseJobs.ts`
   - Outcome: background refresh does not silently change business state unless deliberately intended

### 3. Deployment/runtime risks

1. Make CI green.
   - Files: `.github/workflows/ci.yml`, lint config/excludes, `PortfolioDataContextModed.tsx`, `stripe-webhook/index.ts`
   - Outcome: deploy gate is trustworthy

2. Expand `.env.example` and deployment docs.
   - Include: Resend, Stripe, booking-response secret, any remaining live secrets
   - Outcome: predictable deploy setup

3. Reduce the worst bundle hotspots before launch.
   - Files: `vite.config.ts`, finance/report/export surfaces, PDF/editor imports
   - Outcome: less mobile startup risk

### 4. Product-flow mismatches

1. Audit user-facing copy and affordances around connected calendars.
2. Audit finance local-only behaviors and decide whether they should be account-backed or clearly device-local.
3. Verify onboarding, booking, jobs, finance, and public portfolio behavior all match intended launch stories.

## Phase 1: Should fix soon after launch

### 5. Performance

1. Consolidate resume refresh and interval refresh behavior in jobs.
2. Add image optimization/resizing for portfolio media.
3. Split finance and availability route logic into smaller active-tab modules.

### 6. UI consistency and styling

1. Restore one typography source of truth.
2. Finish theme wiring or remove partial theme assumptions.
3. Replace raw page-specific colors with semantic tokens.
4. Bring `TermsAndPrivacy` into the shared design language.

### 7. Code quality and cleanup

1. Reduce monolith size in:
   - `AuthProvider.tsx`
   - `Finance.tsx`
   - `Availability.tsx`
   - `send-invoice-v2/index.ts`
   - `stripe-webhook/index.ts`
2. Consolidate duplicated auth and job-state logic.
3. Reduce `any` usage and strengthen RPC typing.

## Phase 2: Nice to improve later

1. Add product analytics/funnel tracking.
2. Add bundle budgets and architecture guardrails in CI.
3. Build reusable accessibility-safe dialog and form shells.
4. Add visual regression coverage for the most customized mobile screens.

## Suggested execution sequence

1. CI green-up and environment completeness
2. Auth hardening
3. Connected-calendar product truth fix
4. Logging/privacy cleanup in critical flows
5. Launch smoke/E2E coverage
6. Bundle reduction on finance/PDF/chart paths

## Recommended launch gate

Do not launch publicly until all of these are true:

- CI is green
- auth flow no longer uses implicit flow
- external calendar feature is either real or clearly disabled/gated
- required runtime secrets are documented and verified
- at least one smoke path exists for:
  - sign in
  - submit booking request
  - accept/decline booking request
  - send invoice
  - complete Stripe payment/webhook processing
