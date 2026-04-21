# Deep Linking

Updated during Phase 03 on 2026-04-14.

## Overview

The app supports both:

- custom scheme links via `museio://`
- universal/app links via HTTPS hosts recognized by the app

The canonical route logic now lives in [src/contracts/routes.ts](/Users/yoann/groove-flow-mobile-app-main/src/contracts/routes.ts:1) and the native listener lives in [src/hooks/useDeepLinks.ts](/Users/yoann/groove-flow-mobile-app-main/src/hooks/useDeepLinks.ts:1).

## Supported Hosts

The app currently accepts HTTPS deep links from:

- `https://groove-flow-mobile-app.vercel.app`
- `https://museioapp.com`
- `https://www.museioapp.com`

## Canonical Link Formats

### App screens

Preferred native format:

```text
museio://app/home
museio://app/jobs
museio://app/jobs?tab=paid
museio://app/portfolio
museio://app/settings?tab=bank
```

Preferred HTTPS format:

```text
https://groove-flow-mobile-app.vercel.app/app/home
https://groove-flow-mobile-app.vercel.app/app/jobs?tab=requests
https://groove-flow-mobile-app.vercel.app/app/settings?tab=bank
```

### Public booking pages

Canonical public booking URL:

```text
https://museioapp.com/{nickname}/book
```

Canonical native booking URL:

```text
museio://book/{nickname}
```

### Stripe callback entrypoint

Stripe always returns to the shared callback page first:

```text
https://groove-flow-mobile-app.vercel.app/stripe-callback
https://groove-flow-mobile-app.vercel.app/stripe-callback?stripe_return=true
https://groove-flow-mobile-app.vercel.app/stripe-callback?stripe_refresh=true
```

From there, the app redirects to the actual destination:

- success: `/app/settings?tab=bank&stripe_return=true`
- refresh/incomplete: `/app/settings?tab=bank&stripe_refresh=true`
- error: `/app/settings?tab=bank`

On native, the callback page reopens the app with:

```text
museio://app/settings?tab=bank&stripe_return=true
museio://app/settings?tab=bank&stripe_refresh=true
museio://app/settings?tab=bank
```

## Jobs Tab Routing

The jobs page now treats the `tab` query parameter as the route source of truth.

Supported values:

- `requests`
- `upcoming`
- `invoice-sent`
- `paid`
- `drafted`
- `past`

Canonical example:

```text
/app/jobs?tab=upcoming
```

Effects of this change:

- opening a jobs deep link lands on the intended tab
- push notifications can target a specific tab reliably
- switching tabs in the UI updates the URL
- refreshing or reopening the page preserves the active tab

## Backward Compatibility

The deep-link resolver still accepts a few legacy patterns so old links do not immediately break:

- `museio://home`
- `museio://portfolio`
- `museio://availability`
- `museio://finance`
- `museio://settings?tab=bank`
- `museio://booking?username={nickname}`
- `https://host/book/{nickname}`

These are normalized internally to the canonical routes above.

## Platform Notes

### Android

- Android intent filters must allow the `museio://` scheme.
- Android App Links should be configured for the supported HTTPS host you want to ship publicly.

### iOS

- `museio` must exist in URL schemes.
- Associated Domains must include the host used for universal links.

### Stripe

- Stripe OAuth and Stripe account-link returns must point to the same callback page: `/stripe-callback`.
- The callback page is responsible for reopening the native app or routing the web app to settings.

## Manual Testing

### iOS Simulator

```bash
xcrun simctl openurl booted "museio://app/home"
xcrun simctl openurl booted "museio://book/demo-dj"
xcrun simctl openurl booted "https://museioapp.com/demo-dj/book"
xcrun simctl openurl booted "https://groove-flow-mobile-app.vercel.app/app/jobs?tab=paid"
```

### Android Emulator

```bash
adb shell am start -W -a android.intent.action.VIEW -d "museio://app/settings?tab=bank" com.museio.app
adb shell am start -W -a android.intent.action.VIEW -d "https://museioapp.com/demo-dj/book" com.museio.app
adb shell am start -W -a android.intent.action.VIEW -d "https://groove-flow-mobile-app.vercel.app/app/jobs?tab=requests" com.museio.app
```

## Ownership

When adding or changing routes:

1. update [src/contracts/routes.ts](/Users/yoann/groove-flow-mobile-app-main/src/contracts/routes.ts:1)
2. verify [src/hooks/useDeepLinks.ts](/Users/yoann/groove-flow-mobile-app-main/src/hooks/useDeepLinks.ts:1) still resolves the link correctly
3. verify [src/pages/StripeCallback.tsx](/Users/yoann/groove-flow-mobile-app-main/src/pages/StripeCallback.tsx:1) if the change affects Stripe return flow
4. update this document if the public or native link shape changes
