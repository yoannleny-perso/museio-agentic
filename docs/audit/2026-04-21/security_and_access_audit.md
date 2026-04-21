# Security And Access Audit

Date: 2026-04-21
Priority focus: security and access control

## Security posture summary

Observed strengths:

- Public booking intake has meaningful validation, rate limiting, honeypot handling, and Turnstile support in `supabase/functions/submit-booking-request/index.ts`.
- Public booking-response actions use signed HMAC links and expiry checks in `supabase/functions/booking-response/index.ts`.
- Stripe webhooks validate signatures in `supabase/functions/stripe-webhook/index.ts`.
- Several critical functions now emit request IDs and structured responses through `supabase/functions/_shared/observability.ts`.

Observed weaknesses:

- Browser auth still uses implicit flow with persisted tokens in `localStorage`.
- There is still at least one internal function boundary that trusts a raw shared secret header in a risky way.
- Public/private function boundaries are inconsistent and rely heavily on internal implementation discipline.
- Logging still exposes too much user and financial metadata.

## Findings

| Severity | Finding | Evidence | Risk | Recommended fix |
| --- | --- | --- | --- | --- |
| High | Supabase browser client uses `flowType: 'implicit'` with `localStorage` persistence | `src/integrations/supabase/client.ts` | Session tokens remain accessible to any successful XSS or injected third-party script | Move to PKCE immediately; re-review storage lifetime and callback handling |
| High | Internal mail relay authenticates requests by comparing request header `apikey` to `SUPABASE_SERVICE_ROLE_KEY` | `supabase/functions/send-email/index.ts` | Any accidental client exposure or reuse of this primitive would become a high-impact mail-sending escalation path | Replace with function-specific auth, remove if unused, or require signed server-originated requests plus stricter origin control |
| High | Public functions with `verify_jwt = false` rely on internal checks instead of platform enforcement | `supabase/config.toml`, `submit-booking-request`, `send-booking-response`, `booking-response` | This is acceptable only if every function self-validates perfectly; regressions become dangerous | Keep only the public functions that truly need unauthenticated access and add regression tests for each auth boundary |
| Medium | CORS helper falls back to the first allowed origin if request origin is not allowed | `supabase/functions/_shared/security.ts` | Invalid origins may still receive misleading CORS headers, complicating origin enforcement assumptions | Return no `Access-Control-Allow-Origin` header for disallowed origins instead of falling back |
| Medium | Sensitive operational logs remain in high-risk domains | `supabase/functions/send-invoice-v2/index.ts`, `supabase/functions/stripe-webhook/index.ts`, `src/hooks/useSupabaseProfileDetails.ts`, `src/hooks/useSupabaseSignature.ts` | Email addresses, payment data, or user profile details can leak into logs or support traces | Replace noisy logs with redacted structured events and remove payload dumps |
| Medium | Public media storage uses `getPublicUrl()` and a public `portfolio-images` bucket | `src/hooks/usePortfolioPhoto.ts`, `src/hooks/usePhotoManagement.ts`, related migrations | This is acceptable for public portfolio assets, but it means uploaded media is directly public by URL | Keep only explicitly public assets in that bucket and document the privacy model clearly |
| Medium | Portrait photo deletion does not remove storage objects | `src/hooks/usePortfolioPhoto.ts` | Orphaned public assets can remain discoverable even after users think content is deleted | Add storage cleanup on delete and periodic orphan cleanup |
| Medium | `.env.example` exposes the existence of privileged runtime secrets but omits some required production secrets | `.env.example`, function files | Incomplete env docs increase the chance of insecure ad-hoc deploy setup | Expand `.env.example` and deployment docs to include Stripe, Resend, webhook, and action-secret requirements |
| Low | `send-job-confirmation` and booking flows degrade to “success with skipped email” when Resend is missing | `supabase/functions/send-job-confirmation/index.ts`, `send-booking-response/index.ts`, `booking-response/index.ts` | Safe for dev, but dangerous if this silently reaches production without alerting | Keep the graceful behavior but add explicit production environment alarms and smoke tests |

## Public action and signed-link review

Observed:

- Public accept/decline links in `supabase/functions/booking-response/index.ts` require a signed HMAC token with timestamp and action payload.
- Redirect targets are constrained with `isAllowedRedirectUrl`.
- Ownership is derived from the booking request data rather than from untrusted query data alone.

Risk assessment:

- This is materially safer than unsigned public action links.
- The 30-day token lifetime is a business tradeoff rather than an outright flaw, but it should be deliberate and documented.

Recommendation:

- Keep the HMAC design.
- Add explicit replay and expiry tests.
- Consider shortening token lifetime if booking-request turnaround is typically much faster.

## Auth/session handling review

Observed:

- Session cleanup is heavily customized in `src/context/auth/AuthProvider.tsx` and `src/context/auth/authUtils.ts`.
- `ProtectedRoute` duplicates session-validity logic already present in `AuthProvider`.
- Callback handling in `src/hooks/useAuthCallback.ts` is now sanitized and does not expose raw tokens.

Risks:

- Overlapping auth/session logic increases the chance of inconsistent access control or edge-case regressions.
- The largest underlying security issue remains token storage and implicit-flow behavior.

Recommendation:

- Consolidate session validity logic into one source of truth.
- Move to PKCE.
- Add auth-focused integration tests around sign-in, refresh, expiry, sign-out, and callback recovery.

## Storage and file upload access review

Observed:

- Portfolio assets use the `portfolio-images` bucket and public URLs.
- Invoice logos use `invoice_logos` with public URLs in client code.
- User signatures appear to be stored in a separate bucket and accessed with signed URLs in `src/hooks/useSupabaseSignature.ts`.

Risks:

- Public URLs are correct for public portfolio media but should not be the default for every asset type.
- Invoice logos are probably intentionally public because they are embedded in invoices, but the privacy expectation should be explicit.

Recommendation:

- Keep public storage only for assets that are intentionally public.
- Audit every bucket policy against product intent.
- Add storage cleanup for delete paths.

## Webhook and backend authorization review

Observed:

- Stripe webhook signature verification is in place.
- `stripe_webhook_events` support exists for idempotency.
- Critical booking and job email functions now authenticate users internally when JWT platform verification is disabled.

Remaining concerns:

- Monolithic functions remain easier to regress.
- Some functions still have extensive logging and mutable control flow.

Recommendation:

- Keep strengthening idempotency tests.
- Add deploy-time smoke tests for the critical edge functions.

## Debug-only or local-only bypass review

Explicit check result:

- No obvious “debug auth bypass” was found in route protection or public action handlers.
- One important exception exists in product behavior: the connected-calendar feature is still a local/mock implementation in `src/hooks/useConnectedCalendarsState.ts` and is active in production code paths. This is a real prelaunch concern even though it is more product/correctness than security.

## Must fix before launch

- Replace implicit auth flow with PKCE and re-review session storage.
- Remove or redesign the `send-email` relay authentication pattern.
- Tighten CORS behavior so disallowed origins do not receive fallback allow-origin headers.
- Reduce PII logging in invoice, payment, profile, and signature flows.

## Should fix soon after launch

- Add storage cleanup for deleted public/private assets.
- Add auth and signed-link regression tests.
- Review public-vs-private bucket choices and document them.

## Nice to improve later

- Add per-function threat-model notes to deployment docs.
- Add secret scanning and policy linting in CI.
