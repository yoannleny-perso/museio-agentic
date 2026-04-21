# Groove Flow Mobile App Analysis

Date: 2026-04-14

## Executive Summary

This application is a React + Capacitor mobile/web product for artists, DJs, or similar independent creatives. It combines:

- A private authenticated workspace for jobs, clients, availability, finance, onboarding, invoicing, and payout setup.
- A public portfolio/live page experience.
- A public booking request funnel that feeds into the artist's back office.
- A Supabase backend with database tables, authentication, storage, realtime, and 20 edge functions.
- Stripe Connect onboarding plus invoice/payment workflows.

At a product level, the app is ambitious and covers a lot of the right business workflows. At a codebase level, it is functional but carrying meaningful maintenance debt. The biggest concerns are route/deep-link inconsistencies, stale or duplicated architecture, a very large lint backlog, and one serious repository hygiene issue: an unused user dump CSV is committed under `src/types/20250627-users-dump.csv`.

## What The App Does

Main user-facing capabilities inferred from the code:

- Authentication via Supabase email/password and Google.
- Job management with statuses like `requested`, `drafted`, `upcoming`, `past`, `invoice-sent`, and `paid`.
- Client management backed by a `clients` table.
- Invoice generation and sending through Supabase edge functions, PDF generation, and email delivery.
- Stripe Connect onboarding and account status checks for payouts.
- Availability management with weekly schedules, overrides, and vacation periods.
- Public portfolio/live pages with editable sections, media, social links, featured cards, events, and music releases.
- Public booking requests that create `booking_requests`, notify the artist, and support quote/decline/accept flows.
- Push notification handling in the Capacitor app.

## Technical Shape

### Frontend

- Vite + React 18 + TypeScript.
- Tailwind + shadcn/Radix UI.
- Capacitor for iOS/Android shell behavior, keyboard handling, deep links, browser handoff, and push notifications.
- Heavy use of React Context for app state.
- Limited use of React Query despite a global `QueryClientProvider` in `src/App.tsx:78`.

### Backend

- Supabase client in `src/integrations/supabase/client.ts`.
- Database-driven domain model using tables such as `jobs`, `job_items`, `clients`, `profiles`, `booking_requests`, `sent_invoices`, `portfolio_settings`, `portfolio_photos`, `portfolio_videos`, `portfolio_events`, `portfolio_featured_cards`, `portfolio_music_releases`, `smart_links`, `user_availability`, `user_vacation_periods`, `user_onboarding`, and others.
- 20 edge functions under `supabase/functions`.
- 109 SQL migrations under `supabase/migrations`.

### State Management Pattern

The app currently mixes three patterns:

- Context providers for major domains like auth, profile, bank details, signature, jobs, onboarding, and portfolio.
- Custom hooks that encapsulate business logic and Supabase access.
- React Query used only in a small subset of features like finance/invoice data.

This works, but it makes the state model harder to reason about because there is no single dominant pattern.

## Strengths

- The product scope is thoughtful and clearly maps to a real freelancer/artist workflow.
- The booking response flow uses signed one-time links in `supabase/functions/booking-response/index.ts`, which is a solid pattern.
- The portfolio system is feature-rich and clearly intended to support both edit mode and public/live mode.
- Stripe onboarding, invoice generation, job management, and booking intake are all connected end to end.
- RLS appears to be part of the design, and there are multiple migrations setting jobs/profiles policies, which is the right security direction for a Supabase app.

## Key Findings

### 1. High: A user dump CSV is committed inside `src/`

`src/types/20250627-users-dump.csv` is a 39-line, 9.5 KB CSV and does not appear to be referenced anywhere in `src`. Based on the header and values surfaced during repo inspection, it looks like a real user export rather than seed data.

Why this matters:

- It is a privacy/compliance risk.
- It normalizes storing operational data inside the frontend source tree.
- It increases the chance of accidental shipping or redistribution.

Recommendation:

- Remove it from the app source immediately.
- Audit whether similar exports exist elsewhere.
- Treat the repository as potentially sensitive until confirmed otherwise.

### 2. High: Deep-link routing contracts are inconsistent and likely broken in production

There is a mismatch between router definitions, deep-link parsing, and Stripe callback return URLs.

Evidence:

