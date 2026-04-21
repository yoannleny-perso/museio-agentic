# Deployment and Runtime Hardening Log

Date: 2026-04-21

## Goals addressed

- make CI/local validation green
- improve release-time environment clarity
- add runtime verification and readiness surfaces
- reduce deployment ambiguity before launch

## Changes implemented

### Lint/CI green-up

Files:
- `eslint.config.js`
- `src/context/PortfolioDataContextModed.tsx`
- `supabase/functions/stripe-webhook/index.ts`

What changed:
- Excluded generated iOS build output from lint.
- Fixed live source lint issues.

Why:
- The audit flagged red CI as a launch blocker.

### Environment documentation expansion

Files:
- `.env.example`

What changed:
- Added or clarified env vars for:
  - app/site URLs
  - allowed origins
  - booking-response secret
  - booking abuse salt
  - Resend
  - Stripe
  - Firebase service account JSON
  - Sentry

Why:
- Launch env setup was previously incomplete and easy to misconfigure.

### Runtime verifier

Files:
- `scripts/verify-runtime-config.mjs`
- `package.json`

What changed:
- Added `npm run verify:runtime`.
- The verifier now understands repo-local alias conventions such as:
  - `VITE_SUPABASE_URL` satisfying `SUPABASE_URL`
  - `SUPABASE_PROJECT_SERVICE_ROLE` satisfying `SUPABASE_SERVICE_ROLE_KEY`

Why:
- This provides a practical prelaunch check without pretending local aliases are missing.

### Health/readiness surfaces

Files:
- `public/healthz.json`
- `public/readyz.json`
- `docs/production-observability.md`
- `docs/launch_smoke_checklist.md`

What changed:
- Added simple health and readiness assets.
- Documented runtime verification and manual launch smoke steps.

Why:
- The audit identified missing runtime verification and smoke guidance.

## Validation status

- `npm run lint` → pass
- `npm run typecheck` → pass
- `npm run test` → pass
- `npm run build` → pass
- `npm run verify:runtime` → expected fail until required launch secrets are provided

## Remaining runtime blockers

The verifier now fails only on genuine missing launch configuration:

- `BOOKING_RESPONSE_SECRET`
- `BOOKING_REQUEST_RATE_LIMIT_SALT`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Optional but recommended incomplete config:

- `VITE_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## Launch interpretation

The runtime hardening work is complete from a code/docs perspective. Production launch should still be gated on supplying the missing required secrets and executing the smoke checklist.
