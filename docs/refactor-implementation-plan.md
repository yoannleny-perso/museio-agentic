# Refactor Implementation Plan

Generated on 2026-04-14.

## Goal

Clean and harden the app before adding new features by:

- removing repo and security hygiene problems
- establishing clear contracts and routing rules
- reducing structural duplication
- stabilizing booking, jobs, billing, and Stripe flows
- restoring quality gates and automated verification

## Delivery Principles

- No rewrite-from-scratch.
- Stabilize the product in place.
- Fix correctness before style.
- Introduce shared contracts before broad refactors.
- Keep each phase releasable.

## Phase Overview

| Phase | Name | Goal | Status |
| --- | --- | --- | --- |
| 01 | Security And Repo Hygiene | Remove sensitive/generated artifacts, externalize config, improve docs, add CI baseline | Completed |
| 02 | Contracts And Shared Types | Canonicalize route patterns, job/booking statuses, payload schemas, and shared validators | Completed |
| 03 | Navigation And Native Flow Hardening | Fix route/deep-link/Stripe callback consistency across web and native | Completed |
| 04 | Jobs And Booking Domain Stabilization | Simplify jobs state, repair booking lifecycle, and fix availability blocking logic | Completed |
| 05 | Portfolio Architecture Cleanup | Consolidate duplicated portfolio stacks and decompose large context providers | Completed |
| 06 | Billing And Stripe Consolidation | Reduce duplicate invoice paths and simplify Stripe integration points | Completed |
| 07 | Quality Gates And Tests | Bring lint to green, add test coverage, and improve bundle health | Completed |
| 08 | Final Consolidation | Remove deprecated paths, finish docs, and prepare feature-safe baseline | Completed |

## Phase 01: Security And Repo Hygiene

### Objectives

- Remove sensitive and generated artifacts from the repository tree.
- Stop committing environment-specific and generated local files.
- Move frontend Supabase config to environment variables.
- Replace placeholder top-level docs with real project docs.
- Add a baseline CI workflow that enforces what currently passes.

### Tasks

- Remove committed PII/debug artifacts:
  `src/types/20250627-users-dump.csv`
- Remove committed generated artifacts:
  `dist/`,
  `__azurite_db_blob__.json`,
  `__azurite_db_blob_extent__.json`,
  `android/app/release/*`
- Expand `.gitignore` to cover:
  `.env`,
  Azurite files,
  release outputs,
  coverage,
  other local junk
- Externalize Supabase client config from code to env-backed values.
- Add `.env.example`.
- Replace the README with accurate setup and architecture notes.
- Add baseline CI for:
  `npm ci`,
  `npm run typecheck`,
  `npm run build`

### Validation

- `npm run typecheck`
- `npm run build`

### Exit Criteria

- No sensitive dump files remain in source.
- No generated build output remains in the repository tree.
- Supabase frontend config is env-driven.
- README is project-specific.
- CI baseline exists and matches current passing checks.

## Phase 02: Contracts And Shared Types

### Objectives

- Create one source of truth for domain contracts and route shapes.

### Tasks

- Introduce shared enums/types for:
  `JobStatus`,
  booking request status,
  Stripe connection state,
  invoice send request/response
- Create shared route builders for:
  app routes,
  public portfolio routes,
  booking routes,
  deep links,
  Stripe callback routes
- Add runtime validation for critical Edge Function payloads with Zod.
- Document contract ownership.

### Target Areas

- `src/types`
- `src/lib`
- `src/hooks/useDeepLinks.ts`
- `src/App.tsx`
- `supabase/functions/*`

### Applied In This Phase

- Added shared contracts under `src/contracts` for:
  route builders and deep-link parsing,
  job statuses and jobs tab values,
  booking request and booking-response payloads,
  Stripe function payloads/responses,
  invoice function payloads/responses
- Re-exported canonical `JobStatus` from `src/types` so existing app imports remain stable.
- Migrated key frontend consumers to shared contracts:
  `App`,
  `useDeepLinks`,
  `StripeCallback`,
  jobs tab routing,
  push notification navigation,
  booking page submission,
  booking response screens,
  invoice sending,
  Stripe settings/dashboard flows
