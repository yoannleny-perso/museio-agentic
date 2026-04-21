# Bugs Fixing Plan

Deep audits completed on 2026-04-15 and 2026-04-16 across the web app, mobile/native integration layer, and Supabase Edge Functions.

This is a code-level audit, not a live QA session. Every item below was selected because it is either:

- a confirmed bug with a clear failure mode in the current codebase, or
- a high-risk implementation flaw that can easily create production bugs during normal usage.

The goal for tomorrow should be to fix the `P0` items first, then close the `P1` user-facing issues, then finish the `P2/P3` hardening and cleanup work.

## Deployment Readiness Plan (2026-04-16)

This section is the go-live remediation layer on top of the bug backlog below. The older `BF-*` items still stand; this section turns them into a phased launch plan with explicit deployment gates.

### Public Launch Recommendation

- Status today: `No-go for public production launch`
- Safe today: internal QA, staging smoke tests, simulator/native QA, and restricted dev-environment demos
- Unsafe today: public launch with live payments, public booking flows, or unattended email/payment side effects

The primary blockers are:

- privileged Edge Functions that still need real authorization and ownership checks
- non-transactional booking, invoice, and payment flows
- missing production headers, rate limits, and CORS tightening
- insufficient production observability and replay protection

### Current Gate Status

- `Pass`: `npm run typecheck`
- `Pass`: `npm run test` (`5` files / `20` tests during audit)
- `Pass`: `npm run build`
- `Pass`: `npm audit --omit=dev` (`0` production dependency vulnerabilities during audit)
- `Fail`: `npm run lint`
- Known lint blocker:
  - `src/context/PortfolioDataContextModed.tsx:355`
- Known deployment gaps:
  - no git metadata available in this workspace, so commit history / branch protection / secret exposure history could not be audited
  - CI currently covers lint, unit tests, typecheck, and build, but not E2E, security scanning, or deployment smoke checks
  - build output still contains heavy feature chunks, especially charts and PDF generation code

### P0 This Week: Must Close Before Any Public Launch

#### DR-01: Lock down privileged Edge Functions

- Priority: `P0`
- Why this is blocking:
  - multiple functions run with service-role privileges but trust caller-supplied ids or payload fields
  - a valid project JWT is not enough; each function must still verify user ownership of the target resource
- Files to harden first:
  - `supabase/functions/send-job-confirmation/index.ts`
  - `supabase/functions/send-booking-response/index.ts`
  - `supabase/functions/send-email/index.ts`
  - `supabase/functions/send-invoice-v2/index.ts`
  - `supabase/functions/booking-response/index.ts`
- Required actions:
  - verify the caller with the anon client and `auth.getUser()`
  - compare authenticated user id to the resource owner before any privileged read/write
  - reject cross-user `jobId`, `bookingRequestId`, `invoiceId`, and `userId` payloads with `403`
  - restrict wildcard CORS on internal/authenticated functions to known app origins
- Validation:
  - attempt authenticated cross-user requests in staging and confirm `403`
  - confirm normal same-user requests still succeed

#### DR-02: Harden the public booking intake path

- Priority: `P0`
- Why this is blocking:
  - the public booking endpoint currently accepts more trust from the client than it should
  - public abuse controls are still missing
- Files:
  - `supabase/functions/submit-booking-request/index.ts`
  - `src/contracts/booking.ts`
  - public booking UI that submits into this flow
- Required actions:
  - schema-validate the full payload, not just required field presence
  - force `status = pending` server-side regardless of submitted value
  - add length limits and normalization for free-text fields
  - add rate limiting by IP + email + portfolio owner
  - add bot protection such as Turnstile/reCAPTCHA before public launch
  - add request id logging without storing raw abusive payloads
- Validation:
  - fuzz invalid payloads
  - replay rapid duplicate submissions
  - confirm status cannot be mass-assigned from the client

#### DR-03: Make booking, invoice, and job writes transactional

- Priority: `P0`
- Why this is blocking:
  - core money and acceptance flows can still partially succeed and leave broken state behind
- Existing backlog items already covering this:
  - `BF-02`
  - `BF-03`
  - `BF-05`
  - `BF-06`
