# Performance Audit

Date: 2026-04-21

## Current build snapshot

Observed from `npm run build`:

| Chunk | Size | Notes |
| --- | --- | --- |
| `pdf-vendor` | 687.18 kB | includes PDF and Fabric-related dependencies |
| `charts-vendor` | 547.35 kB | Recharts-heavy chunk |
| `vendor` | 481.67 kB | remaining general vendor code |
| `react-vendor` | 160.12 kB | React, router, react-query, next-themes |
| `ui-vendor` | 153.32 kB | Radix/cmdk/vaul stack |
| `PortfolioRenderer` | 149.81 kB | public/edit portfolio runtime |
| `Availability` | 70.12 kB | large single-route feature |
| `Finance` | 61.34 kB | large single-route feature |

Vite is already warning about chunks larger than 500 kB.

## Highest-impact findings

| Severity | Finding | Evidence | Impact | Recommended fix |
| --- | --- | --- | --- | --- |
| High | PDF/chart/vendor chunks are too large for a mobile-first app | `npm run build` output, `vite.config.ts` | Slower cold starts, more memory pressure, worse mobile WebView performance | Split PDF/reporting/editing features more aggressively behind route or action-level imports |
| High | Jobs data refreshes both on intervals and on app resume | `src/hooks/useSupabaseJobs.ts`, `src/components/CapacitorAppStateManager.tsx` | Duplicate requests, unnecessary wakeups, extra writes from background status mutation | Consolidate refresh ownership and add smarter stale-time rules |
| High | Finance page is a large multi-feature screen with reports, exports, and PDF dependencies | `src/pages/Finance.tsx` | Heavy parse/execute cost and more expensive future edits | Extract report/export code paths into lazily loaded submodules |
| Medium | Availability page is also a broad stateful route | `src/pages/Availability.tsx` | Higher rerender surface area and more complex reconciliation | Split tabs into subcomponents loaded only when active |
| Medium | Portfolio media uses public/original image URLs without an obvious image transformation pipeline | `src/hooks/usePortfolioPhoto.ts`, `src/hooks/usePhotoManagement.ts`, portfolio components | Large image downloads on public/mobile surfaces | Add resized variants, responsive image sizing, and upload-time optimization |
| Medium | Large lists and galleries are custom-rendered without virtualization | jobs, clients, finance payout/deposit lists, portfolio sections | Potential slowdown for heavier user datasets | Add virtualization or pagination where lists can grow materially |
| Medium | Heavy local view-model computation occurs in page components | `src/pages/Finance.tsx`, `src/pages/Availability.tsx`, portfolio components | More expensive rerenders and harder memoization boundaries | Move data shaping into dedicated hooks or memoized selectors |

## Data-fetching and caching review

Observed:

- React Query is used in some domains, especially finance.
- Jobs are managed through a custom provider/hook layer rather than React Query.
- `useSupabaseJobs` includes its own “too recent” guard, interval refresh, optimistic updates, and background status mutation.

Assessment:

- The jobs domain behaves like a custom client-side cache without the full ergonomics or visibility of React Query.
- This is workable, but harder to tune and reason about under mobile resume, reconnect, and error states.

Recommendation:

- Either migrate jobs onto React Query conventions or simplify the custom cache.
- Remove duplicate refresh triggers.
- Separate “status reconciliation” from “data fetch” so view refreshes do not always imply background writes.

## Bundle and dependency observations

Observed:

- `vite.config.ts` already manually chunks several dependency groups.
- `send-invoice-v2` imports `pdf-lib@latest` server-side, while the client bundle includes `jspdf`, `pdf-lib`, and `fabric`-related weight.
- `recharts` materially increases the client bundle for finance/reporting surfaces.

Recommendation:

- Keep reports/PDF/editor dependencies completely out of the first authenticated shell load.
- Consider deferring or server-rendering export-heavy functionality where feasible.

## Mobile-specific concerns

Observed:

- This is a mobile-first Capacitor app, so cold-start JS cost matters more than in a desktop-only SPA.
- The app refreshes several domains on resume via `CapacitorAppStateManager.tsx`.
- Global scrollbar hiding in `src/index.css` can make scroll boundaries harder to debug and reason about.

Recommendation:

- Optimize for lower-end device memory and CPU.
- Use route-level and action-level lazy loading for heavy tools.
- Reduce resume-time refresh fan-out to only the domains actually needed immediately.

## Must fix before launch

- Reduce the largest bundle hotspots enough that finance/PDF/chart code is not part of a broad vendor burden.
- Remove duplicated jobs refresh work.

## Should fix soon after launch

- Introduce image optimization for portfolio/public media.
- Split finance and availability into smaller active-tab modules.
- Review heavy list rendering under real seeded datasets.

## Nice to improve later

- Add bundle-size budgets in CI.
- Add route-level performance instrumentation and mobile cold-start baselines.