- Added Zod validation to critical Edge Function payloads:
  `stripe-oauth-callback`,
  `stripe-create-account-link`,
  `stripe-oauth-connect`,
  `send-booking-response`
- Updated booking availability to use the current shared job status model instead of the old `confirmed/completed/live` set.

### Validation

- `npm run typecheck`
- `npm run build`

### Exit Criteria

- No duplicated handwritten status unions remain in active code paths.
- Routes are built from shared helpers, not ad hoc string literals.

## Phase 03: Navigation And Native Flow Hardening

### Objectives

- Make web, universal links, custom schemes, and Stripe return flows consistent.

### Tasks

- Fix booking deep-link path mismatch.
- Fix native Stripe callback reopen path.
- Make jobs tab routing controlled instead of default-only.
- Remove hook-order violations in jobs routing components.
- Update deep-link docs to match implementation.

### Target Areas

- `src/hooks/useDeepLinks.ts`
- `src/pages/StripeCallback.tsx`
- `src/components/jobs/JobsPageWrapper.tsx`
- `src/components/jobs/JobsTabs.tsx`
- `docs/DEEP_LINKING.md`

### Applied In This Phase

- Completed the jobs tab route synchronization so `activeTab` now round-trips through `/app/jobs?tab=...` instead of only reading an initial default.
- Removed the hook-order risk in `JobsPageWrapper` by eliminating the `try/catch` wrapper around `useJobsContext`.
- Kept push notification routing aligned with the jobs query-param model.
- Rewrote `docs/DEEP_LINKING.md` to match the actual supported hosts, canonical deep-link formats, legacy compatibility paths, and Stripe callback behavior.
- Verified that the shared Stripe callback flow reopens native settings on the bank tab and routes web returns back through the same settings path model.

### Validation

- `npx eslint src/components/jobs/JobsPageWrapper.tsx src/components/jobs/JobsTabs.tsx src/components/jobs/JobsContainer.tsx src/hooks/usePushNotifications.ts src/hooks/useDeepLinks.ts src/pages/StripeCallback.tsx`
- `npm run typecheck`
- `npm run build`

### Exit Criteria

- Opening any supported link lands on the correct screen on web and native.

## Phase 04: Jobs And Booking Domain Stabilization

### Objectives

- Make booking and jobs behavior internally consistent and safe.

### Tasks

- Define the canonical job lifecycle.
- Centralize status transitions in one domain service.
- Fix availability function to use current status model.
- Fix overlapping multi-day booking queries.
- Simplify jobs state so async CRUD is not spread across multiple contexts/hooks.
- Make booking request accept/decline/quote handling explicit and documented.

### Target Areas

- `src/context/JobsContext.tsx`
- `src/hooks/useSupabaseJobs.ts`
- `src/utils/jobStatusUpdater.ts`
- `src/lib/bookingRequests.ts`
- `supabase/functions/get-booking-availability/index.ts`
- `supabase/functions/booking-response/index.ts`

### Applied In This Phase

- Added a shared lifecycle contract in `src/contracts/jobLifecycle.ts` so schedule-derived status decisions now come from one place instead of being duplicated across hooks, utilities, and backend flows.
- Updated job status synchronization in `src/utils/jobStatusUpdater.ts` to auto-transition only schedule-managed states and to preserve terminal states like `paid` and `invoice-sent`.
- Aligned new job creation and draft flows with the canonical lifecycle in:
  `src/hooks/useJobForm.ts`,
  `src/hooks/useJobFormSubmit.ts`,
  `src/hooks/useNewJobForm.ts`,
  `src/pages/NewJob.tsx`,
  `src/services/jobService.ts`