- Files to treat as one launch stream:
  - `supabase/functions/booking-response/index.ts`
  - `supabase/functions/send-booking-response/index.ts`
  - `supabase/functions/send-invoice-v2/index.ts`
  - `src/services/jobService.ts`
- Required actions:
  - move job creation + item creation + booking status change into one backend transaction
  - ensure invoice persistence is durable before outbound invoice email delivery
  - stop returning success from the client service when `job_items` operations fail
  - introduce explicit lifecycle states where needed such as `draft`, `sending`, `sent`, `delivery_failed`
- Validation:
  - induce failures at each step and confirm rollback or recoverable intermediate state
  - verify the UI never reports success on partial failure

#### DR-04: Add durable Stripe idempotency and side-effect protection

- Priority: `P0`
- Why this is blocking:
  - Stripe webhook replay or dual-event processing can still duplicate receipts, paid transitions, or push notifications
- Existing backlog item already covering this:
  - `BF-04`
- Files:
  - `supabase/functions/stripe-webhook/index.ts`
  - payment/invoice tables used by the webhook flow
- Required actions:
  - create a durable processed-event table keyed by `event.id`
  - also dedupe on `payment_intent`
  - choose one canonical payment-complete event for downstream side effects
  - make email/push triggers conditional on first-time transition only
- Validation:
  - replay the same webhook payload multiple times
  - replay both `checkout.session.completed` and `payment_intent.succeeded`
  - confirm exactly one paid transition and one outward notification sequence

#### DR-05: Remove sensitive auth and token exposure

- Priority: `P0`
- Why this is blocking:
  - callback debug details and token-like data are still too exposed for a production launch
- Existing backlog items already covering this:
  - `BF-11`
  - `BF-12`
- Files:
  - `src/integrations/supabase/client.ts`
  - `src/hooks/useAuthCallback.ts`
  - `src/components/auth/TroubleshootingInfo.tsx`
  - `src/hooks/usePushNotifications.ts`
- Required actions:
  - immediately remove raw callback `url`, `hash`, and `search` from user-visible troubleshooting
  - remove device token logging entirely
  - stop logging full auth or notification payloads in normal runtime paths
  - prepare the auth client for PKCE migration
- Validation:
  - trigger auth failure and confirm only sanitized details are shown
  - register push notifications and confirm no token reaches the console

#### DR-06: Add production headers, origin controls, and public abuse protection

- Priority: `P0`
- Why this is blocking:
  - the web deployment currently lacks baseline browser hardening and public entry-point throttling
- Files:
  - `vercel.json`
  - shared CORS helpers inside Edge Functions
  - any hosting/WAF configuration used in front of the app
- Required actions:
  - add `Content-Security-Policy`
  - add `Strict-Transport-Security`
  - add `X-Content-Type-Options`
  - add `Referrer-Policy`
  - add `Permissions-Policy`
  - set `frame-ancestors 'none'` unless a trusted embed use case exists
  - replace `Access-Control-Allow-Origin: *` for internal functions with known origins
  - put rate limits in front of public booking and auth-sensitive endpoints
- Validation:
  - run staged checks against the deployed headers
  - confirm public flows still work under the stricter policy

#### DR-07: Put a minimum viable production observability stack in place

- Priority: `P0`
- Why this is blocking:
  - silent runtime and function failures are still too easy to miss
- Status update:
  - first pass completed on `2026-04-16`
  - client monitoring is wired through Sentry bootstrap, React error boundary capture, React Query async error capture, and auth user context
  - critical Supabase functions now emit request IDs and structured logs, and can forward fatal errors to an optional alert webhook
  - remaining gap is broader server-side log aggregation / alert routing across every function, not just the highest-risk ones
- Files:
  - `src/App.tsx`
  - client logger/error-boundary layer
  - Supabase function runtime logging
  - deployment/monitoring configuration
- Required actions:
  - add a global React error boundary
  - add client and native crash/error reporting such as Sentry
  - add Supabase function alerting or log-drain monitoring
  - attach request ids to critical booking/invoice/payment logs
  - define alert thresholds for payment failures, booking failures, and auth callback failures
