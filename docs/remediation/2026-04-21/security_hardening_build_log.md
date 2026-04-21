# Security Hardening Build Log

Date: 2026-04-21

## Goals addressed

- remove insecure browser auth posture
- tighten origin controls
- reduce private data exposure in logs
- remove misleading debug or bypass-style behavior from production code
- close the insecure generic email relay pattern

## Changes implemented

### PKCE auth migration

Files:
- `src/integrations/supabase/client.ts`
- `src/hooks/useAuthCallback.ts`

What changed:
- Supabase browser auth flow changed from `implicit` to `pkce`.
- The auth callback now exchanges the `code` parameter for a session explicitly.

Why:
- This removes the riskiest prelaunch auth posture identified in the audit.
- It better aligns browser auth with a production-safe redirect model.

### CORS hardening

Files:
- `supabase/functions/_shared/security.ts`

What changed:
- `buildCorsHeaders()` no longer falls back to a “safe default” origin for disallowed origins.
- `Access-Control-Allow-Origin` is only emitted when the request origin is explicitly allowed.

Why:
- The previous fallback behavior weakened the protection boundary and made CORS behavior misleading.

### Insecure relay retirement

Files:
- `supabase/functions/send-email/index.ts`

What changed:
- The endpoint now returns `410 Gone` for all non-OPTIONS requests.
- The old raw-service-role-key relay pattern is no longer usable.

Why:
- The audit correctly flagged this as a dangerous internal primitive.
- Disabling it is safer than leaving an overpowered relay in place.

### Sensitive log reduction

Files:
- `src/context/auth/AuthProvider.tsx`
- `src/context/auth/authUtils.ts`
- `src/hooks/useSupabaseProfileDetails.ts`
- `src/hooks/useSupabaseSignature.ts`
- `src/hooks/useInvoiceLogo.ts`
- `supabase/functions/send-invoice-v2/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

What changed:
- Removed or reduced verbose logs containing:
  - auth state chatter
  - user identifiers
  - signature file paths and signed URLs
  - invoice recipient details
  - Stripe payment identifiers and recipient email detail

Why:
- Reduces privacy exposure.
- Improves production log quality by keeping only actionable operational data.

## Security posture after remediation

### Fixed now

- Browser auth no longer relies on implicit flow.
- Disallowed origins no longer receive fallback CORS allow-origin behavior.
- The insecure generic email relay is retired.
- High-volume sensitive logging is materially reduced.

### Still requires launch-time configuration

- Production secrets still need to be present for:
  - booking response links
  - abuse/rate-limiting salt
  - Resend
  - Stripe
- Sentry still needs full production env configuration.

### Safe deferred items

- Stronger auth/session integration tests should be added after launch hardening.
- Additional structured logging normalization can continue postlaunch.