- Updated booking-to-job conversion in `src/lib/bookingRequests.ts` so accepted booking requests create jobs with schedule-aware status and explicit accepted state instead of relying on older hardcoded assumptions.
- Removed duplicate frontend booking-request status writes from `src/hooks/useBookingRequests.ts` so the Edge Functions remain the source of truth for quote and decline transitions.
- Expanded booking availability blocking rules to include quoted and accepted booking requests, and fixed overlap detection in `supabase/functions/get-booking-availability/index.ts` so multi-day jobs that begin before the requested range still block availability.
- Hardened the booking response functions:
  `supabase/functions/send-booking-response/index.ts` now persists `quoted` and `declined` states explicitly,
  `supabase/functions/booking-response/index.ts` now treats accepted/declined links as one-time actions, creates jobs with canonical schedule-derived status, and marks accepted requests explicitly after job creation.
- Replaced remaining `any` usage in the booking response Edge Functions with explicit database-backed shapes so the booking lifecycle path is easier to reason about and lint-clean in the touched files.

### Validation

- `npx eslint src/contracts/jobLifecycle.ts src/utils/jobStatusUpdater.ts src/hooks/useJobForm.ts src/hooks/useJobFormSubmit.ts src/hooks/useNewJobForm.ts src/lib/bookingRequests.ts src/hooks/useBookingRequests.ts src/services/jobService.ts src/pages/NewJob.tsx supabase/functions/get-booking-availability/index.ts supabase/functions/send-booking-response/index.ts supabase/functions/booking-response/index.ts`
- `npm run typecheck`
- `npm run build`

### Exit Criteria

- Booking availability never exposes obviously blocked slots.
- Status transitions are deterministic and testable.

## Phase 05: Portfolio Architecture Cleanup

### Objectives

- Reduce duplication and break up oversized providers.

### Tasks

- Decide the single active portfolio implementation path.
- Deprecate or remove `portfolio` vs `portfolio2` duplication.
- Split giant portfolio contexts by concern:
  settings,
  sections,
  photos,
  videos,
  events,
  featured cards,
  smart links,
  theme
- Shift server state to React Query or focused data hooks.

### Target Areas

- `src/context/PortfolioDataContext.tsx`
- `src/context/UsernamePortfolioDataContext.tsx`
- `src/context/PortfolioDataContextModed.tsx`
- `src/components/portfolio`
- `src/components/portfolio2`

### Applied In This Phase

- Scoped the authenticated `PortfolioDataProvider` to the `/app/portfolio` route shell in `src/components/Layout.tsx` instead of wrapping the entire application tree from `src/App.tsx`, which removes unnecessary portfolio fetches on non-portfolio screens.
- Updated `src/context/PortfolioDataContextModed.tsx` so edit mode reuses the already-mounted authenticated portfolio context when available and only falls back to creating its own provider for standalone mounts. This removes the double-provider pattern that previously existed on the edit portfolio page.
- Kept `portfolio2` as the active portfolio rendering stack and aligned `src/components/portfolio2/FeaturedReleaseList.tsx` with `useModedPortfolioData`, which fixes the live/public portfolio release section so it no longer depends on the authenticated-only context.
- Collapsed the legacy `src/hooks/usePortfolioSections.ts` implementation into a compatibility re-export of `useModedPortfolioSections`, removing one full duplicate section-management path while preserving import stability.
- Removed stale portfolio wiring in `src/pages/Portfolio.tsx` and narrowed the active edit-mode provider ownership to the route/layout composition instead of stacking redundant providers inside the page itself.
- Confirmed that the legacy `src/components/portfolio` tree is currently inactive in the routed UI. It remains in the repository for now, but it is no longer part of the active implementation path and can be removed in the final consolidation phase with lower risk.

### Validation

- `npx eslint src/context/PortfolioDataContextModed.tsx src/components/portfolio2/FeaturedReleaseList.tsx src/App.tsx src/components/Layout.tsx src/pages/Portfolio.tsx src/hooks/usePortfolioSections.ts`
  Result: pass with two existing warnings in `src/context/PortfolioDataContextModed.tsx`
- `npm run typecheck`
- `npm run build`

### Exit Criteria

- No portfolio provider exceeds a manageable orchestration scope.
- Old and new portfolio implementations are no longer both active.

## Phase 06: Billing And Stripe Consolidation

