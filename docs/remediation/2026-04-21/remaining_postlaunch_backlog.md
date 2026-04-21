# Remaining Postlaunch Backlog

Date: 2026-04-21

Only items considered safe to defer are listed here.

## High-value follow-up

### 1. Real external calendar sync

- Replace the currently disabled placeholder flow with a real server-backed Google/Calendly integration.
- Keep the feature disabled until the server-side contract exists.

### 2. Automated critical-flow smoke coverage

- Add automated smoke or E2E coverage for:
  - sign in
  - submit booking request
  - accept booking request
  - decline booking request
  - send invoice
  - Stripe payment + webhook completion

### 3. Bundle reduction

- Further split `pdf-vendor`
- Further split `charts-vendor`
- Isolate report/export code from broad route bundles

## Maintainability follow-up

- Break down `Availability.tsx`
- Break down `Finance.tsx`
- Break down `send-invoice-v2/index.ts`
- Break down `stripe-webhook/index.ts`

## UI/design system follow-up

- Consolidate typography tokens
- Replace more raw page-level colors with semantic tokens
- Normalize bespoke layouts in Portfolio, Finance, and Availability
- Continue improving contrast and image-over-text heuristics in portfolio hero surfaces

## Observability follow-up

- Finish production Sentry configuration
- Add deploy-time or postdeploy synthetic smoke checks
- Expand backend structured logging consistency further where useful

## Data/product follow-up

- Revisit finance behaviors that remain device-local if the intended product behavior is account-backed
- Continue reviewing storage cleanup paths for any remaining media domains outside portrait/gallery handling
