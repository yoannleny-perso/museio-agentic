# Post-Remediation Validation Report

Date: 2026-04-21

## Validation commands executed

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Pass | Source lint issues resolved and generated artifacts excluded |
| `npm run typecheck` | Pass | TS compile clean |
| `npm run test` | Pass | 5 files, 20 tests |
| `npm run build` | Pass with bundle warnings | Large chunk warnings remain for chart/PDF/vendor bundles |
| `npm run verify:runtime` | Fails correctly | Only genuine missing launch secrets remain |

## Runtime verification result

### Present / verified

- frontend Supabase runtime
- Supabase function runtime aliases
- Turnstile env pair

### Missing required launch secrets

- `BOOKING_RESPONSE_SECRET`
- `BOOKING_REQUEST_RATE_LIMIT_SALT`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Missing optional production telemetry configuration

- `VITE_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## Auth verification status

Observed from code + validation:

- Browser auth client is now configured for PKCE.
- Auth callback exchanges authorization codes explicitly.
- Sign-out/session helper logging was reduced without removing the core flow.

No automated auth E2E suite exists in this repository, so final login/logout smoke verification remains a manual launch check.

## Public/private boundary verification status

Observed from code:

- CORS helper no longer falls back to an allow-origin header for disallowed origins.
- The generic `send-email` relay is retired.
- External calendar sync no longer exposes fake production behavior.

## Core commercial flow verification status

Observed from code:

- Job refresh no longer mutates business state passively.
- Portfolio asset deletion now cleans up storage objects in the affected hooks.
- Financial and Stripe logs were reduced.

No automated Stripe/payment smoke harness exists in this repository; production readiness still depends on the documented manual smoke checklist.

## Bundle posture after remediation

Largest chunks from `npm run build`:

- `pdf-vendor`: ~687.55 kB
- `charts-vendor`: ~547.35 kB
- `vendor`: ~481.65 kB

This is improved in structure but still a meaningful launch risk on lower-end mobile devices.

## Overall post-remediation assessment

### Resolved from the audit

- PKCE migration
- insecure generic email relay retired
- CORS fallback behavior fixed
- mock external calendar integration no longer misrepresents itself as real
- onboarding invoice readiness improved
- passive background job-state mutation removed
- storage cleanup on media delete improved
- lint/CI state improved to green
- runtime/env docs materially improved
- theme/toaster baseline restored

### Remaining launch blockers

1. missing required production secrets
2. no automated critical-flow smoke/E2E coverage
3. large bundle hotspots still present
4. real external calendar sync still not implemented, only truthfully disabled

## Launch recommendation

Conditional go:

- code-level critical/high findings from the audit have been addressed materially
- production launch should wait for secret provisioning and final manual smoke verification of auth, booking, invoice, and Stripe flows
