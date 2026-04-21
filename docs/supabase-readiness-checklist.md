# Supabase Readiness Checklist

This repo is now locally pointed at the current dev Supabase project:

- Project ref: `qsdfsycxaucxpbomjijg`
- Frontend URL env: `VITE_SUPABASE_URL`
- Frontend publishable key env: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase CLI config: `supabase/config.toml`

This document is the handoff for the moment you have admin access, or for anyone who can configure the hosted Supabase project on your behalf.
Anything about remote schema state, function deployment, or secrets should be re-verified after moving to a different project ref.

## Current Status For `qsdfsycxaucxpbomjijg`

- Local frontend config and the Supabase CLI ref now target this project.
- The repo migration filenames were normalized so the CLI can see the full migration history.
- Two SQL migrations that call the booking notification trigger now point at this project URL.
- Database schema, deployed Edge Functions, and project secrets still need to be confirmed against this environment.

### Expected Functions

- `booking-response`
- `get-booking-availability`
- `send-booking-notification`
- `send-booking-response`
- `send-email`
- `send-invoice`
- `send-invoice-reminders`
- `send-invoice-v2`
- `send-job-confirmation`
- `send-push-notification`
- `stripe-account-status`
- `stripe-create-account`
- `stripe-create-account-link`
- `stripe-dashboard-login`
- `stripe-oauth-callback`
- `stripe-oauth-connect`
- `stripe-webhook`

### Remaining Hard Blocker

The current repo does not contain a full greenfield bootstrap schema for a brand-new database.

The first migration already assumes existing tables such as `public.user_signatures`, so `supabase db push` fails against an empty project before the later schema migrations can complete.

This means one of these is still needed before the new Supabase project can be made fully app-ready:

- the original base schema SQL for the old project
- a full schema dump from a working project
- or a reconstructed initial migration that creates the pre-existing tables the later migration chain expects

## Already Ready In The Repo

- Local frontend config is wired to the new project in [`.env`](/Users/yoann/groove-flow-mobile-app-main/.env:1).
- The Supabase CLI project ref is set in [supabase/config.toml](/Users/yoann/groove-flow-mobile-app-main/supabase/config.toml:1).
- Auth troubleshooting links now follow the configured project id instead of the old hardcoded one.
- The app compiles with the new project ref in local config.

## What Still Requires Supabase Admin Access

These tasks must be done in the hosted Supabase project dashboard or via the Supabase CLI with admin access.

### 1. Confirm Core Project Settings

- Authentication providers are configured as expected.
- Site URL and redirect URLs include your dev and production callback URLs.
- Database schema and migrations are applied for this project.
- Storage buckets used by the app exist, especially `portfolio-images`.
- Edge Functions are deployed to this project.

### 2. Add Edge Function Secrets

Add these under:

- Supabase Dashboard -> `Edge Functions` -> `Secrets`

Do not create custom secrets starting with `SUPABASE_`. Hosted functions already receive the reserved Supabase variables automatically.

#### Required Third-Party / App Secrets

| Secret | Needed By | Why |
|---|---|---|
| `RESEND_API_KEY` | email functions | booking emails, invoice emails, reminders |
| `BOOKING_RESPONSE_SECRET` | booking response functions | signs secure accept/decline links |
| `STRIPE_SECRET_KEY` | Stripe functions | Connect, invoice payment links, webhook processing |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | verifies incoming Stripe webhook signatures |
| `STRIPE_CLIENT_ID` | `stripe-oauth-connect` | Stripe Connect OAuth flow |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `send-push-notification` | sends FCM push notifications |

#### Supabase-Provided Variables Used By Functions

These are read by the code and are expected to exist automatically in hosted Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

If an admin claims these must be manually added, confirm against Supabase’s hosted Edge Function defaults first before duplicating them.

## Function Secret Matrix

### Booking

- `supabase/functions/get-booking-availability/index.ts`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

- `supabase/functions/send-booking-notification/index.ts`
  - uses `RESEND_API_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

- `supabase/functions/send-booking-response/index.ts`
  - uses `RESEND_API_KEY`
  - uses `BOOKING_RESPONSE_SECRET`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

- `supabase/functions/booking-response/index.ts`
  - uses `RESEND_API_KEY`
  - uses `BOOKING_RESPONSE_SECRET`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

### Email / Invoices

- `supabase/functions/send-email/index.ts`
  - uses `RESEND_API_KEY`

- `supabase/functions/send-job-confirmation/index.ts`
  - uses `RESEND_API_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

- `supabase/functions/send-invoice/index.ts`
  - uses `RESEND_API_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/send-invoice-v2/index.ts`
  - uses `RESEND_API_KEY`
  - uses `STRIPE_SECRET_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/send-invoice-reminders/index.ts`
  - uses `RESEND_API_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

### Stripe

- `supabase/functions/stripe-create-account/index.ts`
  - uses `STRIPE_SECRET_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/stripe-create-account-link/index.ts`
  - uses `STRIPE_SECRET_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/stripe-dashboard-login/index.ts`
  - uses `STRIPE_SECRET_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/stripe-account-status/index.ts`
  - uses `STRIPE_SECRET_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/stripe-oauth-connect/index.ts`
  - uses `STRIPE_CLIENT_ID`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_ANON_KEY`

- `supabase/functions/stripe-oauth-callback/index.ts`
  - uses `STRIPE_SECRET_KEY`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

- `supabase/functions/stripe-webhook/index.ts`
  - uses `STRIPE_SECRET_KEY`
  - uses `STRIPE_WEBHOOK_SECRET`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

### Push Notifications

- `supabase/functions/send-push-notification/index.ts`
  - uses `FIREBASE_SERVICE_ACCOUNT_JSON`
  - uses `SUPABASE_URL`
  - uses `SUPABASE_SERVICE_ROLE_KEY`

## Recommended Admin Handoff Message

You can send this to the person who has admin access:

```text
Please prepare Supabase project qsdfsycxaucxpbomjijg for Groove Flow.

1. Confirm the database schema/migrations and required storage buckets are present.
2. Confirm auth Site URL and redirect URLs are configured.
3. Deploy the project Edge Functions.
4. Add these Edge Function secrets:
   - RESEND_API_KEY
   - BOOKING_RESPONSE_SECRET
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_CLIENT_ID
   - FIREBASE_SERVICE_ACCOUNT_JSON

Note: hosted Supabase Edge Functions already provide reserved vars like
SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.
```

## Ready-To-Test Milestones

### Frontend-only smoke testing

This can start once:

- the database schema exists
- auth is configured
- RLS/policies are compatible

This is enough to test:

- sign in
- jobs data loading
- portfolio rendering
- booking page rendering
- general CRUD paths that rely only on existing DB and policies

### Full end-to-end testing

This can start once the secrets above are present and functions are deployed.

This is needed to test:

- booking notification emails
- quote send / accept / decline links
- invoice send
- invoice reminders
- Stripe Connect onboarding
- Stripe webhook payment processing
- push notifications

## Suggested Next Step Once You Have Access

1. Add the missing Edge Function secrets.
2. Confirm deployed functions match this repo revision.
3. Run a smoke test for auth and data loading.
4. Run the booking + invoicing flows end to end.