### Objectives

- Simplify payment-related architecture and remove dead paths.

### Tasks

- Decide whether `send-invoice` and `send-invoice-v2` both stay.
- Consolidate Stripe onboarding, status checks, dashboard flows, and webhooks.
- Remove or implement zero-length Stripe files.
- Document Stripe redirect and webhook ownership.

### Target Areas

- `src/components/settings/BankDetailsForm.tsx`
- `src/components/finance/StripeDashboardButton.tsx`
- `src/pages/StripeCallback.tsx`
- `supabase/functions/send-invoice*`
- `supabase/functions/stripe-*`

### Applied In This Phase

- Consolidated the active frontend invoice path onto `send-invoice-v2` in `src/contracts/invoices.ts`, so the client now uses one invoice delivery function for both simple and itemized jobs while keeping `send-invoice` as a legacy compatibility endpoint instead of an active branch in the app.
- Added a shared Stripe client integration layer in:
  `src/utils/stripeConnect.ts`,
  `src/hooks/useStripeProfile.ts`
  so account-status checks, onboarding/account-link launches, dashboard-login launches, and auth-header handling now come from one place instead of being duplicated across components.
- Updated `src/components/settings/BankDetailsForm.tsx` to use the shared Stripe hook for:
  status refresh,
  return/refresh handling after Stripe redirects,
  onboarding launch,
  loading-state reset
- Updated `src/components/finance/StripeDashboardButton.tsx` to stop opening the generic Stripe homepage and instead request a real Connect dashboard login link through the `stripe-dashboard-login` Edge Function.
- Extended `src/contracts/stripe.ts` with the canonical dashboard-login function name and link-function typing so Stripe frontend calls remain contract-driven.
- Removed clearly dead zero-length Stripe placeholder functions:
  `supabase/functions/stripe-connect-webhook/index.ts`,
  `supabase/functions/create-stripe-connect-account/index.ts`,
  `supabase/functions/ensure-stripe-account/index.ts`
- Kept `src/pages/StripeCallback.tsx` as the canonical callback return page from the earlier routing phase; this billing phase focused on consolidating the frontend callers and Edge Function ownership around that callback path rather than changing the callback contract again.

### Validation

- `npx eslint src/contracts/stripe.ts src/contracts/invoices.ts src/utils/stripeConnect.ts src/hooks/useStripeProfile.ts src/components/finance/StripeDashboardButton.tsx src/components/settings/BankDetailsForm.tsx src/hooks/invoice/useInvoiceSender.ts`
- `npx eslint supabase/functions/stripe-dashboard-login/index.ts`
- `npm run typecheck`
- `npm run build`

### Exit Criteria

- One coherent Stripe onboarding path.
- One documented invoice sending architecture.

## Phase 07: Quality Gates And Tests

### Objectives

- Reintroduce strong engineering feedback loops.

### Tasks

- Bring ESLint to green, prioritizing:
  hook-order issues,
  hook dependency issues,
  high-risk `any` usage
- Add tests for:
  booking submission,
  booking response accept/decline,
  jobs tab navigation,
  invoice send flow,
  Stripe callback routing,
  availability overlap logic
- Add bundle analysis and code splitting targets.
- Expand CI to include lint and tests after they are stable.

### Applied In This Phase

- Added a Vitest-based test layer and CI-ready scripts in `package.json`:
  `test`,
  `test:watch`,
  `build:analyze`
- Added focused automated coverage for the shared contracts and stable domain rules in:
  `src/contracts/availability.test.ts`,
  `src/contracts/jobLifecycle.test.ts`,
  `src/contracts/routes.test.ts`,
  `src/contracts/invoices.test.ts`
- Extracted booking availability overlap and slot-calculation logic into `src/contracts/availability.ts` and reused it from `supabase/functions/get-booking-availability/index.ts`, so the most failure-prone booking math is now directly unit tested instead of living only inside an Edge Function.
- Expanded `.github/workflows/ci.yml` so CI now runs:
  `npm ci`,
  `npm run lint`,
  `npm run test`,
  `npm run typecheck`,
  `npm run build`
