# Launch Smoke Checklist

Use this checklist before every staging sign-off and production deploy.

## Automated critical-flow smoke suite

When smoke credentials and test identifiers are configured, run:

```bash
npm run smoke:critical
```

Automated coverage:

1. Sign in
2. Submit booking request
3. Decline booking request
4. Accept booking request
5. Send invoice
6. Stripe payment webhook completion

## Auth

1. Sign in with email/password.
2. Sign in with Google.
3. Sign out and confirm protected routes redirect to `/auth`.
4. Trigger password reset and confirm the callback opens the reset form.

## Public Booking

1. Open a public portfolio booking page.
2. Complete Turnstile verification if enabled.
3. Submit a booking request.
4. Confirm the request appears in the authenticated Jobs `Requests` view.

## Booking Response

1. Send a quote from a request.
2. Decline a request and confirm the status updates cleanly.
3. Accept a request from the booking-response link and confirm the job is created exactly once.

## Invoicing and Payments

1. Send an invoice from a valid job.
2. Confirm the invoice record is created and visible in Finance / Jobs.
3. Complete a Stripe payment using the payment link.
4. Confirm the webhook marks the invoice as paid once and does not duplicate the side effects.

## Availability and Calendar Truth

1. Open `My Availability`.
2. Confirm external calendar sync is clearly marked unavailable and cannot be mistaken for a live integration.
3. Confirm schedule, layers, vacations, and settings still save correctly.

## Portfolio and Media

1. Add a portrait photo and confirm the hero layout updates immediately.
2. Delete the portrait photo and confirm the no-photo layout restores immediately.
3. Delete a gallery photo and confirm the UI updates without stale placeholders.

## Operational Readiness

1. Request `/healthz.json` and `/readyz.json`.
2. Run `npm run verify:runtime` in the target environment.
3. Confirm Sentry release/env values are present in the deployed frontend.