- Validation:
  - fire a controlled client error and function error in staging
  - confirm alerting and captured context show up in the monitoring stack

### P1 Before Beta: Close Structural And Operational Risk

#### DR-08: Complete the Supabase auth migration to PKCE

- Priority: `P1`
- Why this matters:
  - implicit flow plus `localStorage` is a weaker browser-session posture than PKCE
- Files:
  - `src/integrations/supabase/client.ts`
  - auth callback/login components and hooks
- Required actions:
  - move from `implicit` to `pkce`
  - retest email/password, Google OAuth, and callback flows on web and native
  - keep callback troubleshooting sanitized after the migration
- Validation:
  - confirm login, logout, refresh, and callback recovery flows work with PKCE on all supported surfaces

#### DR-09: Simplify auth/session/native lifecycle handling

- Priority: `P1`
- Existing backlog item already covering this:
  - `BF-09`
- Files:
  - `src/context/auth/AuthProvider.tsx`
  - `src/components/CapacitorAppStateManager.tsx`
- Required actions:
  - reduce effect churn and re-subscription complexity in auth state handling
  - make native resume listeners deterministic across login/logout cycles
  - document the intended lifecycle so future changes do not reintroduce drift
- Validation:
  - perform repeated login/logout/background/resume scenarios on simulator and device

#### DR-10: Replace mock calendar connectivity with a real feature flag or real integration

- Priority: `P1`
- Why this matters:
  - the UI currently implies real external calendar syncing even though the current state is local-only
- Files:
  - `src/hooks/useConnectedCalendarsState.ts`
  - availability UI surfaces that advertise connected calendars
- Required actions:
  - either hide/flag the feature until a backend contract exists
  - or complete a real sync backend with secure token storage and refresh handling
- Validation:
  - confirm users cannot mistake a mock/local-only connector for a live integration

#### DR-11: Reduce production log noise and adopt a logger policy

- Priority: `P1`
- Existing backlog items already covering this:
  - `BF-13`
  - `BF-14`
- Required actions:
  - define a small logger utility with production gating
  - ban PII, tokens, raw auth callback data, and repeated happy-path spam
  - remove remaining ad hoc console noise from booking, invoicing, auth, push, and job flows first
- Validation:
  - run critical flows and confirm logs are sparse, structured, and safe

#### DR-12: Close the current CI gaps

- Priority: `P1`
- Why this matters:
  - the current pipeline is useful but not enough for launch confidence
- Files:
  - `.github/workflows/ci.yml`
  - any future Playwright / webhook replay / security scan workflows
- Required actions:
  - fix the current lint failure before treating CI as a launch gate
  - add secret scanning
  - add dependency review / CodeQL or equivalent static analysis
  - add E2E smoke coverage for auth, booking, jobs, invoice send, and payment confirmation
  - add a staging deploy smoke check if the hosting platform supports it
- Validation:
  - all required CI jobs green on the release branch

#### DR-13: Improve mobile/web performance posture before beta

- Priority: `P1`
- Why this matters:
  - oversized feature bundles and unstable heavy flows can still hurt lower-end devices
- Files:
  - build output hotspots such as charting and PDF code paths
  - any route/component boundaries that can be lazily loaded
- Required actions:
  - split heavy charts/PDF features more aggressively
  - pin Deno imports instead of using `@latest`
  - profile image/PDF-heavy flows on a lower-end simulator/device
- Validation:
  - compare route bundle sizes before/after
  - test launch and feature entry time on a real low-end mobile target if possible

### P2 Hardening After Launch: Raise The Long-Term Safety Floor

#### DR-14: Move side effects onto an outbox/retry architecture

- Priority: `P2`
- Why this matters:
  - email and push side effects should become durable, replayable, and observable instead of happening inline in request paths
- Targets:
  - booking emails
  - invoice emails
  - receipts
  - push notifications
- Goal:
  - an outbox table plus worker/retry flow with idempotent delivery keys

#### DR-15: Evaluate a stronger session model for web

- Priority: `P2`
- Why this matters:
  - if the product grows into a higher-risk production footprint, a BFF/httpOnly-cookie session posture may be worth the complexity over browser-managed token storage
