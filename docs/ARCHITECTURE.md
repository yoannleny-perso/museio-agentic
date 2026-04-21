# Architecture

Updated on 2026-04-15.

## Purpose

Groove Flow is a React + Capacitor + Supabase app for music professionals. It combines:

- a private authenticated workspace under `/app/*`
- a public portfolio at `/:handle`
- a public booking flow at `/:nickname/book`
- Stripe Connect, invoice, email, and notification workflows through Supabase Edge Functions

## Runtime Surfaces

### Web and native shell

- `src/App.tsx` is the route shell and now lazy-loads page-level routes.
- Capacitor-specific behavior lives around the app shell, deep links, keyboard handling, and push notifications.

### Authenticated workspace

- Main route sections live under `/app/home`, `/app/jobs`, `/app/portfolio`, `/app/clients`, `/app/availability`, `/app/settings`, and `/app/finance`.
- Shared route construction and deep-link parsing come from `src/contracts/routes.ts`.

### Public portfolio and booking

- The active portfolio implementation is `src/components/portfolio2/*`.
- Public and edit modes are unified through `src/context/PortfolioDataContextModed.tsx`.
- Booking availability and booking responses rely on the shared contracts in `src/contracts`.

### Backend and integrations

- Supabase browser access lives under `src/integrations/supabase`.
- Edge Functions live under `supabase/functions`.
- Stripe client-side entry points are centralized in:
  `src/utils/stripeConnect.ts`,
  `src/hooks/useStripeProfile.ts`

## Frontend Layers

### Shared contracts

`src/contracts` is the source of truth for:

- route and deep-link formats
- job and booking statuses
- job lifecycle rules
- Stripe function contracts
- invoice payloads
- booking availability helpers

New feature work should start from this layer when changing route shapes or backend-facing payloads.

### Contexts

Contexts are still used heavily, but their ownership is cleaner than before:

- app/session concerns:
  auth, profile, onboarding, bank details, signature, app shell state
- jobs:
  route shell + jobs provider
- portfolio:
  authenticated provider for edit flows plus a moded provider that bridges edit/live usage

The portfolio contexts remain the largest structural hotspot in the app and should be extended carefully.

### Hooks and services

- `src/hooks` contains feature orchestration and reusable UI/data hooks.
- `src/services` holds lower-level CRUD helpers.
- Where possible, business rules should stay in contracts/helpers instead of being duplicated inside components.

## Active Domain Flows

### Jobs and booking lifecycle

- Canonical job status logic lives in `src/contracts/jobLifecycle.ts`.
- Booking availability uses shared overlap and slot-calculation helpers from `src/contracts/availability.ts`.
- Booking response and acceptance flows are enforced in Supabase Edge Functions rather than split between client and server writes.

### Billing and Stripe

- The active frontend invoice path targets `send-invoice-v2`.
- Stripe onboarding, account status, and dashboard launch behavior are funneled through shared helpers instead of being duplicated across screens.
- `src/pages/StripeCallback.tsx` is the canonical callback return page.

## Quality Baseline

Current engineering checks:

- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`
- CI runs the same validation set in `.github/workflows/ci.yml`

Bundle analysis is available with:

```bash
npm run build:analyze
```

## Known Remaining Debt

- ESLint still reports a large warning backlog, mostly legacy `any` usage and hook dependency warnings in older modules.
- Portfolio data contexts are still oversized and mix orchestration with data mutation responsibilities.
- Some compatibility paths remain intentionally preserved, including legacy server endpoints that are no longer the active frontend path.
- Edge Functions still contain older typing debt that should be reduced incrementally instead of through a single broad rewrite.
