import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { z } from "npm:zod@3.23.8";
import {
  BOOKING_REQUEST_STATUS,
  BOOKING_RESPONSE_TYPE,
  BOOKING_RESPONSE_TYPES,
  type SendBookingResponseResult,
} from "../../../src/contracts/booking.ts";
import { formatDateOnlyRangeForLocale } from "../../../src/contracts/dateOnly.ts";
import type { Database } from "../../../src/integrations/supabase/types.ts";
import {
  buildCorsHeaders,
  escapeHtml,
  isAllowedRedirectUrl,
} from "../_shared/security.ts";
import {
  createRequestContext,
  emptyResponse,
  jsonResponse,
  reportFunctionError,
} from "../_shared/observability.ts";

const getResendClient = () => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  return resendApiKey ? new Resend(resendApiKey) : null;
};

// Supabase admin client and signing for action links
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const BOOKING_RESPONSE_SECRET = Deno.env.get("BOOKING_RESPONSE_SECRET") as string;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type BookingRequestRow = Database["public"]["Tables"]["booking_requests"]["Row"];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

// Base64url helpers
const b64urlEncode = (buf: Uint8Array) =>
  btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return b64urlEncode(new Uint8Array(sig));
}

async function createActionToken(
  rid: string,
  uid: string
): Promise<string> {
  const payload = { rid, uid, ts: Date.now() };
  const payloadStr = JSON.stringify(payload);
  const signature = await hmacSign(payloadStr, BOOKING_RESPONSE_SECRET);
  const payloadB64 = b64urlEncode(new TextEncoder().encode(payloadStr));
  return `${payloadB64}.${signature}`;
}

async function buildActionLink(
  rid: string,
  uid: string,
  act: "accept" | "decline",
  returnUrl?: string
): Promise<string> {
  const token = await createActionToken(rid, uid);
  const functionsBase = SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co");
  const base = `${functionsBase}/booking-response?token=${token}&act=${act}`;
  return returnUrl ? `${base}&return_url=${encodeURIComponent(returnUrl)}` : base;
}

const bookingResponseRequestSchema = z
  .object({
    type: z.enum(BOOKING_RESPONSE_TYPES),
    request: z.object({
      id: z.string().uuid(),
    }),
    quote_price: z.number().positive().max(1_000_000).optional(),
    message: z.string().trim().min(1).max(4000),
    user_email: z.string().email().optional(),
    return_url: z.string().url().optional(),
  })
  .superRefine((payload, ctx) => {
    if (
      payload.type === BOOKING_RESPONSE_TYPE.quote &&
      typeof payload.quote_price !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quote_price"],
        message: "quote_price is required when sending a quote",
      });
    }
  });

const getAuthenticatedUserId = async (req: Request) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return data.user.id;
};

