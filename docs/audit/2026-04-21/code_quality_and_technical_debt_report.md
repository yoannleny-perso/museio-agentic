# Code Quality And Technical Debt Report

Date: 2026-04-21

## Summary

The codebase is productive but structurally uneven. The most expensive maintenance risks come from oversized modules, duplicated domain logic, very noisy logging, and UI-heavy components that also own business behavior.

## Highest-risk maintainability hotspots

| Severity | Hotspot | Evidence | Why it matters |
| --- | --- | --- | --- |
| High | Oversized auth orchestration | `src/context/auth/AuthProvider.tsx` | Too much custom state, navigation, refresh, cleanup, and monitoring logic in one place |
| High | Oversized finance page | `src/pages/Finance.tsx` | A single page mixes view-modeling, export logic, report generation, local persistence, and many tab surfaces |
| High | Oversized availability page | `src/pages/Availability.tsx` | One file owns navigation, scheduling, layers, conflicts, vacations, and multiple modal flows |
| High | Oversized invoice function | `supabase/functions/send-invoice-v2/index.ts` | Validation, PDF generation, payment-link logic, email sending, and persistence are combined |
| High | Oversized Stripe webhook | `supabase/functions/stripe-webhook/index.ts` | Multiple event types, persistence, notifications, and email logic live together |
| Medium | Portfolio state orchestration complexity | `src/context/PortfolioDataContextModed.tsx`, `src/hooks/useModedPortfolioSections.ts` | Portfolio editing/live logic remains one of the largest structural hotspots |

## Duplicated or overlapping logic

| Severity | Finding | Evidence | Suggested cleanup |
| --- | --- | --- | --- |
| High | Session validity logic exists in multiple places | `src/context/auth/AuthProvider.tsx`, `src/components/ProtectedRoute.tsx` | Keep a single auth/session validity primitive and reuse it |
| Medium | Job update/status logic spans hooks, services, and background polling | `src/services/jobService.ts`, `src/hooks/useSupabaseJobs.ts`, job-form hooks | Separate transport, business rules, and UI side effects more cleanly |
| Medium | Portfolio hero/layout rules are split across several components and hooks | `HeroHeader.tsx`, `PortfolioPhotoSection.tsx`, `ShortBioDisplay.tsx`, `ArtistNameDisplay.tsx`, `usePortfolioPhoto.ts` | Centralize hero view-model computation |

## Type quality and unsafe patterns

Observed issues:

- Lint currently reports real source problems in `src/context/PortfolioDataContextModed.tsx` and `supabase/functions/stripe-webhook/index.ts`.
- The repo still has notable `as any` usage in portfolio and Supabase integration surfaces.
- Several Supabase RPC calls and JSON payload flows rely on loose typing rather than strong request/response contracts.

Examples:

- `src/context/PortfolioDataContextModed.tsx`
- `src/hooks/useModedPortfolioSections.ts`
- `src/services/jobService.ts`

Recommendation:

- Add stricter typed helpers for RPC boundaries.
- Convert repeated JSON casts into schema-validated parsing.
- Treat `as any` reduction as a planned debt-reduction stream, starting with finance, portfolio, and Supabase function payloads.

## Logging and debugging debt

Observed:

- The repository still contains very high console/log volume across both client and edge functions.
- Examples include job operations, invoice/logo upload, profile loading, signature management, finance, and Stripe flows.

Why it matters:

- Makes real incidents harder to triage.
- Increases privacy risk.
- Encourages operational debugging via raw payload inspection rather than structured telemetry.

Recommendation:

- Replace ad-hoc console logging with a small shared logging abstraction.
- Keep structured request IDs and severity levels.
- Remove payload dumps and convert user-facing errors to sanitized summaries.

## Generated files and tooling boundaries

Observed:

- `npm run lint` scans generated iOS build artifacts under `ios/build/**`, which should not be part of source linting.

Impact:

- CI remains red even when product code may be acceptable.
- Generated files obscure real lint failures.

Recommendation:

- Exclude `ios/build/**`, `dist/**`, and similar generated folders from lint.
- Keep generated artifacts outside the source-quality gate.

## Module-boundary issues

Observed:

- UI components frequently own business logic directly, especially in finance, availability, and portfolio flows.
- LocalStorage writes appear inside page components for functional product behavior, not just view preferences.
- Some contexts behave as both domain stores and orchestration controllers.

Recommendation:

- Move business decisions out of page components into hooks/services/view-model helpers.
- Keep components focused on rendering and user interaction.
- Introduce small domain modules for:
  - finance reporting/export
  - portfolio hero state
  - availability connected-calendar state

## Naming and conceptual clarity issues

Observed:

- The portfolio domain still uses several “moded” or dual-mode concepts that are hard to reason about quickly.
- The auth domain has multiple layers of similarly important logic spread across providers, utils, hooks, and route guards.
- Finance and availability pages are so broad that file names understate actual responsibility.

Recommendation:

- Prefer explicit names like `PortfolioLiveState`, `PortfolioEditState`, `AuthSessionManager`, `FinanceReportsModel`.
- Break wide files into subdomain-specific modules before they become harder to safely change.

## Must fix before launch

- Make lint pass and stop linting generated native artifacts.
- Split or heavily document the highest-risk monoliths enough that critical flows are auditable.
- Reduce unsafe logging in critical financial/auth paths.

## Should fix soon after launch

- Consolidate duplicated auth/session and job-status logic.
- Reduce unsafe casts and strengthen RPC typing.
- Move finance and availability logic into smaller feature modules.

## Nice to improve later

- Rename “moded” portfolio abstractions into clearer live/edit concepts.
- Add stricter architectural boundaries through folder conventions or lint rules.
