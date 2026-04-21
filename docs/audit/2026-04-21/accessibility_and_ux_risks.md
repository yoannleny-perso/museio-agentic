# Accessibility And UX Risks

Date: 2026-04-21

## Summary

The app uses accessible primitives in many places, but custom page-level UI and dynamic visual treatments introduce significant consistency and legibility risks. The largest user-facing friction points are contrast/readability, discoverability of feature state, and inconsistent error/feedback patterns.

## Key findings

| Severity | Finding | Evidence | User impact | Recommended fix |
| --- | --- | --- | --- | --- |
| High | Dynamic hero text over photos/themes can become hard to read | portfolio hero components | Public-facing portfolio readability can fail depending on image/theme combination | Add stronger contrast rules, optional text scrims, and user-safe defaults |
| High | External calendar UI currently implies a real integration while behavior is local/mock | `src/hooks/useConnectedCalendarsState.ts` | Users may trust availability decisions that are not actually synced | Gate or label this feature clearly until real integrations exist |
| Medium | Global scrollbar hiding reduces scroll affordance and debugging clarity | `src/index.css` | Users may not realize a surface is scrollable | Restore visible scroll affordances on key surfaces or use subtler scrollbar styling |
| Medium | Form feedback is inconsistent across flows | varied hooks/pages | Users may get toast-only, inline-only, or silent-ish feedback depending on domain | Standardize validation and action-feedback patterns |
| Medium | Theme provider mismatch may affect toast presentation consistency | `src/App.tsx`, `src/components/ui/sonner.tsx` | Error/success feedback may not match theme expectations | Complete or remove theme wiring |
| Medium | Complex dialogs and large custom modals raise a recurring accessibility risk | many Radix dialog surfaces | Screen-reader title/description mistakes can regress easily | Add reusable accessible-dialog wrappers and test them |
| Low | No product analytics/funnel tracking found | repository scan | Harder to observe UX pain in production | Add privacy-conscious product analytics after launch blocker work |

## Contrast and legibility review

Observed:

- Portfolio hero text color is theme/image sensitive.
- Several surfaces use pale gradients and thin border treatments.
- Some dynamic copy sits directly over imagery.

Recommendation:

- Define minimum contrast rules for hero/name/bio text.
- Add automatic overlays or scrims when image brightness crosses thresholds.

## Navigation clarity

Observed:

- Core app shell is understandable, but subnavigation patterns vary by page.
- Finance, availability, and settings use similar but not identical top-tab patterns.
- Portfolio section jumps and editor controls are powerful but visually busy.

Recommendation:

- Standardize secondary navigation.
- Use a single tab/nav primitive for multi-section pages where possible.

## Form UX review

Observed:

- Many forms are rich and detailed, which is good, but the feedback model is inconsistent.
- Some flows rely heavily on toasts.
- Placeholder-heavy fields can still reduce clarity in some surfaces.

Recommendation:

- Prefer visible labels plus inline validation for all important fields.
- Keep toasts supplementary, not primary.

## Keyboard/focus handling

Observed:

- Radix primitives help, but the codebase has a history of dialog-title/description issues and many custom modal implementations.
- The current architecture makes future regressions likely unless dialog structure is standardized.

Recommendation:

- Add automated accessibility checks for major dialogs and forms.
- Centralize dialog scaffolding.

## Mobile-specific UX risks

Observed:

- This is a mobile-first app, but some large pages remain dense and highly stateful.
- Bundle size and repeated background refresh behavior can indirectly hurt UX through slower surfaces or stale/flickery refresh patterns.

Recommendation:

- Treat performance work as UX work for launch.
- Reduce heavy route startup cost and network churn.

## Must fix before launch

- Clarify or remove the mock external calendar integration.
- Improve readability safeguards for image-based portfolio hero text.
- Standardize critical form/action feedback for auth, booking, jobs, and finance.

## Should fix soon after launch

- Restore more visible scroll affordances.
- Standardize secondary navigation patterns.
- Add automated a11y checks to CI.

## Nice to improve later

- Add product analytics for UX funnel visibility.
- Build a reusable accessible modal/form shell kit for high-risk flows.
