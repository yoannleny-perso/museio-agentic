# Full App Audit Report

Date: 2026-04-21
Scope: full repository audit for launch readiness
Method: code inspection plus local validation (`npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`)

## Observed vs inferred

- Observed: route structure, auth/session behavior, Supabase function boundaries, storage usage, styling patterns, build output, CI config, and current validation results.
- Inferred: product intent for onboarding, finance, availability, portfolio, and public booking flows where the codebase contains implementation but limited formal product documentation.

## Inferred architecture summary

This is a Vite + React + Capacitor application backed by Supabase.

- Frontend shell:
  - `src/main.tsx` bootstraps `BrowserRouter` and client monitoring.
  - `src/App.tsx` lazy-loads most route surfaces and wraps them with multiple global providers.
- Private app:
  - Authenticated routes live under `/app/*`.
  - Primary domains are `home`, `jobs`, `portfolio`, `clients`, `availability`, `settings`, and `finance`.
- Public app:
  - Public portfolio route at `/:handle`.
  - Public booking flow at `/:nickname/book`.
  - Public booking-response route for signed accept/decline links.
- Data layer:
  - Browser-side Supabase client in `src/integrations/supabase/client.ts`.
  - Domain hooks and service modules in `src/hooks` and `src/services`.
  - Supabase Edge Functions under `supabase/functions`.
  - Migrations under `supabase/migrations`.
- Styling:
  - Tailwind CSS plus custom CSS in `src/index.css`.
  - Radix/shadcn-style primitives in `src/components/ui`.
  - Significant page-level bespoke styling, especially in portfolio, finance, and availability.
- Integrations:
  - Supabase Auth, DB, Storage
  - Stripe and Stripe Connect
  - Resend
  - Cloudflare Turnstile
  - Sentry
  - Capacitor push notifications / mobile lifecycle

## Validation snapshot

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | Pass | No TypeScript compile errors |
| `npm run test` | Pass | 5 files, 20 tests |
| `npm run build` | Pass with warnings | Several chunks exceed 500 kB |
| `npm run lint` | Fail | Generated iOS artifacts are linted and there are live source issues in `PortfolioDataContextModed.tsx` and `stripe-webhook/index.ts` |

## Executive summary

This codebase is feature-rich and materially closer to launch-ready than an early prototype, but it is **not yet cleanly production-ready**.

The highest-risk issues, in the priority order requested, are:

1. security and access control
   - Browser auth still uses implicit flow with persistent tokens in `localStorage`.
   - One internal mail relay pattern remains overly permissive in design (`send-email`).
   - Sensitive and financial flows still emit too much operational data to logs.
2. correctness of core business logic
   - The external calendar integration shown in Availability is still a local/mock implementation, not a real Google/Calendly sync.
   - Onboarding marks invoice setup complete based on signature presence rather than actual invoice readiness.
3. deployment/runtime risks
   - CI is red because lint fails.
   - Large bundles and oversized monolithic modules raise runtime and change-risk.
   - Environment-variable documentation is incomplete for critical backend services.
4. product-flow mismatches
   - Availability UI implies a real external sync product that the current implementation does not provide.
   - Several “settings/history” style finance behaviors are device-local rather than account-level.
5. performance
   - Heavy chart/PDF/vendor chunks and frequent background refresh behavior remain significant.
6. UI consistency and styling
   - The app has a partial design system, but many pages drift from it substantially.
7. code quality and cleanup
   - Core domains still rely on oversized modules, duplicated logic, and very noisy logging.

## Critical blockers before launch

| Severity | Area | Finding | Evidence |
| --- | --- | --- | --- |
| Critical | Core business logic | External calendar connections are mock/local-only while the UI presents them like real Google/Calendly integrations | `src/hooks/useConnectedCalendarsState.ts` |
| Critical | Deployment/runtime | CI is not green; `npm run lint` currently fails | `.github/workflows/ci.yml`, `src/context/PortfolioDataContextModed.tsx`, `supabase/functions/stripe-webhook/index.ts`, `ios/build/**` |

## High-severity launch blockers

