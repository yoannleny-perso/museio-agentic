# Code Quality Refactor Log

Date: 2026-04-21

## Goals addressed

- reduce confusing or risky behavior in high-value modules
- lower technical debt without broad rewrites
- make the codebase easier to reason about before launch

## Changes implemented

### Auth flow clarity

Files:
- `src/integrations/supabase/client.ts`
- `src/hooks/useAuthCallback.ts`
- `src/context/auth/AuthProvider.tsx`
- `src/context/auth/authUtils.ts`

What changed:
- Auth now follows a PKCE path.
- Callback handling is more explicit.
- Noisy auth logs were removed.

Why:
- Security and maintainability both improve when auth orchestration is less noisy and more explicit.

### Job state logic cleanup

Files:
- `src/hooks/useSupabaseJobs.ts`
- `src/services/jobMapper.ts`

What changed:
- Removed hidden write behavior from fetch logic.
- Consolidated status interpretation into mapper logic.

Why:
- Easier to understand and less surprising.

### Portfolio asset lifecycle cleanup

Files:
- `src/hooks/usePortfolioPhoto.ts`
- `src/hooks/usePhotoManagement.ts`

What changed:
- Added consistent storage-path parsing.
- Rollback and deletion cleanup are handled in the hooks where upload/delete responsibility already existed.

Why:
- Keeps media lifecycle closer to the boundary that owns it.

### Lint and source hygiene

Files:
- `eslint.config.js`
- `src/context/PortfolioDataContextModed.tsx`
- `supabase/functions/stripe-webhook/index.ts`

What changed:
- Resolved live lint blockers and excluded generated artifacts.

Why:
- Green source-quality gates are essential prelaunch.

## Technical debt reduced materially

- fewer hidden side effects in jobs
- fewer misleading fake integrations
- less noisy operational logging
- better alignment between code boundaries and business intent

## Still high-maintenance areas

- `src/pages/Availability.tsx`
- `src/pages/Finance.tsx`
- `supabase/functions/send-invoice-v2/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

These are improved but still large and should remain candidates for postlaunch decomposition.
