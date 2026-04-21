# Feature Baseline

Generated on 2026-04-15.

## Baseline Summary

The pre-feature refactor is complete enough to resume feature work on a stabilized base.

The repository now has:

- repo hygiene and env-driven frontend config
- shared route, status, Stripe, booking, and invoice contracts
- repaired jobs, booking, deep-link, and Stripe callback flows
- one active portfolio implementation path
- consolidated client-side Stripe integration
- working CI checks for lint, tests, typecheck, and build
- route-level code splitting and bundle analysis support

## What New Work Should Respect

- Build routes and deep links from `src/contracts/routes.ts`
- Reuse job and booking status definitions from `src/contracts/jobs.ts` and `src/contracts/booking.ts`
- Reuse lifecycle helpers from `src/contracts/jobLifecycle.ts`
- Keep invoice and Stripe client calls aligned with `src/contracts/invoices.ts` and `src/contracts/stripe.ts`
- Treat `src/components/portfolio2/*` as the active portfolio UI stack
- Avoid reintroducing direct string literals for route paths, statuses, or Edge Function names

## Validation Standard

Before merging feature work, run:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Use this when bundle size is relevant:

```bash
npm run build:analyze
```

## Known Follow-Up Debt

- Lint is green but not quiet; the main remaining debt is warning-level typing and hook dependency cleanup.
- Portfolio contexts still deserve deeper decomposition over time.
- A few legacy backend compatibility paths remain in place intentionally and should only be removed once migration risk is gone.

## Suggested Next Feature Discipline

- Prefer small feature slices that preserve the new contract layer.
- Add or extend focused Vitest coverage when touching route parsing, lifecycle logic, or other pure business rules.
- If a feature needs a new backend payload, define the shared contract first and then update the Edge Function and client together.
