# Groove Flow Mobile App

Groove Flow is a React + Capacitor + Supabase application for music professionals. It combines:

- a private workspace for jobs, clients, availability, invoicing, finance, onboarding, and Stripe
- a public artist portfolio and booking experience
- Supabase Edge Functions for booking workflows, email delivery, invoicing, notifications, and Stripe callbacks

## Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Capacitor
- Supabase
- Stripe Connect
- Resend

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Environment

Create a local `.env` file from `.env.example`.

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

The frontend now reads Supabase config from environment variables instead of hardcoded values.

### Install

```bash
npm ci
```

### Run

```bash
npm run dev
```

### Validate

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Scripts

- `npm run dev`: start the Vite dev server
- `npm run build`: production build
- `npm run build:dev`: development-mode build
- `npm run build:analyze`: production build with bundle report output
- `npm run preview`: preview the production build
- `npm run lint`: run ESLint
- `npm run test`: run the Vitest suite
- `npm run test:watch`: run Vitest in watch mode
- `npm run typecheck`: run TypeScript checks for app and Vite/node config

## Project Structure

### Frontend

- `src/contracts`: shared route, lifecycle, booking, Stripe, invoice, and availability contracts
- `src/pages`: route-level screens
- `src/components`: UI and feature components
- `src/components/portfolio2`: active portfolio rendering and editing stack
- `src/context`: app-wide providers and portfolio data contexts
- `src/contexts`: smaller focused shared contexts
- `src/hooks`: feature and shared hooks
- `src/services`: Supabase CRUD helpers
- `src/integrations/supabase`: client and generated database types

### Backend

- `supabase/functions`: Edge Functions for Stripe, invoices, booking workflows, email, and notifications
- `supabase/migrations`: database schema and policy history

### Native

- `android/`: Android Capacitor project
- `ios/`: iOS Capacitor project

## Main Product Areas

- Authenticated workspace under `/app/*`
- Public portfolio under `/:handle`
- Public booking flow under `/:nickname/book`
- Quote acceptance / decline flow through `booking-response`
- Stripe onboarding and payment tracking through Supabase Edge Functions

## Refactor Status

The stabilization program is complete enough for feature work to resume on the current baseline.

Reference documents:

- [docs/app-analysis-2026-04-14.md](docs/app-analysis-2026-04-14.md)
- [docs/refactor-implementation-plan.md](docs/refactor-implementation-plan.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/feature-baseline-2026-04-15.md](docs/feature-baseline-2026-04-15.md)
- [docs/DEEP_LINKING.md](docs/DEEP_LINKING.md)

## Current Quality Notes

- `npm run lint` passes
- `npm run test` passes
- `npm run build` passes
- `npm run typecheck` passes
- CI runs lint, tests, typecheck, and build
- lint still emits a legacy warning backlog, mainly `any` and hook dependency cleanup debt

## Deployment Notes

### Web

Standard Vite build output is emitted to `dist/`.

### Supabase

Deploy Edge Functions with the Supabase CLI as needed, for example:

```bash
supabase functions deploy send-invoice-v2
supabase functions deploy stripe-oauth-connect
supabase functions deploy stripe-oauth-callback
supabase functions deploy stripe-webhook
supabase functions deploy booking-response
```

### Mobile

After frontend changes affecting native builds:

```bash
npx cap sync
```

Then build from Xcode / Android Studio or your CI pipeline.
