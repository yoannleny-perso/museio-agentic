# UI Consistency And Design Audit

Date: 2026-04-21

## Inferred design-system summary

Observed intended system:

- Tailwind-based spacing and layout
- shadcn/Radix-style primitives in `src/components/ui`
- a light, rounded, soft-shadow visual language
- purple as the primary product accent
- mobile-shell centric layouts with card-heavy composition

Observed actual implementation:

- The design system exists, but many major pages bypass it and implement their own visual rules.

## Major style-drift findings

| Severity | Finding | Evidence | Why it matters |
| --- | --- | --- | --- |
| High | Multiple pages use bespoke visual systems instead of shared primitives | `src/pages/Finance.tsx`, `src/pages/Availability.tsx`, many portfolio components | The app feels inconsistent and expensive to polish |
| High | Terms/privacy page is visually and technically outside the design system | `src/pages/TermsAndPrivacy.tsx` | This page looks unrelated to the rest of the product and uses inline styles plus Arial |
| Medium | Typography system is inconsistent | `src/index.css`, `tailwind.config.ts`, `src/pages/TermsAndPrivacy.tsx` | Brand coherence and readability suffer |
| Medium | Color tokens are incomplete; raw hex values are used heavily | finance, portfolio, availability, custom UI components | Color behavior becomes hard to maintain and theme |
| Medium | Theme handling is partially wired only | `src/App.tsx`, `src/components/ui/sonner.tsx` | Shared components may not behave consistently with theme assumptions |

## Fonts audit

Observed:

- `src/index.css` imports `Inter`, `Dancing Script`, and `Emilys Candy`.
- `tailwind.config.ts` sets `fontFamily.sans` to `Inter var`.
- `src/pages/TermsAndPrivacy.tsx` uses `Arial, sans-serif`.

Assessment:

- The app does not have a single coherent typography source of truth.
- The Tailwind config and CSS imports are already slightly mismatched.

Recommendation:

- Choose one canonical sans stack.
- Restrict decorative fonts to explicitly branded or content-specific surfaces.
- Remove ad-hoc font-family usage from pages.

## Color audit

Observed:

- Tailwind config contains a few named tokens like `museio-purple`.
- Many page components still rely on raw hex values and one-off gradients.
- Portfolio theming intentionally varies, but core app pages also drift substantially.

Recommendation:

- Define semantic tokens for:
  - page background
  - surface
  - border
  - text primary/secondary
  - success/warning/error
  - accent
- Refactor finance, availability, and settings variants to use the same token set.

## Spacing, radii, and shadow audit

Observed:

- The app generally prefers large radii and soft shadows.
- Card padding and section spacing vary noticeably by page.
- Navigation components are reimplemented multiple times with slight spacing and active-state differences.

Recommendation:

- Standardize shell spacing, card padding, and section gaps.
- Promote common nav/tab patterns into shared components instead of page-specific clones.

## Buttons and inputs audit

Observed:

- Shared button/input primitives exist.
- Many pages still build custom buttons and cards with one-off classes.
- Some screens use visually heavier CTA buttons while others use flatter or differently rounded versions.

Recommendation:

- Audit every primary/secondary/ghost button use against the shared button component.
- Avoid page-specific button systems unless the product intentionally needs a themed exception.

## Empty, loading, and error states

Observed:

- There are custom empty states across jobs, availability, portfolio, and finance.
- Error handling often falls back to toasts or inline text, but with inconsistent language and styling.

Recommendation:

- Standardize empty/loading/error patterns at the component level.
- Create shared variants for:
  - empty card
  - inline error banner
  - section loading state
  - full-screen retry state

## Pages that feel most out of family

- `src/pages/TermsAndPrivacy.tsx`
- `src/pages/Finance.tsx`
- parts of the portfolio editor/live hero stack
- parts of availability settings/calendars

## Must fix before launch

- Bring `TermsAndPrivacy` back into the shared app visual system.
- Restore a single typography source of truth.
- Remove the `ThemeProvider`/toaster mismatch or complete the theme wiring.

## Should fix soon after launch

- Replace raw hex drift with semantic tokens.
- Normalize top navigation styles across settings/finance/availability.
- Standardize error and empty states.

## Nice to improve later

- Build a compact design-token reference doc from the code.
- Add visual regression screenshots for the highest-traffic screens.
