import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const cliArgs = new Set(process.argv.slice(2));
const skipStripe = cliArgs.has('--skip-stripe');

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

const getEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key] || fileEnv[key];
    if (value) return value;
  }

  return '';
};

const config = {
  supabaseUrl: getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_PROJECT_SERVICE_ROLE'),
  bookingResponseSecret: getEnv('BOOKING_RESPONSE_SECRET'),
  smokeUserEmail: getEnv('SMOKE_USER_EMAIL'),
  smokeUserPassword: getEnv('SMOKE_USER_PASSWORD'),
  smokePublicPortfolioUserId: getEnv('SMOKE_PUBLIC_PORTFOLIO_USER_ID'),
  smokeBookingCaptchaToken: getEnv('SMOKE_BOOKING_CAPTCHA_TOKEN'),
  smokeClientEmail: getEnv('SMOKE_CLIENT_EMAIL'),
  stripeWebhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
};

const requiredConfigKeys = [
  'supabaseUrl',
  'supabaseAnonKey',
  'supabaseServiceRoleKey',
  'bookingResponseSecret',
  'smokeUserEmail',
  'smokeUserPassword',
  'smokePublicPortfolioUserId',
  'smokeBookingCaptchaToken',
  'smokeClientEmail',
  ...(skipStripe ? [] : ['stripeWebhookSecret']),
];

const missingConfig = requiredConfigKeys.filter((key) => !config[key]);

if (missingConfig.length > 0) {
  console.error('[smoke] Missing required configuration:', missingConfig.join(', '));
  process.exit(1);
}