- App router expects public booking pages at `/:nickname/book` in `src/App.tsx:94`.
- Deep-link handling sends booking links to `/book/:username` in `src/hooks/useDeepLinks.ts:124`, `src/hooks/useDeepLinks.ts:133`, and `src/hooks/useDeepLinks.ts:152`.
- Stripe callback tries to reopen the native app using `museio://app/jobs` in `src/pages/StripeCallback.tsx:20`.
- The custom scheme parser does not understand `app/jobs`; it switches on `url.pathname`, so `museio://app/jobs` falls into the default case and is treated like a booking route in `src/hooks/useDeepLinks.ts:130-137`.

Impact:

- Public booking deep links may land on the wrong route.
- Stripe success return on native likely reopens the app into an invalid booking path instead of jobs.
- Deep-link behavior becomes fragile and hard to test.

Recommendation:

- Define one canonical route contract for web, native scheme, universal links, and internal navigation.
- Reserve a namespace like `/u/:handle` or `/artist/:handle` for public pages and `/app/...` for private pages.
- Add route tests for booking links and Stripe return URLs.

### 3. High: Booking availability checks use obsolete job statuses

The public availability edge function blocks dates only for job statuses `confirmed`, `completed`, and `live` in `supabase/functions/get-booking-availability/index.ts:97-105`.

The app's job status enum is `requested`, `drafted`, `upcoming`, `past`, `invoice-sent`, `paid`, and `deleted` in `src/types/index.ts:38-45`.

Impact:

- Existing `upcoming`, `invoice-sent`, or `paid` jobs may not block public booking availability.
- This creates a real double-booking risk.

Recommendation:

- Align the availability function with the actual status model.
- Decide explicitly which statuses should block time.
- Add end-to-end tests around overlapping bookings, accepted quotes, and paid jobs.

### 4. High: Jobs tab state is not actually controlled by the URL/query state

The jobs page reads `?tab=` and push notifications navigate to `/app/jobs?tab=...`, but the tab UI uses `defaultValue` rather than a controlled `value`.

Evidence:

- URL tab parsing in `src/components/jobs/JobsPageWrapper.tsx:38-46`.
- Push navigation to `?tab=requests` or `?tab=paid` in `src/hooks/usePushNotifications.ts:95-105`.
- Tabs configured with `defaultValue={activeTab}` in `src/components/jobs/JobsTabs.tsx:53`.

Impact:

- Deep-linked tabs and push-notification navigation can silently fail to update the visible active tab after mount.

Recommendation:

- Make the tabs fully controlled with `value={activeTab}`.
- Treat the URL as the single source of truth for the jobs tab.

### 5. High: `JobsPageWrapper` violates the Rules of Hooks

`useJobsContext()` is called inside a `try/catch`, and `useLocation()` plus effects are declared after a possible early return in `src/components/jobs/JobsPageWrapper.tsx:17-49`.

This is also confirmed by lint output.

Impact:

- This can create unstable render behavior.
- Even if it seems to work now, it is not safe React code.

Recommendation:

- Remove the defensive `try/catch` around hook calls.
- Ensure all hooks run unconditionally and in the same order every render.

### 6. Medium: Public booking submission is client-side and appears to lack abuse controls

The public booking page inserts directly into `booking_requests` from the browser in `src/pages/BookingPage.tsx:295-297`, then separately invokes an email notification function in `src/pages/BookingPage.tsx:301-312`.

What is missing from the current visible implementation:

- Rate limiting.
- CAPTCHA or bot protection.
- Centralized server-side validation and abuse prevention.

Impact:

- Spam booking requests.
- Notification abuse.
- Poor auditability for public traffic.

Recommendation:

- Move public booking submission into a dedicated edge function.
- Add rate limiting, bot protection, and stricter validation there.

### 7. Medium: The codebase has significant duplication and dead/legacy layers

Examples:

- Two portfolio component trees: `src/components/portfolio` and `src/components/portfolio2` (12 files vs 45 files).
- Multiple portfolio contexts: `PortfolioDataContext`, `UsernamePortfolioDataContext`, and `PortfolioDataContextModed`.
- Auth exposed both through `src/context/AuthContext.tsx` and `src/context/auth/*`.
- Duplicate hook names and parallel implementations such as `useJobForm.ts` and `useJobForm.tsx`.
- Zero-length files: `src/utils/stripeConnect.ts`, `src/hooks/useStripeProfile.ts`, and `supabase/functions/stripe-connect-webhook/index.ts`.