| Severity | Area | Finding | Evidence |
| --- | --- | --- | --- |
| High | Security | Browser auth client uses `flowType: 'implicit'` and persists tokens in `localStorage` | `src/integrations/supabase/client.ts` |
| High | Security | Internal mail relay uses raw service-role-key equality as request authorization | `supabase/functions/send-email/index.ts` |
| High | Correctness | Onboarding invoice completion is tied to signature state, not invoice/business readiness | `src/context/OnboardingContext.tsx` |
| High | Runtime | `send-invoice-v2` is a large multi-responsibility function with unpinned `pdf-lib@latest` and extensive logging | `supabase/functions/send-invoice-v2/index.ts` |
| High | Performance | Build output contains very large chunks: `vendor` 481 kB, `charts-vendor` 547 kB, `pdf-vendor` 687 kB | `vite.config.ts`, current `npm run build` output |
| High | Maintainability | Auth logic is split across `AuthProvider`, `authUtils`, `ProtectedRoute`, and callback hooks with overlapping responsibilities | `src/context/auth/AuthProvider.tsx`, `src/context/auth/authUtils.ts`, `src/components/ProtectedRoute.tsx`, `src/hooks/useAuthCallback.ts` |

## Medium-severity findings

| Severity | Area | Finding | Evidence |
| --- | --- | --- | --- |
| Medium | Security | CORS helper falls back to the first allowed origin even when the request origin is not allowed | `supabase/functions/_shared/security.ts` |
| Medium | Security | Significant PII and financial logging remains across client hooks and edge functions | `src/hooks/useSupabaseProfileDetails.ts`, `src/hooks/useSupabaseSignature.ts`, `supabase/functions/send-invoice-v2/index.ts`, `supabase/functions/stripe-webhook/index.ts` |
| Medium | Correctness | Job status is auto-mutated in background polling, which can surprise users and create side effects during passive viewing | `src/hooks/useSupabaseJobs.ts` |
| Medium | Correctness | Portrait photo delete removes DB metadata but does not clean up storage objects | `src/hooks/usePortfolioPhoto.ts` |
| Medium | Deployment/runtime | `.env.example` does not document several critical runtime secrets such as Stripe, Resend, and booking-response secrets | `.env.example`, multiple `supabase/functions/*` |
| Medium | Product-flow mismatch | Finance keeps some settings/history in localStorage, so behavior is device-local rather than account-level | `src/pages/Finance.tsx` |
| Medium | Performance | Jobs refresh logic uses both timed background refresh and explicit resume refresh, creating duplicated network work | `src/hooks/useSupabaseJobs.ts`, `src/components/CapacitorAppStateManager.tsx` |
| Medium | UI consistency | The design system is only partially enforced; major pages use bespoke fonts, spacing, colors, and shadows | `src/index.css`, `tailwind.config.ts`, `src/pages/Finance.tsx`, `src/pages/TermsAndPrivacy.tsx` |
| Medium | Accessibility | Global scrollbar hiding and visually complex image-over-text patterns hurt discoverability and legibility | `src/index.css`, portfolio hero components |

## Lower-severity but important findings

| Severity | Area | Finding | Evidence |
| --- | --- | --- | --- |
| Low | UX | No product analytics library was found, so launch telemetry will rely mainly on Sentry/errors instead of funnel insight | repository-wide scan |
| Low | Styling | `next-themes` is imported and consumed by the toaster, but `ThemeProvider` is commented out | `src/App.tsx`, `src/components/ui/sonner.tsx` |
| Low | Docs | Architecture and observability docs exist, but they do not fully match every live domain implementation | `docs/ARCHITECTURE.md`, `docs/production-observability.md` |

## Must fix before launch

- Replace browser auth implicit flow with PKCE and re-review token storage strategy.
- Remove or harden the `send-email` relay so it cannot be treated like a general-purpose internal mail primitive.
- Either ship real external calendar integrations or clearly gate/hide the feature so production users do not see mock data.
- Make CI green and exclude generated native build artifacts from lint.
- Break down or harden `send-invoice-v2` enough to reduce operational and change risk.
- Document all required launch env vars and add launch smoke checks for them.

## Should fix soon after launch

- Normalize onboarding completion rules to actual product readiness.
- Reduce background polling duplication in jobs and app resume flows.
- Clean up logging volume and PII exposure.
- Address the `ThemeProvider`/toaster mismatch.
- Move finance local-only state to account-backed persistence if the product intends it to be shared.

## Nice to improve later

- Consolidate page styling into reusable tokens and components.
- Reduce large bundle chunks further through route-level and feature-level lazy loading.
- Add product analytics in addition to error monitoring.

## Companion audit files

- `security_and_access_audit.md`
- `code_quality_and_technical_debt_report.md`
- `performance_audit.md`
- `ui_consistency_and_design_audit.md`
- `accessibility_and_ux_risks.md`
- `deployment_and_operational_readiness.md`
- `prelaunch_fix_plan.md`