- Goal:
  - architecture decision record comparing Supabase SPA auth vs BFF session mediation

#### DR-16: Add reliability drills and replay testing

- Priority: `P2`
- Why this matters:
  - deployment confidence improves once the team can rehearse failures instead of only reacting to them
- Goal:
  - Stripe replay drills
  - email-provider outage drills
  - booking acceptance duplicate-click drills
  - staged rollback exercises

### Release Exit Criteria

Public launch should stay blocked until every item below is true:

- all `P0` items in this section are complete
- `BF-01` through `BF-06` are complete
- sensitive auth/token exposure cleanup is complete
- CI is green for lint, typecheck, unit tests, build, and release smoke checks
- staged booking, invoicing, payment, auth, and native resume tests pass end-to-end
- production headers and CORS policies are in place and verified
- monitoring, alerting, and crash reporting are live
- rollback instructions for the release are documented

### Recommended Execution Sequence

1. Start with `DR-01` through `DR-04`, because access control and transactional money flows are the highest-risk production issues.
2. In parallel, close `DR-05` and `DR-06`, because auth/token exposure and missing browser hardening are relatively fast compared with transactional rewrites.
3. Land `DR-07` before the first release candidate so failures are observable while the higher-risk fixes are being tested.
4. After `P0` is closed, take `DR-08` through `DR-13` as the beta-hardening sprint.
5. Keep `DR-14` through `DR-16` as the first post-launch reliability program, not as “nice to have” backlog.

## Tomorrow's Execution Order

1. Fix booking, invoicing, and payment flows that can leave the database in a partial or duplicated state.
2. Fix broken navigation and modal-state bugs that affect daily app use.
3. Remove sensitive or noisy debug behavior from auth, notifications, and production flows.
4. Clean the remaining dead/duplicate modules and align UI components to the correct data sources.
5. Re-run end-to-end regression checks on booking, jobs, invoicing, auth, and native resume flows.

## P0: Data Integrity And Payment Flow Bugs

### BF-01: Booking notification email links to an invalid app URL

- Severity: `P0`
- Why it matters: new booking request emails can send artists to a broken or wrong domain, which breaks the primary notification CTA.
- Evidence:
  - `supabase/functions/send-booking-notification/index.ts:163`
  - The CTA uses `SUPABASE_URL?.replace('https://', 'https://app.')}/jobs`, which is not a reliable app URL strategy.
- Fix actions:
  - Introduce a dedicated app URL env var such as `APP_URL`.
  - Build the jobs link from that env var and a shared route helper.
  - Add a safe fallback if the env var is missing.
- Validation:
  - Send a test booking notification email in staging.
  - Confirm the CTA opens the real jobs page on web and matches the expected domain.

### BF-02: `send-booking-response` updates booking status before email delivery succeeds

- Severity: `P0`
- Why it matters: a quote or decline can be persisted even when the client never receives the email.
- Evidence:
  - `supabase/functions/send-booking-response/index.ts:211-224`
  - `supabase/functions/send-booking-response/index.ts:228-236`
  - `supabase/functions/send-booking-response/index.ts:267-273`
- Fix actions:
  - Refactor the function so persistence and outbound email are coordinated.
  - Choose one of these patterns and apply it consistently:
  - write a durable outbound-email record first, then send asynchronously
  - or only update status after email delivery succeeds
  - or use a compensating rollback if email delivery fails
  - Add explicit response states for `quoted_pending_delivery` / `declined_pending_delivery` if needed.
- Validation:
  - Simulate Resend failure and verify booking status does not silently move to final state.
  - Verify success flow still updates status and sends exactly one email.

### BF-03: Booking acceptance flow is non-transactional and can create orphaned jobs

- Severity: `P0`
- Why it matters: a job can be inserted while the booking request remains unaccepted, or job items can fail while the accept action still completes.
- Evidence:
  - `supabase/functions/booking-response/index.ts:280-307`
  - `supabase/functions/booking-response/index.ts:324-365`
  - `supabase/functions/booking-response/index.ts:367-370`
- Fix actions:
  - Move accept logic into a single transactional unit on the backend.
  - Ensure these writes succeed or fail together:
  - create job
  - create default job item
  - update booking request status
  - add idempotency checks around the whole acceptance pipeline, not only job creation.
  - Return a structured failure result when a partial step fails.
