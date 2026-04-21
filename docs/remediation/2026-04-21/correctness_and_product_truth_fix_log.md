# Correctness and Product Truth Fix Log

Date: 2026-04-21

## Goals addressed

- stop the app from presenting fake or misleading product capabilities
- prevent background business-state changes during passive viewing
- make readiness logic reflect real setup requirements
- ensure deletion paths clean up actual stored assets

## Changes implemented

### External calendar sync gated/disabled

Files:
- `src/hooks/useConnectedCalendarsState.ts`
- `src/components/availability/ConnectedCalendarsModal.tsx`
- `src/pages/Availability.tsx`

What changed:
- Removed simulated Google/Calendly accounts, events, and connection actions.
- Replaced them with a clear disabled/coming-soon state.
- User interactions now show truthful messaging rather than creating fake connected accounts.

Why:
- The audit identified this as a critical product-truth issue.
- Shipping a fake sync would undermine booking trust.

### Onboarding invoice readiness corrected

Files:
- `src/context/OnboardingContext.tsx`

What changed:
- Invoice completion now requires more than a signature:
  - signature present
  - invoice format present
  - positive payment terms
  - footer notes configured

Why:
- The prior logic could mark users “invoice-ready” without a real invoice setup.

### Passive job state mutation removed

Files:
- `src/hooks/useSupabaseJobs.ts`
- `src/services/jobMapper.ts`

What changed:
- Background refresh no longer mutates job statuses in the database.
- Fetch logic now reads and maps state instead of writing business-state changes while users are passively viewing data.
- Canonical status mapping remains in the client model layer instead of hidden mutation logic.

Why:
- Silent background state changes are unsafe and hard to reason about.

### Storage cleanup on media deletion

Files:
- `src/hooks/usePortfolioPhoto.ts`
- `src/hooks/usePhotoManagement.ts`

What changed:
- Deleting a portrait photo now cleans up the linked storage object when possible.
- Deleting gallery photos now removes storage objects as well.
- Failed DB insert after upload now rolls back the uploaded storage object.

Why:
- Prevents orphaned storage data and inconsistent portfolio media state.

## Product-truth result after remediation

### Fixed now

- External calendar sync is no longer represented as a working product feature.
- Onboarding completion is more honest.
- Jobs no longer mutate state just because a refresh occurred.
- Portfolio asset deletion now better matches user intent.

### Still intentionally not expanded in this phase

- No new real Google/Calendly sync was built.
- No new product surface was added beyond making current behavior truthful.
