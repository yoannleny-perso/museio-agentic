import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  createRequestContext,
  emptyResponse,
  jsonResponse,
  logEvent,
  reportFunctionError,
} from "../_shared/observability.ts";

const handler = async (req: Request): Promise<Response> => {
  const context = createRequestContext(req, "stripe-webhook");
  let currentEventId: string | null = null;
  let supabaseForErrorUpdate: any = null;
  let webhookEventTableAvailable = true;

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return emptyResponse(context);
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });
    const resendKey = Deno.env.get('RESEND_API_KEY') || '';
    const resend = resendKey ? new Resend(resendKey) : null;

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature) {
      console.error('No stripe-signature header found');
      return jsonResponse(context, 400, { error: 'No signature provided' });
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      await reportFunctionError(context, new Error('STRIPE_WEBHOOK_SECRET not configured'), {
        status: 500,
        message: 'Webhook secret not configured',
      });
      return jsonResponse(context, 500, { error: 'Webhook secret not configured' });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Webhook event verified:', event.type);
      logEvent(context, 'info', 'Stripe webhook verified', {
        eventId: event.id,
        eventType: event.type,
      });
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      await reportFunctionError(context, err, {
        status: 400,
        message: 'Webhook signature verification failed',
      });
      return jsonResponse(context, 400, { error: 'Webhook signature verification failed' });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForErrorUpdate = supabase;

    const isMissingWebhookEventTableError = (error: unknown) => {
      if (!error || typeof error !== 'object') {
        return false;
      }

      const code = 'code' in error ? String(error.code) : '';
      const message = 'message' in error ? String(error.message) : '';

      return (
        code === 'PGRST205' ||
        message.includes('stripe_webhook_events')
      );
    };

    const beginEventProcessing = async (eventId: string, eventType: string) => {
      const { data: existingEvent, error: existingEventError } = await supabase
        .from('stripe_webhook_events')
        .select('event_id, status')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEventError) {
        if (isMissingWebhookEventTableError(existingEventError)) {
          webhookEventTableAvailable = false;
          console.warn('stripe_webhook_events table is not available yet; continuing with state-based dedupe only');
          return { shouldSkip: false };
        }
        throw existingEventError;
      }

      if (existingEvent?.status === 'processed') {
        return { shouldSkip: true };
      }

      if (existingEvent) {
        const { error: updateError } = await supabase
          .from('stripe_webhook_events')
          .update({
            status: 'processing',
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('event_id', eventId);

        if (updateError) {
          throw updateError;
        }

        return { shouldSkip: false };
      }

      const { error: insertError } = await supabase
        .from('stripe_webhook_events')
        .insert({
          event_id: eventId,
          event_type: eventType,
          status: 'processing',
        });

      if (insertError) {
        throw insertError;
      }

      return { shouldSkip: false };
    };

    const markEventProcessed = async (eventId: string) => {
      if (!webhookEventTableAvailable) return;

      const { error } = await supabase
        .from('stripe_webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);

      if (error) {
        console.error('Failed to mark Stripe webhook event as processed:', error);
      }
    };

    const transitionPaymentToPaidOnce = async (
      invoicePaymentId: string,
      paymentIntentId: string
    ) => {
      const { data, error } = await supabase
        .rpc('mark_invoice_payment_paid_once', {
          p_invoice_payment_id: invoicePaymentId,
          p_payment_intent_id: paymentIntentId,
        })
        .single();

      if (error) {
        throw error;
      }

      return data as {
        transitioned: boolean;
        invoice_id: string | null;
        job_id: string | null;
        user_id: string | null;
      };
    };

    // Helper function to send payment confirmation email to artist
    const sendPaymentConfirmation = async (
      userId: string,
      jobId: string,
      invoiceId: string,
      paymentIntentId: string
    ) => {
      try {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, first_name, last_name, company_name')
          .eq('id', userId)
          .single();

        // Fetch notification settings
        const { data: notificationSettings } = await supabase
          .from('notification_settings')
          .select('receive_email_copies')
          .eq('user_id', userId)
          .single();

        // Check if user wants email notifications
        if (!notificationSettings?.receive_email_copies || !profile?.email) {
          console.log('Email notifications disabled or no email found for user');
          return;
        }

        // Fetch job details
        const { data: job } = await supabase
          .from('jobs')
          .select('title, client, date, location, rate, start_time, end_time')
          .eq('id', jobId)
          .single();

        // Fetch invoice details
        const { data: invoice } = await supabase
          .from('sent_invoices')
          .select('invoice_number, amount')
          .eq('id', invoiceId)
          .single();

        if (!job || !invoice) {
          console.error('Missing job or invoice data for email');
          return;
        }

        const amountPaid = Number(invoice.amount || 0);
        const paidOnStr = new Date().toLocaleDateString('en-AU', {
          year: 'numeric', month: 'short', day: '2-digit',
        });

        const totalLine = `Paid on ${paidOnStr} • <strong>Total:</strong> A$${amountPaid.toFixed(2)}`;

        // TEMPLATE: Payment Received (DJ)
        const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin:0; padding:0; background:#f2f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#111827; }
      .email-section { margin: 40px auto; max-width: 620px; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,.06); overflow:hidden; }
      .email-header { padding:24px; display:flex; justify-content:space-between; align-items:flex-start; background:linear-gradient(90deg,#BBF7D0 0%, #86EFAC 100%); }
      .email-meta { font-size:14px; color:#374151; }
      .email-brand { font-weight:800; font-size:22px; color:#111827; }
      .email-body { padding:24px; }
      .email-body h3 { margin:0 0 12px; font-size:20px; color:#111827; }
      .email-body ul { list-style:none; padding:0; margin:0 0 8px; font-size:15px; line-height:1.8; }
      .email-body li strong { color:#111827; }
      .card-neutral { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; text-align:center; color:#111827; }
      .cta { display:inline-block; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600; color:#fff; background:linear-gradient(90deg,#6366F1 0%,#8B5CF6 100%); }
      .footer { padding:24px; text-align:center; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6B7280; font-size:13px; }
    </style>
  </head>
  <body>
    <section class="email-section">
      <div class="email-header">
        <div class="email-meta">
          <div style="font-size:22px;font-weight:800;margin-bottom:8px;color:#111827">Payment Received</div>
          <div style="font-size:14px;color:#111827;">${totalLine}</div>
        </div>
        <div class="email-brand">MUSEIO</div>
      </div>
      <div class="email-body">
        <h3>🎉 You’ve received a Stripe payment for this invoice</h3>
        <p>Your finances are up to date. Here are the invoice details:</p>
        <ul>
          <li><strong>Invoice #:</strong> ${invoice.invoice_number}</li>
          <li><strong>Event:</strong> ${job.title || '—'}</li>
          <li><strong>Date:</strong> ${new Date(job.date).toLocaleDateString('en-AU', { day:'2-digit', month:'short', year:'numeric' })}</li>
          ${job.start_time || job.end_time ? `<li><strong>Time:</strong> ${job.start_time || ''}${job.start_time && job.end_time ? ' – ' : ''}${job.end_time || ''}</li>` : ''}
          <li><strong>Location:</strong> ${job.location || '—'}</li>
          <li><strong>Client:</strong> ${job.client || '—'}</li>
          <li><strong>Amount Paid:</strong> A$${amountPaid.toFixed(2)}</li>
          <li><strong>Payment Method:</strong> Stripe (Card)</li>
          <li><strong>Payment ID:</strong> ${paymentIntentId}</li>
        </ul>
        <div class="card-neutral" style="margin-top:12px;">
          <a class="cta" href="https://dashboard.stripe.com/">Open Stripe Dashboard</a>
          <p style="margin-top:12px; font-size:14px; color:#374151;">🔒 Secure access to your payouts, disputes &amp; reports</p>
        </div>
      </div>
      <div class="footer">
        <a href="https://museioapp.com/" style="display:inline-block; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:500; color:#fff; background:linear-gradient(90deg,#D8B4FE 0%, #C084FC 100%); margin-bottom:12px;">Discover Museio</a>
        <p>Transform your <strong>Passion</strong> into a full <strong>Business</strong> in less than <strong>1 min!</strong></p>
        <p style="font-size:12px;">This email was automatically generated by <strong>MuseioApp</strong>.</p>
      </div>
    </section>
  </body>
</html>
        `;

        if (!resend) {
          console.error('Resend is not configured; skipping payment confirmation email');
          return;
        }

        const { error: emailError } = await resend.emails.send({
          to: [profile.email],
          from: 'Payment Notification <payment@museioapp.com>',
          subject: `Payment Received - Invoice ${invoice.invoice_number}`,
          html: emailHtml
        });

        if (emailError) {
          console.error('Error sending payment confirmation email:', emailError);
        } else {
          console.log('Payment confirmation email sent successfully to:', profile.email);
        }
      } catch (error) {
        console.error('Error in sendPaymentConfirmation:', error);
        // Don't throw - we don't want to fail the webhook if email fails
      }
    };

    // Helper function to send payment receipt to client
    const sendClientReceipt = async (
      userId: string,
      jobId: string,
      invoiceId: string,
      paymentIntentId: string
    ) => {
      try {
        // Initialize Stripe to fetch actual payment details
        const stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
          apiVersion: '2023-10-16',
        });
        
        // Fetch the actual payment intent to get the total amount charged
        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
        const actualAmountPaid = paymentIntent.amount / 100;
        console.log('[sendClientReceipt] Payment amount resolved for receipt');

        // Fetch artist profile for business details
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, company_name, abn, phone, email')
          .eq('id', userId)
          .single();

        // Fetch job details with client information
        const { data: job } = await supabase
          .from('jobs')
          .select('title, client, date, location, contact_email, contact_name, contact_phone')
          .eq('id', jobId)
          .single();

        // Fetch invoice details
        const { data: invoice } = await supabase
          .from('sent_invoices')
          .select('invoice_number, amount')
          .eq('id', invoiceId)
          .single();

        if (!job || !invoice) {
          console.error('Missing job or invoice data for client receipt');
          return;
        }

        if (!job.contact_email) {
          console.log('No client email found for receipt');
          return;
        }

        // Parse client emails (comma-separated)
        const clientEmails = job.contact_email
          .split(',')
          .map(email => email.trim())
          .filter(email => email.length > 0);

        if (clientEmails.length === 0) {
          console.log('No valid client emails found');
          return;
        }

        const providerName = profile?.company_name || 
                            `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
                            'Your Service Provider';

        const paymentDateStr = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        // TEMPLATE: Payment Receipt (Client)
        const receiptHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin:0; padding:0; background:#f2f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#111827; }
      .email-section { margin: 40px auto; max-width: 620px; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,.06); overflow:hidden; }
      .email-header { padding:24px; display:flex; justify-content:space-between; align-items:flex-start; background:linear-gradient(90deg,#D8B4FE 0%, #8B5CF6 100%); }
      .email-meta { font-size:14px; color:#374151; }
      .email-brand { font-weight:800; font-size:22px; color:#111827; }
      .email-body { padding:24px; }
      .amount-pill { background:#F5F3FF; border:1px solid #E9D5FF; border-radius:10px; padding:16px; text-align:center; color:#6D28D9; margin:8px 0 20px; }
      .eyebrow { margin: 18px 0 8px; font-size:12px; letter-spacing:.08em; color:#6D28D9; text-transform:uppercase; }
      .info-table { width:100%; border-collapse:collapse; font-size:14px; }
      .info-table td { padding:10px 0; border-bottom:1px solid #E5E7EB; }
      .muted { color:#6B7280; }
      .card-neutral { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; text-align:center; color:#111827; }
      .footer { padding:24px; text-align:center; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6B7280; font-size:13px; }
    </style>
  </head>
  <body>
    <section class="email-section">
      <div class="email-header">
        <div class="email-meta">
          <div style="font-size:22px; font-weight:800; margin-bottom:8px; color:#111827">✓ Payment Receipt</div>
          <div style="font-size:14px; color:#111827;">Payment Confirmation</div>
        </div>
        <div class="email-brand">MUSEIO</div>
      </div>
      <div class="email-body">
        <p class="muted" style="color:#374151">Thank you for your payment! This receipt confirms that we have received your payment for the services provided.</p>
        <div class="amount-pill">
          <div style="font-size:12px; color:#6B7280; margin-bottom:6px;">Amount Paid</div>
          <div style="font-size:22px; font-weight:800;">$${actualAmountPaid.toFixed(2)} AUD</div>
        </div>

        <h4 class="eyebrow">Payment Details</h4>
        <table role="presentation" class="info-table">
          <tr><td class="muted" style="width:40%; color:#6B7280;">Invoice Number</td><td>${invoice.invoice_number}</td></tr>
          <tr><td class="muted" style="color:#6B7280;">Payment Date</td><td>${paymentDateStr}</td></tr>
          <tr><td class="muted" style="color:#6B7280;">Transaction ID</td><td style="font-size:12px; word-break:break-all;">${paymentIntentId}</td></tr>
          <tr><td class="muted" style="color:#6B7280;">Payment Method</td><td>Credit Card (Stripe)</td></tr>
        </table>

        <h4 class="eyebrow">Service Details</h4>
        <table role="presentation" class="info-table">
          <tr><td class="muted" style="width:40%; color:#6B7280;">Service</td><td>${job.title || '—'}</td></tr>
          <tr><td class="muted" style="color:#6B7280;">Date</td><td>${new Date(job.date).toLocaleDateString('en-AU', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</td></tr>
          <tr><td class="muted" style="color:#6B7280;">Location</td><td>${job.location || '—'}</td></tr>
        </table>

        <h4 class="eyebrow">Provider Information</h4>
        <table role="presentation" class="info-table">
          <tr><td class="muted" style="width:40%; color:#6B7280;">Provider</td><td>${providerName}</td></tr>
          ${profile?.abn ? `<tr><td class="muted" style="color:#6B7280;">ABN</td><td>${profile.abn}</td></tr>` : ''}
          ${profile?.phone ? `<tr><td class="muted" style="color:#6B7280;">Contact</td><td>${profile.phone}</td></tr>` : ''}
        </table>

        ${(job.contact_name || job.client) ? `
        <h4 class="eyebrow">Client Information</h4>
        <table role="presentation" class="info-table">
          ${job.contact_name ? `<tr><td class="muted" style="width:40%; color:#6B7280;">Contact Name</td><td>${job.contact_name}</td></tr>` : ''}
          ${job.client ? `<tr><td class="muted" style="width:40%; color:#6B7280;">Company/Venue</td><td>${job.client}</td></tr>` : ''}
        </table>` : ''}

        <div class="card-neutral" style="margin-top:20px; text-align:center;">
          <strong>Please keep this receipt for your records.</strong>
          <p style="margin:8px 0 0; font-size:12px; color:#6B7280;">
            This is an official payment receipt. If you have any questions about this payment,
            please contact ${providerName}${profile?.email ? ` at <a href="mailto:${profile.email}">${profile.email}</a>` : ''}.
          </p>
          <p style="margin:8px 0 0; font-size:12px; color:#9CA3AF;">This email was sent automatically by the invoicing system.</p>
        </div>
      </div>
      <div class="footer">
        <a href="https://museioapp.com/" style="display:inline-block; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:500; color:#fff; background:linear-gradient(90deg,#D8B4FE 0%, #C084FC 100%); margin-bottom:12px;">Discover Museio</a>
        <p>Transform your <strong>Passion</strong> into a full <strong>Business</strong> in less than <strong>1 min!</strong></p>
        <p style="font-size:12px;">This email was automatically generated by <strong>MuseioApp</strong>.</p>
      </div>
    </section>
  </body>
</html>
        `;

        if (!resend) {
          console.error('Resend is not configured; skipping client receipt email');
          return;
        }

        const { error: emailError } = await resend.emails.send({
          to: clientEmails,
          from: 'Payment Receipt <payment@museioapp.com>',
          subject: `Payment Receipt - Invoice ${invoice.invoice_number}`,
          html: receiptHtml
        });

        if (emailError) {
          console.error('Error sending client receipt:', emailError);
        } else {
          console.log('Client receipt sent successfully');
        }
      } catch (error) {
        console.error('Error in sendClientReceipt:', error);
        // Don't throw - we don't want to fail the webhook if email fails
      }
    };

    const eventProcessingState = await beginEventProcessing(event.id, event.type);
    currentEventId = event.id;
    if (eventProcessingState.shouldSkip) {
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment completed for checkout session');

        if (!session.payment_link) {
          console.error('No payment link in session');
          break;
        }

        // Find the invoice_payments record by payment link ID
        const { data: invoicePayments, error: findError } = await supabase
          .from('invoice_payments')
          .select('id, invoice_id, user_id, status, paid_at')
          .eq('stripe_payment_link_id', session.payment_link as string)
          .maybeSingle();

        if (findError || !invoicePayments) {
          console.error('Error finding invoice_payments:', findError);
          break;
        }

        console.log('Found invoice payment record for checkout completion');

        const transitionResult = await transitionPaymentToPaidOnce(
          invoicePayments.id,
          session.payment_intent as string
        );

        if (transitionResult.transitioned) {
          if (!transitionResult.job_id || !transitionResult.invoice_id || !transitionResult.user_id) {
            throw new Error('Atomic payment transition did not return the required identifiers');
          }

          await sendPaymentConfirmation(
            transitionResult.user_id,
            transitionResult.job_id,
            transitionResult.invoice_id,
            session.payment_intent as string
          );

          await sendClientReceipt(
            transitionResult.user_id,
            transitionResult.job_id,
            transitionResult.invoice_id,
            session.payment_intent as string
          );

          try {
            const { data: job } = await supabase
              .from('jobs')
              .select('client, rate')
              .eq('id', transitionResult.job_id)
              .single();

            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: transitionResult.user_id,
                title: '💰 Payment Received!',
                body: `$${Number(job?.rate || 0).toFixed(2)} payment for ${job?.client || 'client'}`,
                data: {
                  type: 'payment_received',
                  jobId: transitionResult.job_id,
                  invoiceId: transitionResult.invoice_id,
                  amount: String(job?.rate || 0)
                }
              }
            });
            console.log('Push notification sent successfully');
          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
            // Don't fail webhook if push notification fails
          }
        } else {
          console.log('Payment state already transitioned to paid; skipping duplicate side effects');
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded');

        // Find invoice_payments by payment intent ID
        let invoicePayment;
        const { data: initialInvoicePayment, error: findError } = await supabase
          .from('invoice_payments')
          .select('id, invoice_id, user_id, status, paid_at')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .maybeSingle();

        invoicePayment = initialInvoicePayment;

        if (findError) {
          throw findError;
        }

        if (!invoicePayment && paymentIntent.metadata?.invoice_number) {
          const { data: sentInvoiceByNumber, error: sentInvoiceLookupError } = await supabase
            .from('sent_invoices')
            .select('id, job_id, status, invoice_number')
            .eq('invoice_number', paymentIntent.metadata.invoice_number)
            .maybeSingle();

          if (sentInvoiceLookupError) {
            throw sentInvoiceLookupError;
          }

          if (sentInvoiceByNumber?.id) {
            const invoicePaymentLookup = await supabase
              .from('invoice_payments')
              .select('id, invoice_id, user_id, status, paid_at')
              .eq('invoice_id', sentInvoiceByNumber.id)
              .maybeSingle();

            if (invoicePaymentLookup.error) {
              throw invoicePaymentLookup.error;
            }

            invoicePayment = invoicePaymentLookup.data;
          }
        }

        if (!invoicePayment) {
          console.log('No invoice_payments found for payment intent');
          break;
        }

        console.log('Found invoice payment record for payment intent');

        const transitionResult = await transitionPaymentToPaidOnce(
          invoicePayment.id,
          paymentIntent.id
        );

        if (transitionResult.transitioned) {
          if (!transitionResult.job_id || !transitionResult.invoice_id || !transitionResult.user_id) {
            throw new Error('Atomic payment transition did not return the required identifiers');
          }

          await sendPaymentConfirmation(
            transitionResult.user_id,
            transitionResult.job_id,
            transitionResult.invoice_id,
            paymentIntent.id
          );

          await sendClientReceipt(
            transitionResult.user_id,
            transitionResult.job_id,
            transitionResult.invoice_id,
            paymentIntent.id
          );

          try {
            const { data: job } = await supabase
              .from('jobs')
              .select('client, rate')
              .eq('id', transitionResult.job_id)
              .single();

            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: transitionResult.user_id,
                title: '💰 Payment Received!',
                body: `$${Number(job?.rate || 0).toFixed(2)} payment for ${job?.client || 'client'}`,
                data: {
                  type: 'payment_received',
                  jobId: transitionResult.job_id,
                  invoiceId: transitionResult.invoice_id,
                  amount: String(job?.rate || 0)
                }
              }
            });
            console.log('Push notification sent successfully');
          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
            // Don't fail webhook if push notification fails
          }
        } else {
          console.log('Payment state already transitioned to paid; skipping duplicate side effects');
        }

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    await markEventProcessed(event.id);

    return jsonResponse(context, 200, { received: true });
  } catch (error: any) {
    await reportFunctionError(context, error, {
      status: 500,
      message: 'Stripe webhook handler error',
      extra: {
        eventId: currentEventId,
      },
    });
    if (currentEventId && supabaseForErrorUpdate && webhookEventTableAvailable) {
      try {
        await supabaseForErrorUpdate
          .from('stripe_webhook_events')
          .update({
            status: 'failed',
            last_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('event_id', currentEventId);
      } catch (_) {
        // ignore secondary failure while attempting to persist webhook errors
      }
    }
    return jsonResponse(context, 500, { error: error.message });
  }
};

serve(handler);