- Validation:
  - Force a failure during job item insertion and confirm no accepted booking is left without a valid job payload.
  - Click the accept link twice and confirm the endpoint is idempotent.

### BF-04: Stripe webhook likely processes the same payment twice

- Severity: `P0`
- Why it matters: the same successful payment can trigger duplicate status updates, duplicate emails, and duplicate push notifications.
- Evidence:
  - `supabase/functions/stripe-webhook/index.ts:368-490`
  - `supabase/functions/stripe-webhook/index.ts:493-575`
  - Both `checkout.session.completed` and `payment_intent.succeeded` update the same records and trigger side effects.
- Fix actions:
  - Define a single canonical Stripe event for marking invoice payments as completed.
  - Add a durable idempotency guard keyed by Stripe event id and payment intent id.
  - Skip side effects when `invoice_payments.status` or `sent_invoices.status` is already `paid`.
  - Prevent duplicate payment confirmation emails, receipts, and push notifications.
- Validation:
  - Replay both webhook events for the same payment in staging.
  - Confirm only one paid transition, one confirmation email, one client receipt, and one push notification occur.

### BF-05: `send-invoice-v2` emails invoices before the invoice is durably recorded

- Severity: `P0`
- Why it matters: a customer can receive an invoice that does not exist in `sent_invoices`, which breaks reminders, payment lookup, and auditability.
- Evidence:
  - `supabase/functions/send-invoice-v2/index.ts:1256-1278`
  - `supabase/functions/send-invoice-v2/index.ts:1280-1323`
- Fix actions:
  - Reverse the order so the invoice record exists before email delivery, or introduce a draft/sending/sent lifecycle.
  - Fail the request if the persistence step fails.
  - Link `invoice_payments` only after the invoice row is guaranteed to exist.
  - Add retry-safe behavior for email delivery.
- Validation:
  - Force DB insert failure and confirm no invoice email is sent.
  - Force email failure and confirm invoice status remains recoverable, not silently `sent`.

### BF-06: Job creation and job item writes are still non-atomic in the frontend service layer

- Severity: `P0`
- Why it matters: the app can create jobs with missing or stale itemized pricing data.
- Evidence:
  - `src/services/jobService.ts:72-140`
  - `src/services/jobService.ts:149-169`
- Fix actions:
  - Move job + job_items writes into a single backend RPC or Edge Function.
  - Stop returning success when item creation/update fails.
  - Ensure update flows replace item rows safely and report failure to the UI.
- Validation:
  - Force `job_items` failure and confirm the UI surfaces an error instead of silently keeping a partial job.
  - Test create, edit, remove, and reorder flows for itemized jobs.

## P1: User-Facing Runtime And UX Bugs

### BF-07: Jobs screen likely mounts detail and edit flows on the same selected job

- Severity: `P1`
- Why it matters: clicking a job can lead to overlapping modal ownership, stale state, or edit UI appearing at the wrong time.
- Evidence:
  - `src/context/JobsContext.tsx:110-113`
  - `src/components/jobs/JobsContainer.tsx:177-183`
  - `src/components/jobs/JobsContainer.tsx:209-214`
- Fix actions:
  - Separate `selectedJobForDetails` from `selectedJobForEdit`, or use a single explicit view state machine.
  - Ensure `EditJobForm` only mounts when edit mode is requested.
  - Remove any coupling where `isDetailsOpen` also drives edit rendering.
- Validation:
  - Click a job card, open details, open edit, close edit, and close details.
  - Verify only one modal/dialog path is active at a time.

### BF-08: Finance widget calculates pending and overdue totals from `jobs.date` instead of actual invoice data

- Severity: `P1`
- Why it matters: dashboard earnings can be materially wrong, especially when an invoice is sent days or weeks after the event date.
- Evidence:
  - `src/components/finance/InvoiceStatusWidget.tsx:92-103`
  - `src/hooks/useInvoiceData.ts:83-127`
- Fix actions:
  - Replace the widget’s local overdue math with the existing `useInvoiceData` query.
  - Drive paid/pending/overdue states from `sent_invoices.sent_at` and `sent_invoices.status`.
  - Remove duplicated finance calculation logic from the component.
