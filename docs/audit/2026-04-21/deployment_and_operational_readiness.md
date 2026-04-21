# Deployment And Operational Readiness

Date: 2026-04-21

## Readiness summary

Current state: **not fully deployment-ready**

Main reasons:

- CI is not clean because lint fails.
- Environment documentation is incomplete for critical backend services.
- Observability is improved but still partial.
- No healthcheck or release-smoke-test layer was found.
- Critical backend functions remain large and operationally expensive to reason about.

## Validation results

| Check | Result |
| --- | --- |
| TypeScript | Pass |
| Unit tests | Pass |
| Production build | Pass with chunk warnings |
| Lint | Fail |

## Deployment findings

| Severity | Finding | Evidence | Risk | Recommended fix |
| --- | --- | --- | --- | --- |
| Critical | CI is red because lint fails | `.github/workflows/ci.yml`, current lint output | Release automation cannot be trusted as a clean gate | Fix source lint issues and exclude generated artifacts from lint |
| High | `.env.example` is incomplete for live backend flows | `.env.example`, Stripe/Resend/booking-response functions | Production deploys can succeed with missing secrets and fail at runtime | Add all required env vars and a launch checklist |
| High | No E2E or integration test layer covers critical flows | only 5 unit test files under `src/contracts` | Deploy risk remains high for auth, booking, invoice, and payment flows | Add smoke/E2E coverage for top flows |
| High | Build output warns about very large chunks | current build output | Startup and route performance can degrade under production mobile conditions | Reduce bundle hotspots before launch |
| Medium | Observability is partial, not universal | `docs/production-observability.md` | Some edge-function failures will still be harder to triage | Extend coverage and add log-drain/alerting |
| Medium | No healthcheck endpoint or uptime-specific readiness surface found | repository scan | Harder to automate runtime verification after deploy | Add a basic health/readiness route or synthetic smoke target |
| Medium | `send-invoice-v2` depends on `npm:pdf-lib@latest` | `supabase/functions/send-invoice-v2/index.ts` | Build/runtime drift can occur without a code change | Pin exact dependency versions |
| Medium | Runtime separation between preview/staging/prod is partly code-driven, partly env-driven | `src/contracts/routes.ts`, env usage | Wrong origins/URLs can leak if environments are not configured carefully | Document canonical origin strategy per environment |

## Environment variable readiness

Observed in `.env.example`:

- Supabase keys and DB password placeholders
- Turnstile keys
- Sentry env vars
- observability webhook

Not documented there but required by runtime code:

- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BOOKING_RESPONSE_SECRET`
- likely Stripe Connect related keys depending on feature deployment

Recommendation:

- Expand `.env.example`.
- Add a deploy-time checklist that explicitly verifies each required secret.

## Monitoring and logging

Observed:

- Client Sentry bootstrap exists in `src/lib/monitoring.ts`.
- Shared structured observability exists for several edge functions in `supabase/functions/_shared/observability.ts`.
- `docs/production-observability.md` documents the current coverage and its limits.

Gaps:

- No product analytics/funnel tracking found.
- No centralized backend log aggregation or alert routing beyond webhook-based error reports.
- No native crash-specific SDK layer beyond WebView/client monitoring.

Recommendation:

- Keep Sentry.
- Add backend log-drain/search and paging for all critical functions.
- Add at least one production synthetic smoke flow.

## Migration and schema safety

Observed:

- The repository contains many Supabase migrations and RPC-backed business flows.
- CI does not currently validate migration application or schema drift.

Risk:

- App code and schema can drift without an automated warning until runtime.

Recommendation:

- Add migration validation or a disposable test database step in CI/staging.
- Add smoke tests for critical RPCs used by jobs, booking acceptance, and Stripe payment state changes.

## Release-safety assessment

Safe enough today:

- basic build
- basic type safety
- basic unit tests
- client and partial backend monitoring

Not safe enough yet:

- lint gate
- environment completeness
- critical flow integration coverage
- full operational observability

## Must fix before launch

- Make CI green.
- Expand env documentation and deployment checks to cover Stripe, Resend, and booking action secrets.
- Add at least minimal end-to-end or smoke coverage for auth, booking submission, booking response, invoice sending, and Stripe webhook/payment completion.

## Should fix soon after launch

- Add a health/readiness endpoint or synthetic uptime check.
- Extend structured observability to all critical functions.
- Pin all edge-function dependency versions.

## Nice to improve later

- Add release dashboards and deployment annotations in monitoring.
- Add secret scanning and config-policy checks in CI.