Impact:

- Higher onboarding cost.
- More accidental regressions.
- Harder to know which modules are canonical.

Recommendation:

- Choose the active implementation for each domain and retire the rest.
- Consolidate around one portfolio stack and one auth/module structure.

### 8. Medium: Build works, but engineering quality gates are currently weak

Validation results from this review:

- `npm run build` succeeds.
- The production bundle contains a very large main chunk: `dist/assets/index-*.js` at about 2.18 MB minified.
- `npm run lint` fails with 352 errors and 63 warnings.
- `npm audit --omit=dev` reports 23 production vulnerabilities, including critical/high issues in `form-data`, `react-router`, `lodash`, `dompurify/jspdf`, and others.
- `package.json:6-11` has no test script, so there is no visible automated test entry point.

Impact:

- The app is harder to trust during refactors.
- CI would not be a reliable gate in its current state.
- Bundle size will hurt mobile/web startup performance.

Recommendation:

- Add `test` and `typecheck` scripts.
- Reduce lint debt in prioritized batches.
- Upgrade vulnerable packages, especially router and utility dependencies.
- Split the large bundle by route/domain.

### 9. Medium: Data refresh behavior is inconsistent and may feel stale

`useSupabaseJobs` says it refreshes every 30 seconds in `src/hooks/useSupabaseJobs.ts:240-244`, but non-forced fetches are skipped for 5 minutes in `src/hooks/useSupabaseJobs.ts:36-48`.

Impact:

- Developers may think job data is near-real-time when it is not.
- Background refresh behavior is hard to reason about.

Recommendation:

- Decide whether jobs are near-real-time, interval-refreshed, or mutation-driven.
- Make the implementation match the comments and product expectation.

### 10. Low/Medium: Onboarding completion logic does not match its own naming

`OnboardingContext` imports `invoiceSettings`, but `invoice_setup_completed` is computed only from signature presence in `src/context/OnboardingContext.tsx:69-72`.

Impact:

- Users may be marked as invoice-ready even when invoice configuration is incomplete.

Recommendation:

- Decide what "invoice setup completed" actually means.
- Encode that rule explicitly in one place.

## Structural Caveats

- The app depends heavily on Supabase RLS rather than explicit user filters in every query. That is acceptable, but it means the final security posture depends on migration correctness.
- The migrations folder is very large and churn-heavy. With 109 migrations and repeated policy resets, it is hard to reason about final schema/policy state without a generated schema snapshot or architecture notes.
- The root `README.md` is still mostly Lovable boilerplate rather than project-specific operational documentation.
- Repository hygiene can be improved: committed Azurite artifacts, Android release metadata, and unused files suggest the repo is carrying non-source noise.

## Recommended Next Steps

### Immediate

1. Remove the committed user dump CSV and review repository contents for similar leaks.
2. Fix the deep-link route contract, especially booking links and Stripe app return handling.
3. Fix booking availability status logic before trusting public booking intake.
4. Make jobs tabs controlled by state/URL and fix the hook-order issue in `JobsPageWrapper`.

### Near Term

1. Decide on one canonical portfolio architecture and remove legacy layers.
2. Move public booking submission behind an edge function with abuse protection.
3. Add route-level and workflow tests for:
   - booking request creation
   - quote accept/decline
   - Stripe callback return
   - invoice sending
   - availability blocking

### Engineering Health

1. Introduce `npm run typecheck` and `npm run test`.
2. Reduce lint debt by domain instead of trying to fix 352 errors at once.
3. Upgrade vulnerable dependencies starting with router/security-sensitive libraries.
4. Split the main bundle by feature route.

## Validation Performed

- Inspected the app router, page layer, context/providers, booking flow, Stripe flow, portfolio flow, and key edge functions.
- Reviewed database access patterns and table usage through frontend hooks and Supabase functions.
- Ran:
  - `npm ci`
  - `npm run build`
  - `npm run lint`
  - `npm audit --omit=dev`

## Final Verdict

This is a real product with useful business logic and a good feature vision, not a toy app. The biggest challenge is not missing functionality; it is consistency. Routing, state ownership, naming, and module boundaries are drifting apart. If those are cleaned up, the app has a solid foundation. If they are left alone, every new feature will become more expensive and riskier to ship.