- Validation:
  - Compare the widget against raw `sent_invoices` rows for a sample account.
  - Test invoices sent after the job date and confirm pending/overdue buckets are correct.

### BF-09: Capacitor resume listener is not safely re-registered after auth lifecycle changes

- Severity: `P1`
- Why it matters: after logout/login or user-state transitions, the app may stop refreshing session/data on resume.
- Evidence:
  - `src/components/CapacitorAppStateManager.tsx:26`
  - `src/components/CapacitorAppStateManager.tsx:31-37`
  - `src/components/CapacitorAppStateManager.tsx:109-116`
- Fix actions:
  - Remove the `hasSetUpRef` shortcut or reset it properly on cleanup/logout.
  - Tie listener lifecycle directly to authenticated user state.
  - Confirm push registration and app resume handling do not drift apart.
- Validation:
  - Test native login, background/resume, logout, second login, background/resume.
  - Confirm resume refresh still runs after the second login.

### BF-10: Portfolio still ships placeholder `alert()` behavior in Book Me and section actions

- Severity: `P1`
- Why it matters: blocking browser alerts are still visible in product flows and create an unfinished experience.
- Evidence:
  - `src/components/portfolio2/BookMeSection.tsx:34-38`
  - `src/components/portfolio2/DynamicSection.tsx:110-114`
- Fix actions:
  - Replace `alert()` with a non-blocking toast or disable unavailable actions in edit mode.
  - For the Book Me section, decide whether edit mode should open a settings panel or simply do nothing.
  - For unimplemented actions, render disabled controls with explanatory copy instead of firing alerts.
- Validation:
  - Click these actions in both edit and live portfolio modes.
  - Confirm no blocking browser alert appears.

## P2: Security, Privacy, And Logging Bugs

### BF-11: Auth troubleshooting UI exposes full callback debug data

- Severity: `P2`
- Why it matters: full callback URLs, hashes, and query params can contain sensitive auth flow details and should not be rendered directly to end users.
- Evidence:
  - `src/hooks/useAuthCallback.ts:39-46`
  - `src/components/auth/TroubleshootingInfo.tsx:46-50`
  - `src/hooks/useAuthPage.ts:27-33`
- Fix actions:
  - Remove raw `url`, `hash`, and `search` from user-visible debug payloads.
  - Keep only sanitized error codes/messages.
  - Strip the extra auth debug logs from the normal sign-in flow.
- Validation:
  - Trigger an auth error and confirm the UI shows safe troubleshooting details only.
  - Confirm the browser console no longer prints full auth callback URLs in normal use.

### BF-12: Push notification flow logs the FCM token

- Severity: `P2`
- Why it matters: device tokens are sensitive identifiers and should not be printed into production logs.
- Evidence:
  - `src/hooks/usePushNotifications.ts:43`
  - `src/hooks/usePushNotifications.ts:66`
- Fix actions:
  - Remove token logging entirely, including partial-token logs.
  - Keep only high-level success/failure logs.
  - Audit backend push functions for similar token exposure.
- Validation:
  - Register push notifications on a native build.
  - Confirm no device token appears in the console.

### BF-13: Production logging footprint is still very high and leaks internal flow details

- Severity: `P2`
- Why it matters: the codebase still contains roughly 1,088 `console.*` calls across client and function code, which raises noise, privacy, and observability quality issues.
- Evidence:
  - `rg -n "console\\.log\\(|console\\.error\\(|console\\.warn\\(" src supabase/functions -S | wc -l`
  - Result during audit: `1088`
- Fix actions:
  - Create a logging policy:
  - no PII in logs
  - no auth URL/hash logging
  - no token logging
  - no repeated happy-path console noise in production
  - Replace ad hoc logging with a small logger utility that can be gated by environment.
  - Prioritize cleanup in booking, invoicing, auth, push, and job services first.
- Validation:
  - Run the critical flows and confirm the console stays low-noise.
  - Spot-check that no personal data or secrets are printed.

### BF-14: `useSupabaseErrorHandler` monkey-patches `console.error`

