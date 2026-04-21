import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');

const parseEnvFile = (raw) => {
  const entries = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    entries[key] = value;
  }

  return entries;
};

const fileEnv = fs.existsSync(envPath)
  ? parseEnvFile(fs.readFileSync(envPath, 'utf8'))
  : {};

const getEnv = (key) => process.env[key] || fileEnv[key] || '';

const getFirstPresent = (keys) => {
  for (const key of keys) {
    const value = getEnv(key);
    if (value) return { key, value };
  }

  return null;
};

const checks = [
  {
    label: 'Frontend runtime',
    keys: [
      ['VITE_SUPABASE_URL', 'SUPABASE_URL'],
      ['VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'],
    ],
  },
  {
    label: 'Supabase functions',
    keys: [
      ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
      ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_PROJECT_SERVICE_ROLE'],
      ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    ],
  },
  {
    label: 'Booking protection',
    keys: [['BOOKING_RESPONSE_SECRET'], ['BOOKING_REQUEST_RATE_LIMIT_SALT']],
  },
  {
    label: 'Email delivery',
    keys: [['RESEND_API_KEY']],
  },
  {
    label: 'Payments',
    keys: [['STRIPE_SECRET_KEY'], ['STRIPE_WEBHOOK_SECRET']],
  },
];

const optionalChecks = [
  {
    label: 'Turnstile',
    keys: [['VITE_TURNSTILE_SITE_KEY'], ['TURNSTILE_SECRET_KEY']],
  },
  {
    label: 'Sentry',
    keys: [['VITE_SENTRY_DSN'], ['SENTRY_AUTH_TOKEN'], ['SENTRY_ORG'], ['SENTRY_PROJECT']],
  },
];

let hasMissingRequired = false;

console.log('Runtime configuration verification\n');

for (const section of checks) {
  const missing = section.keys
    .map((aliases) => getFirstPresent(aliases))
    .flatMap((result, index) => (result ? [] : [section.keys[index].join(' or ')]));

  if (missing.length > 0) {
    hasMissingRequired = true;
    console.log(`✗ ${section.label}: missing ${missing.join(', ')}`);
  } else {
    console.log(`✓ ${section.label}`);
  }
}

console.log('\nOptional integrations');
for (const section of optionalChecks) {
  const missing = section.keys
    .map((aliases) => getFirstPresent(aliases))
    .flatMap((result, index) => (result ? [] : [section.keys[index].join(' or ')]));

  if (missing.length > 0) {
    console.log(`- ${section.label}: incomplete (${missing.join(', ')})`);
  } else {
    console.log(`✓ ${section.label}`);
  }
}

if (hasMissingRequired) {
  console.error('\nOne or more required runtime secrets are missing.');
  process.exit(1);
}

console.log('\nAll required runtime secrets are present.');
