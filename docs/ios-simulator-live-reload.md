# iOS Simulator Live Reload

This repo now supports a dev-only Capacitor live-reload mode for the iOS Simulator.

## One-Time Setup

1. Install Xcode and open it once.
2. Make sure an iPhone simulator runtime is installed in `Xcode > Settings > Platforms`.
3. From the repo root, install dependencies if needed:

```bash
npm install
```

## Start Live Reload

1. Start the Vite dev server on the simulator-safe host:

```bash
npm run dev:ios
```

2. In a second terminal, point Capacitor iOS at the local dev server:

```bash
npm run ios:copy:live
```

3. Open the iOS workspace:

```bash
npm run ios:open
```

4. In Xcode:
   Select the `App` scheme.
   Choose an iPhone simulator like `iPhone 16 Pro`.
   Press `Cmd+R`.

The app will load from `http://127.0.0.1:8080`, so UI changes from the Vite dev server should refresh in the Simulator without rebuilding the native app each time.

## Switch Back To Bundled Assets

When you want the native app to use the built local bundle again:

```bash
npm run build
npm run ios:copy
```

Then run the app again from Xcode.

## Optional Env Override

If you ever want a different live-reload URL, set this in your shell or `.env`:

```bash
CAPACITOR_LIVE_RELOAD_URL="http://127.0.0.1:8080"
```

## Notes

- This setup is intended for the iOS Simulator. For a physical device, you would usually use your Mac's LAN IP instead of `127.0.0.1`.
- If CocoaPods fails during `npx cap sync ios` because of local SSL or certificate issues, `npm run ios:copy:live` is still enough for web-only UI changes.

## Simulator Network Troubleshooting

If the app opens but auth calls fail with messages like `Load failed`:

1. Open Safari inside the iOS Simulator.
2. Visit:

```text
https://qsdfsycxaucxpbomjijg.supabase.co/auth/v1/settings
```

3. If Safari cannot load that page cleanly, the simulator likely does not trust your corporate or proxy root certificate.
4. In that case, either:
   Disable the SSL-inspecting VPN or proxy while testing, or
   Install and trust the required root certificate in the iOS Simulator.

This is a simulator trust issue, not an app env-var issue, if the same Supabase URL works from your Mac but not from the simulator.

### Fast Fix For This Machine

This Mac uses a corporate root certificate at:

```text
/Users/yoann/.certs/corp-root.pem
```

To trust it in the currently booted simulator:

```bash
xcrun simctl keychain booted add-root-cert /Users/yoann/.certs/corp-root.pem
```

You can then test connectivity immediately by opening the Supabase URL in Simulator Safari:

```bash
xcrun simctl openurl booted https://qsdfsycxaucxpbomjijg.supabase.co/auth/v1/settings
```

If you switch to a different simulator device later, you may need to run the `add-root-cert` command again for that device.