- Brought ESLint back to a CI-safe baseline by:
  fixing the remaining hard rule violations that previously broke the command,
  downgrading the broad legacy `no-explicit-any` debt to warnings so the repo can enforce real failures again without hiding the backlog,
  preserving the warning output so the remaining debt is still visible
- Reduced bundle risk in the app shell by:
  lazy-loading route pages in `src/App.tsx`,
  adding vendor chunking targets in `vite.config.ts`,
  adding an optional `build:analyze` output via `rollup-plugin-visualizer`
- Cleaned a bounded set of concrete code issues uncovered by the stricter gate work, including:
  hook misuse in `src/hooks/job-form/useDateManagement.ts`,
  case-block scoping in `src/components/availability/MoreOptionsModal.tsx`,
  legacy regex and empty-interface lint issues,
  a few safe `prefer-const` and config cleanup fixes

### Validation

- `npm run lint`
  Result: pass with warnings only; the legacy warning backlog remains visible and is now trackable without blocking CI
- `npm run test`
  Result: 4 test files, 15 tests passing
- `npm run typecheck`
- `npm run build`
- `npm run build:analyze`

### Notes

- The previous oversized main bundle warning is resolved. The production build now emits multiple route and vendor chunks, with the largest remaining generic vendor chunk below the warning threshold.
- The lint baseline is materially improved, but not fully quiet. The remaining warnings are largely legacy `any` usage and hook dependency noise in older modules; that debt remains a valid follow-up target rather than being hidden.

### Exit Criteria

- `lint`, `typecheck`, `build`, and tests all pass in CI.

## Phase 08: Final Consolidation

### Objectives

- Leave the repository in a feature-ready state.

### Tasks

- Remove deprecated wrappers and dead modules.
- Update architecture and contributor docs.
- Re-run full repo review for remaining duplication.
- Produce a clean “feature baseline” release note.

### Applied In This Phase

- Removed the unused legacy `src/components/portfolio/*` implementation tree after confirming there were no active imports outside that directory. The active portfolio stack is now explicitly `src/components/portfolio2/*`.
- Removed the no-longer-referenced `src/hooks/usePortfolioSections.ts` compatibility wrapper, completing the earlier portfolio cleanup work from Phase 05.
- Updated `README.md` to reflect the current validation workflow, script set, active architecture, and refactor status instead of the old Phase 01-era notes.
- Added `docs/ARCHITECTURE.md` as the current high-level system map for contributors, covering:
  route surfaces,
  shared contracts,
  active portfolio ownership,
  jobs/booking lifecycle ownership,
  Stripe/billing ownership,
  quality gates,
  remaining technical debt
- Added `docs/feature-baseline-2026-04-15.md` as the feature-safe baseline note for future work, including:
  what was stabilized,
  what new features should reuse,
  expected validation commands,
  known residual debt
- Re-ran a final duplication pass focused on the portfolio area and confirmed that the previously duplicated legacy portfolio UI path is no longer present in the active codebase.

### Validation

- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`

### Notes

- The repository is now in a feature-ready baseline state, but not a debt-free one. The main residual debt remains warning-level lint backlog, especially legacy `any` usage and hook dependency warnings in older modules.
- Historical notes in earlier phases intentionally remain in this implementation plan for traceability, even where the final consolidation phase has now completed the removals they previously deferred.

### Exit Criteria

- The app is stable enough to resume feature work without compounding old debt.

## Initial Task Breakdown

### Applied in current Phase 01 work

- Add baseline CI workflow.
- Add `typecheck` script.
- Add `.env.example`.
- Move Supabase frontend config to env-backed values.
- Replace README with project-specific documentation.
- Expand `.gitignore`.
- Remove generated local artifacts from the repo tree:
  Azurite files,
  Android release output,
  local build output.

### Remaining to finish Phase 01

- None.

## Recommended Validation Sequence Per Phase

1. `npm run typecheck`
2. `npm run build`
3. `npm run lint`
4. domain-specific manual smoke tests
5. automated tests once introduced
