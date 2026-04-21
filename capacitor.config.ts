import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CapacitorConfig } from '@capacitor/cli';

const readEnvOverride = (key: string) => {
  const directValue = process.env[key]?.trim();
  if (directValue) {
    return directValue;
  }

  try {
    const envPath = resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) {
      return undefined;
    }

    const envContent = readFileSync(envPath, 'utf8');
    const envLine = envContent
      .split(/\r?\n/)
      .find((line) => line.startsWith(`${key}=`));

    if (!envLine) {
      return undefined;
    }

    const rawValue = envLine.slice(key.length + 1).trim();
    return rawValue.replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
};

const liveReloadUrl = readEnvOverride('CAPACITOR_LIVE_RELOAD_URL');
const liveReloadHost = (() => {
  if (!liveReloadUrl) return undefined;

  try {
    return new URL(liveReloadUrl).hostname;
  } catch {
    return undefined;
  }
})();

const config: CapacitorConfig = {
  appId: 'com.audaciangroup.museio',
  appName: 'Museio',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,           // or however long you want
      splashFullScreen: false,            // important: false = shows nav bar
      splashImmersive: false,             // important: false = retains system nav bar color
      androidScaleType: 'CENTER_CROP',     // adjust as needed
      backgroundColor: "#ffff0000"  // Splash screen background only
    },
    App: {
      deepLinkingScheme: 'museio',
      deepLinkingCustomScheme: 'museio'
    },
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'ionic',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
  },

  },
  
  ios: {
    webContentsDebuggingEnabled: true,
    scheme: 'museio'
  },

  server: {
    ...(liveReloadUrl
      ? {
          url: liveReloadUrl,
          cleartext: liveReloadUrl.startsWith('http://'),
        }
      : {}),
    allowNavigation: [
      '*.stripe.com',
      'https://*.stripe.com',
      ...(liveReloadHost ? [liveReloadHost] : []),
    ],
  }
};


export default config;