const handler = async (req: Request): Promise<Response> => {
  const context = createRequestContext(req, "send-booking-response");
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return emptyResponse(context);
  }

  try {
    const resend = getResendClient();

    const authenticatedUserId = await getAuthenticatedUserId(req);
    const payload = bookingResponseRequestSchema.parse(await req.json());
    const safeReturnUrl = isAllowedRedirectUrl(payload.return_url)
      ? payload.return_url
      : undefined;

    const { data: requestRowData, error: requestError } = await supabaseAdmin
      .from("booking_requests")
      .select("*")
      .eq("id", payload.request.id)
      .eq("portfolio_user_id", authenticatedUserId)
      .maybeSingle();

    if (requestError) {
      throw requestError;
    }

    const requestRow = requestRowData as BookingRequestRow | null;

    if (!requestRow) {
      return new Response(
        JSON.stringify({
          success: false,
          requestId: context.requestId,
          error: "Booking request not found",
        } satisfies SendBookingResponseResult),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            "X-Request-Id": context.requestId,
          },
        }
      );
    }

    if (
      requestRow.status === BOOKING_REQUEST_STATUS.accepted ||
      requestRow.status === BOOKING_REQUEST_STATUS.declined
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          requestId: context.requestId,
          error: "This booking request has already been finalized",
        } satisfies SendBookingResponseResult),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            "X-Request-Id": context.requestId,
          },
        }
      );
    }

    const formattedEventDate = formatDateOnlyRangeForLocale(
      requestRow.event_date,
      requestRow.event_end_date,
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const safeMessage = escapeHtml(payload.message);
    const safeLocation = escapeHtml(requestRow.location);
    const safeRequesterEmail = escapeHtml(requestRow.requester_email);
    const safeBudget =
      typeof requestRow.budget === "number"
        ? `$${requestRow.budget.toLocaleString()}`
        : "";

    let subject: string;
    let htmlContent: string;

    if (payload.type === BOOKING_RESPONSE_TYPE.quote) {
      let acceptLink = "";
      let declineLink = "";

      if (requestRow.portfolio_user_id) {
        acceptLink = await buildActionLink(
          requestRow.id,
          requestRow.portfolio_user_id,
          "accept",
          safeReturnUrl
        );
        declineLink = await buildActionLink(
          requestRow.id,
          requestRow.portfolio_user_id,
          "decline",
          safeReturnUrl
        );
      }

      subject = `Quote for your event on ${formatDateOnlyRangeForLocale(
        requestRow.event_date,
        requestRow.event_end_date
      )}`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7209B7; margin-bottom: 20px;">Quote for Your Event</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Event Details</h3>
            <p><strong>Date:</strong> ${formattedEventDate}</p>
            ${safeLocation ? `<p><strong>Location:</strong> ${safeLocation}</p>` : ""}
            ${safeBudget ? `<p><strong>Your Budget:</strong> ${safeBudget}</p>` : ""}
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h3 style="margin: 0 0 10px 0; color: #28a745;">My Quote</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #28a745;">$${payload.quote_price?.toLocaleString()}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="color: #333; margin-bottom: 12px;">Message</h3>
            <div style="white-space: pre-line; line-height: 1.6; color: #555;">${safeMessage}</div>
          </div>

          ${acceptLink && declineLink ? `
          <div style="display: flex; gap: 12px; margin: 28px 0;">
            <a href="${acceptLink}" target="_blank" rel="noopener noreferrer" style="background:#7209B7; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; display:inline-block; font-weight:600;">Accept</a>
            <a href="${declineLink}" target="_blank" rel="noopener noreferrer" style="background:#fff; color:#b91c1c; text-decoration:none; padding:12px 18px; border-radius:10px; display:inline-block; font-weight:600; border:1px solid #fecaca;">Decline</a>
          </div>` : ""}

          <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
            <p>You can accept or decline directly above. If you have questions, simply reply to this email.</p>
            <p>Thank you for considering my services!</p>
          </div>
        </div>
      `;
    } else {
      subject = `Update regarding your event on ${formatDateOnlyRangeForLocale(
        requestRow.event_date,
        requestRow.event_end_date
      )}`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7209B7; margin-bottom: 20px;">Event Update</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Event Details</h3>
            <p><strong>Date:</strong> ${formattedEventDate}</p>
            ${safeLocation ? `<p><strong>Location:</strong> ${safeLocation}</p>` : ""}
          </div>

          <div style="margin-bottom: 30px;">
            <div style="white-space: pre-line; line-height: 1.6; color: #555;">${safeMessage}</div>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
            <p>Thank you for your understanding, and I hope we can work together on a future project.</p>
          </div>
        </div>
      `;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    const ccEmail = profile?.email || undefined;

    const emailResponse = resend
      ? await resend.emails.send({
          from: "museio@museioapp.com",
          to: [requestRow.requester_email],
          cc: ccEmail ? [ccEmail] : undefined,
          subject,
          html: htmlContent,
        })
      : undefined;

    const updatePayload =
      payload.type === BOOKING_RESPONSE_TYPE.quote
        ? {
            quoted_price: payload.quote_price,
            status: BOOKING_REQUEST_STATUS.quoted,
          }
        : {
            status: BOOKING_REQUEST_STATUS.declined,
          };

    const { error: updateError } = await supabaseAdmin
      .from("booking_requests")
      .update(updatePayload)
      .eq("id", requestRow.id)
      .eq("portfolio_user_id", authenticatedUserId);

    if (updateError) {
      throw updateError;
    }

    const responseBody: SendBookingResponseResult = {
      success: true,
      requestId: context.requestId,
      emailResponse,
      skipped: !resend,
      warning: resend
        ? undefined
        : "Email delivery was skipped because RESEND_API_KEY is not configured for this environment.",
    };

    return jsonResponse(
      context,
      200,
      responseBody as Record<string, unknown>
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    const status = errorMessage === "Unauthorized" ? 401 : 500;

    await reportFunctionError(context, error, {
      status,
      message: "Error in send-booking-response function",
    });
    const responseBody: SendBookingResponseResult = {
      success: false,
      requestId: context.requestId,
      error: errorMessage,
    };
    return jsonResponse(
      context,
      status,
      responseBody as Record<string, unknown>
    );
  }
};

serve(handler);