- Severity: `P2`
- Why it matters: globally overriding `console.error` is fragile and can create hard-to-debug side effects if the hook is mounted.
- Evidence:
  - `src/hooks/useSupabaseErrorHandler.ts:82-105`
  - Audit search found no current usage, which suggests this is dead but risky code.
- Fix actions:
  - Remove the hook if it is truly unused.
  - If error interception is still wanted, replace it with explicit error boundaries or query/mutation wrappers.
- Validation:
  - Confirm no imports remain.
  - Confirm Supabase errors still surface correctly via normal app flows.

## P3: Structural Cleanup And Regression Tasks

### BF-15: Duplicate `useJobForm` modules create import ambiguity and maintenance risk

- Severity: `P3`
- Why it matters: both `src/hooks/useJobForm.ts` and `src/hooks/useJobForm.tsx` exist with different logic, which is a trap for future imports and refactors.
- Evidence:
  - `src/hooks/useJobForm.ts`
  - `src/hooks/useJobForm.tsx`
  - Current imports resolve to `useJobForm.ts`, leaving the `.tsx` variant as confusing legacy code.
- Fix actions:
  - Delete the dead duplicate after confirming nothing imports it.
  - Keep one canonical job-form hook only.
  - Add a short comment or doc note if the hook recently changed behavior.
- Validation:
  - Search imports again after cleanup.
  - Run typecheck and create/edit job flows.

### BF-16: Legacy invoice function path should be retired or quarantined

- Severity: `P3`
- Why it matters: the repo still ships both `send-invoice` and `send-invoice-v2`, while product logic has already converged on v2. Keeping both increases drift risk.
- Evidence:
  - `src/contracts/invoices.ts:1-5`
  - `supabase/functions/send-invoice/index.ts`
  - `supabase/functions/send-invoice-v2/index.ts`
- Fix actions:
  - Confirm no runtime path still relies on the legacy function.
  - Remove it or mark it clearly deprecated and out of service.
  - Keep tests and docs aligned to one canonical invoice-send flow.
- Validation:
  - Search the codebase for remaining legacy references.
  - Send both simple and itemized invoices after cleanup.

### BF-17: Run a focused regression pass on recently fixed booking and availability logic

- Severity: `P3`
- Why it matters: several critical fixes landed recently around overnight bookings, availability blocking, and portfolio date normalization; they should be regression-tested before new feature work resumes.
- Areas to re-test:
  - overnight public bookings
  - multi-day availability blocking
  - quote -> accept -> job creation flow
  - booking request cards and email date ranges
  - portfolio event create/edit from both event editors
- Validation:
  - Manual staging pass plus existing automated checks:
  - `npm run lint`
  - `npm run test`
  - `npm run typecheck`
  - `npm run build`

## Suggested Tomorrow Schedule

### Morning block

1. BF-04 Stripe webhook idempotency
2. BF-05 invoice persistence ordering
3. BF-03 booking acceptance transactionality
4. BF-02 booking response email/status ordering

### Midday block

1. BF-06 job + job_items atomic writes
2. BF-01 booking notification CTA URL
3. BF-08 finance widget source-of-truth cleanup
4. BF-07 jobs modal state cleanup

### Afternoon block

1. BF-09 Capacitor resume listener
2. BF-11 auth debug sanitization
3. BF-12 push token logging removal
4. BF-10 placeholder alert removal
5. BF-14 and BF-15 cleanup

### End-of-day regression pass

1. Run the full validation commands.
2. Manually test booking, quote/accept, invoice send, Stripe payment, auth callback, and native resume.
3. Update `docs/refactor-implementation-plan.md` with the closed bug items and any newly discovered regressions.

## Definition Of Done For Tomorrow

- No payment flow can double-process a successful invoice payment.
- No booking or invoice flow can report success while leaving the database in a partial state.
- No broken booking CTA links remain in outbound email.
- Jobs details/edit dialogs have a single clear ownership path.
- Finance totals are based on actual invoice records, not job-date approximations.
- No auth callback URL, device token, or similar sensitive data is printed or rendered.
- Placeholder alerts and dead duplicate modules are removed.
- Full validation passes after the fixes.
