# Performance Remediation Log

Date: 2026-04-21

## Goals addressed

- reduce broad initial bundle cost where practical
- lower unnecessary refresh churn
- avoid expensive code on routes that do not need it immediately

## Changes implemented

### Deferred PDF loading from Finance

Files:
- `src/pages/Finance.tsx`

What changed:
- Removed top-level `jspdf` import.
- PDF generation now uses dynamic import inside the export action.

Why:
- Prevents Finance PDF code from being eagerly pulled into broader route loads.

### Reduced jobs refresh churn

Files:
- `src/hooks/useSupabaseJobs.ts`

What changed:
- Removed passive background business-state writes.
- Increased interval spacing from 30 seconds to 120 seconds.
- Reduced noisy fetch behavior and kept explicit rollback fetches.

Why:
- Lowers unnecessary network activity and wakeups, especially on mobile.

### Reduced logging noise that impacts runtime readability

Files:
- multiple auth/profile/signature/invoice/payment files

What changed:
- Removed high-volume debug logging in hot paths.

Why:
- This does not materially change CPU cost by itself, but it improves runtime signal and reduces console overhead during QA and debug sessions.

## Current measured build posture

Observed from the post-remediation build:

- `Finance` route chunk: ~61.67 kB
- `Availability` route chunk: ~65.96 kB
- `PortfolioRenderer`: ~150.13 kB
- `vendor`: ~481.65 kB
- `charts-vendor`: ~547.35 kB
- `pdf-vendor`: ~687.55 kB

## What improved

- Finance no longer eagerly imports PDF generation at module top level.
- Jobs background activity is materially quieter.

## What remains

### Must keep watching

- `charts-vendor` is still too large for a mobile-first launch.
- `pdf-vendor` remains the largest bundle hotspot.

### Recommended next postlaunch split work

- Move chart-heavy finance/reporting widgets behind tab-level lazy boundaries.
- Separate PDF composition logic further from normal invoice browsing and finance overview flows.
- Continue splitting large route files like `Availability.tsx` and `Finance.tsx`.