const smokeRunId = `smoke-${Date.now()}`;
const functionsBaseUrl = `${config.supabaseUrl}/functions/v1`;
const anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const adminClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const cleanupIds = {
  bookingRequests: new Set(),
  jobs: new Set(),
  invoices: new Set(),
  invoicePayments: new Set(),
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const logPass = (message) => console.log(`✓ ${message}`);
const logStep = (message) => console.log(`• ${message}`);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const parseJsonResponse = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const ensureResponseOk = async (response, context) => {
  if (response.ok) return;

  const payload = await parseJsonResponse(response);
  throw new Error(
    `${context} failed with ${response.status}: ${
      typeof payload === 'string' ? payload : JSON.stringify(payload)
    }`
  );
};

const buildBookingResponseToken = (bookingRequestId, ownerId) => {
  const payload = JSON.stringify({
    rid: bookingRequestId,
    uid: ownerId,
    ts: Date.now(),
  });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.bookingResponseSecret)
    .update(payload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
};

const buildStripeSignature = (payload) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = crypto
    .createHmac('sha256', config.stripeWebhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return `t=${timestamp},v1=${digest}`;
};

const createSmokeBookingRequest = async (ownerId, overrides = {}) => {
  const { data, error } = await adminClient
    .from('booking_requests')
    .insert({
      portfolio_user_id: ownerId,
      requester_name: 'Smoke Tester',
      requester_email: `${smokeRunId}+booking@example.com`,
      event_date: '2026-05-01',
      event_end_date: '2026-05-01',
      event_start_time: '19:00',
      event_end_time: '23:00',
      location: 'Smoke Test Venue',
      budget: 1200,
      phone: '0400000000',
      event_name: `Smoke Booking ${smokeRunId}`,
      event_description: 'Automated smoke request',
      special_requirements: 'None',
      status: 'pending',
      ...overrides,
    })
    .select('*')
    .single();

  if (error) throw error;
  cleanupIds.bookingRequests.add(data.id);
  return data;
};

const createSmokeJob = async (ownerId, overrides = {}) => {
  const { data: job, error: jobError } = await adminClient
    .from('jobs')
    .insert({
      user_id: ownerId,
      title: `Smoke Invoice Job ${smokeRunId}`,
      client: 'Smoke Client',
      location: 'Smoke Location',
      date: '2026-05-02',
      end_date: '2026-05-02',
      start_time: '18:00',
      end_time: '22:00',
      rate: 1500,
      status: 'upcoming',
      pricing_mode: 'itemized',
      contact_email: config.smokeClientEmail,
      contact_name: 'Smoke Client',
      contact_phone: '0400111222',
      notes: 'Smoke test job',
      ...overrides,
    })
    .select('*')
    .single();

  if (jobError) throw jobError;

  cleanupIds.jobs.add(job.id);

  const { error: itemError } = await adminClient.from('job_items').insert([
    {
      job_id: job.id,
      item_name: 'Smoke DJ Set',
      unit_cost: 1500,
      quantity: 1,
      is_taxable: true,
      sort_order: 0,
    },
  ]);

  if (itemError) throw itemError;

  return job;
};

const cleanupSmokeData = async () => {
  if (cleanupIds.invoicePayments.size > 0) {
    await adminClient
      .from('invoice_payments')
      .delete()
      .in('id', [...cleanupIds.invoicePayments]);
  }

  if (cleanupIds.invoices.size > 0) {
    await adminClient
      .from('sent_invoices')
      .delete()
      .in('id', [...cleanupIds.invoices]);
  }

  if (cleanupIds.jobs.size > 0) {
    await adminClient
      .from('job_items')
      .delete()
      .in('job_id', [...cleanupIds.jobs]);

    await adminClient
      .from('jobs')
      .delete()
      .in('id', [...cleanupIds.jobs]);
  }

  if (cleanupIds.bookingRequests.size > 0) {
    await adminClient
      .from('booking_requests')
      .delete()
      .in('id', [...cleanupIds.bookingRequests]);
  }
};

const run = async () => {
  if (skipStripe) {
    console.log('[smoke] Running in partial mode: Stripe webhook verification is skipped.');
  }

  logStep('Signing in smoke user');
  const signInResult = await anonClient.auth.signInWithPassword({
    email: config.smokeUserEmail,
    password: config.smokeUserPassword,
  });

  if (signInResult.error || !signInResult.data.session || !signInResult.data.user) {
    throw signInResult.error || new Error('Unable to sign in smoke user');
  }

  const ownerId = signInResult.data.user.id;
  const accessToken = signInResult.data.session.access_token;
  logPass('Sign in flow');

  logStep('Submitting public booking request');
  const bookingSubmitResponse = await fetch(`${functionsBaseUrl}/submit-booking-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({
      portfolio_user_id: config.smokePublicPortfolioUserId,
      requester_name: 'Smoke Public Booker',
      requester_email: `${smokeRunId}+public@example.com`,
      event_date: '2026-05-03',
      event_end_date: '2026-05-03',
      event_start_time: '20:00',
      event_end_time: '23:00',
      location: 'Smoke Public Venue',
      budget: 900,
      phone: '0400222333',
      event_name: `Smoke Public Booking ${smokeRunId}`,
      event_description: 'Automated public booking request',
      special_requirements: 'Smoke booking submit check',
      captcha_token: config.smokeBookingCaptchaToken,
      company_website: '',
    }),
  });

  await ensureResponseOk(bookingSubmitResponse, 'submit-booking-request');
  const bookingSubmitPayload = await parseJsonResponse(bookingSubmitResponse);
  assert(bookingSubmitPayload?.success, 'submit-booking-request did not return success');

  const { data: submittedRequest, error: submittedRequestError } = await adminClient
    .from('booking_requests')
    .select('id, status')
    .eq('requester_email', `${smokeRunId}+public@example.com`)
    .eq('event_name', `Smoke Public Booking ${smokeRunId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (submittedRequestError) throw submittedRequestError;
  assert(submittedRequest?.id, 'Submitted booking request was not persisted');
  cleanupIds.bookingRequests.add(submittedRequest.id);
  logPass('Public booking request submission');

  logStep('Declining authenticated booking request');
  const declineRequest = await createSmokeBookingRequest(ownerId, {
    requester_email: `${smokeRunId}+decline@example.com`,
    event_name: `Smoke Decline ${smokeRunId}`,
  });

  const declineResponse = await fetch(`${functionsBaseUrl}/send-booking-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      type: 'decline',
      request: { id: declineRequest.id },
      message: 'Automated smoke decline',
    }),
  });

  await ensureResponseOk(declineResponse, 'send-booking-response decline');
  const declinePayload = await parseJsonResponse(declineResponse);
  assert(declinePayload?.success, 'Decline flow did not return success');

  const { data: declinedRecord, error: declinedRecordError } = await adminClient
    .from('booking_requests')
    .select('status')
    .eq('id', declineRequest.id)
    .single();

  if (declinedRecordError) throw declinedRecordError;
  assert(declinedRecord.status === 'declined', 'Booking request was not marked declined');
  logPass('Decline booking request flow');

  logStep('Accepting signed booking request');
  const acceptRequest = await createSmokeBookingRequest(ownerId, {
    requester_email: `${smokeRunId}+accept@example.com`,
    event_name: `Smoke Accept ${smokeRunId}`,
    quoted_price: 1350,
  });

  const acceptToken = buildBookingResponseToken(acceptRequest.id, ownerId);
  const acceptResponse = await fetch(
    `${functionsBaseUrl}/booking-response?token=${encodeURIComponent(acceptToken)}&act=accept`,
    {
      method: 'GET',
      redirect: 'manual',
    }
  );

  assert(
    acceptResponse.status === 200 || acceptResponse.status === 302,
    `booking-response accept returned unexpected status ${acceptResponse.status}`
  );

  const { data: acceptedRequest, error: acceptedRequestError } = await adminClient
    .from('booking_requests')
    .select('status')
    .eq('id', acceptRequest.id)
    .single();

  if (acceptedRequestError) throw acceptedRequestError;

  const { data: acceptedJob, error: acceptedJobError } = await adminClient
    .from('jobs')
    .select('id, status')
    .eq('idempotency_key', `booking:response:${acceptRequest.id}`)
    .maybeSingle();

  if (acceptedJobError) throw acceptedJobError;

  assert(acceptedRequest.status === 'accepted', 'Booking request was not marked accepted');
  assert(acceptedJob?.id, 'Accepted booking request did not create a job');
  cleanupIds.jobs.add(acceptedJob.id);
  logPass('Accept booking request flow');

  logStep('Sending invoice');
  const smokeJob = await createSmokeJob(ownerId);
  const invoiceAmount = Number(smokeJob.rate || 0);
  const gstAmount = Math.round(invoiceAmount * 0.1 * 100) / 100;

  const sendInvoiceResponse = await fetch(`${functionsBaseUrl}/send-invoice-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      job: smokeJob,
      artist: {
        name: 'Smoke Artist',
        email: config.smokeUserEmail,
        companyName: 'Smoke Artist Pty Ltd',
        companyAddress: '123 Smoke Street',
        abn: '11 111 111 111',
      },
      invoiceSettings: {
        format: 'INV-{YYYY}{MM}{DD}-{NUM}',
        paymentTerms: 14,
        footerNotes: 'Smoke test invoice',
        addGST: true,
        absorbPaymentFees: false,
        signature: null,
        signatureType: null,
        receiveEmailCopy: false,
        logo: null,
      },
      amount: invoiceAmount,
      gstAmount,
      bankDetails: {
        accountHolderName: 'Smoke Artist Pty Ltd',
        bsbNumber: '123456',
        accountNumber: '12345678',
        includeSuperInInvoices: false,
      },
    }),
  });

  await ensureResponseOk(sendInvoiceResponse, 'send-invoice-v2');
  const sendInvoicePayload = await parseJsonResponse(sendInvoiceResponse);
  assert(sendInvoicePayload?.success, 'Invoice send did not return success');

  const { data: invoiceRecord, error: invoiceRecordError } = await adminClient
    .from('sent_invoices')
    .select('id, status, invoice_number')
    .eq('job_id', smokeJob.id)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invoiceRecordError) throw invoiceRecordError;
  assert(invoiceRecord?.id, 'Invoice record was not created');
  cleanupIds.invoices.add(invoiceRecord.id);
  logPass('Send invoice flow');

  if (skipStripe) {
    console.log('\nCritical smoke suite completed successfully (Stripe verification skipped).');
    return;
  }

  logStep('Completing Stripe webhook flow');
  const { data: invoicePayment, error: invoicePaymentError } = await adminClient
    .from('invoice_payments')
    .select('id')
    .eq('invoice_id', invoiceRecord.id)
    .maybeSingle();

  if (invoicePaymentError) throw invoicePaymentError;
  assert(invoicePayment?.id, 'Invoice payment record was not created');
  cleanupIds.invoicePayments.add(invoicePayment.id);

  const fakePaymentIntentId = `pi_smoke_${Date.now()}`;
  const webhookEvent = {
    id: `evt_smoke_${Date.now()}`,
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: fakePaymentIntentId,
        object: 'payment_intent',
        metadata: {
          invoice_number: invoiceRecord.invoice_number,
        },
      },
    },
  };

  const webhookPayload = JSON.stringify(webhookEvent);
  const stripeSignature = buildStripeSignature(webhookPayload);
  const webhookResponse = await fetch(`${functionsBaseUrl}/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': stripeSignature,
    },
    body: webhookPayload,
  });

  await ensureResponseOk(webhookResponse, 'stripe-webhook');
  await sleep(750);

  const { data: paidInvoicePayment, error: paidInvoicePaymentError } = await adminClient
    .from('invoice_payments')
    .select('status, paid_at, stripe_payment_intent_id')
    .eq('id', invoicePayment.id)
    .single();

  if (paidInvoicePaymentError) throw paidInvoicePaymentError;

  const { data: paidInvoice, error: paidInvoiceError } = await adminClient
    .from('sent_invoices')
    .select('status')
    .eq('id', invoiceRecord.id)
    .single();

  if (paidInvoiceError) throw paidInvoiceError;

  const { data: paidJob, error: paidJobError } = await adminClient
    .from('jobs')
    .select('status')
    .eq('id', smokeJob.id)
    .single();

  if (paidJobError) throw paidJobError;

  assert(paidInvoicePayment.status === 'paid', 'Invoice payment was not marked paid');
  assert(Boolean(paidInvoicePayment.paid_at), 'Invoice payment paid_at was not set');
  assert(
    paidInvoicePayment.stripe_payment_intent_id === fakePaymentIntentId,
    'Invoice payment intent id was not recorded'
  );
  assert(paidInvoice.status === 'paid', 'Sent invoice was not marked paid');
  assert(paidJob.status === 'paid', 'Job was not marked paid after webhook');
  logPass('Stripe payment + webhook completion flow');

  await anonClient.auth.signOut();
  console.log('\nCritical smoke suite completed successfully.');
};

try {
  await run();
} catch (error) {
  console.error('\n[smoke] Critical flow smoke suite failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await cleanupSmokeData();
}
