
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  BOOKING_REQUEST_STATUS,
  BOOKING_RESPONSE_PAGE_STATUS,
} from "../../../src/contracts/booking.ts";
import { formatDateOnlyRangeForLocale } from "../../../src/contracts/dateOnly.ts";
import type { Database } from "../../../src/integrations/supabase/types.ts";
import {
  escapeHtml,
  isAllowedRedirectUrl,
} from "../_shared/security.ts";
import {
  createRequestContext,
  emptyResponse,
  jsonResponse,
  redirectResponse,
  reportFunctionError,
} from "../_shared/observability.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const BOOKING_RESPONSE_SECRET = Deno.env.get("BOOKING_RESPONSE_SECRET") as string;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const getResendClient = () => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  return resendApiKey ? new Resend(resendApiKey) : null;
};

type BookingRequestRow = Database["public"]["Tables"]["booking_requests"]["Row"];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

// Base64url helpers
const b64urlEncode = (buf: Uint8Array) =>
  btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const b64urlDecodeToBytes = (str: string) => {
  const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

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

async function verifyToken(token: string) {
  // token = base64url(payload).signature
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [payloadB64, signature] = parts;
  const payloadBytes = b64urlDecodeToBytes(payloadB64);
  const payloadStr = new TextDecoder().decode(payloadBytes);
  const expectedSig = await hmacSign(payloadStr, BOOKING_RESPONSE_SECRET);
  if (expectedSig !== signature) throw new Error("Invalid signature");
  const payload = JSON.parse(payloadStr) as {
    rid: string;
    uid: string;
    ts: number;
  };
  // Optional: expire after 30 days
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - payload.ts > maxAgeMs) throw new Error("Token expired");
  return payload;
}

async function sendOwnerEmail(to: string, subject: string, html: string) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn("[booking-response] Email skipped because RESEND_API_KEY is not configured");
      return;
    }

    const emailResponse = await resend.emails.send({
      from: "museio@museioapp.com",
      to: [to],
      subject,
      html,
    });
    console.log("Notification email sent:", emailResponse);
  } catch (e) {
    console.error("Failed to send notification email:", e);
  }
}

function htmlResponse(message: string) {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Response recorded</title>
      <style>
        body { font-family: Arial, sans-serif; background:#f8f7ff; color:#1f2937; padding:24px; }
        .card { max-width: 560px; margin:40px auto; background:white; border-radius:16px; box-shadow:0 10px 30px rgba(139,92,246,0.20); padding:28px; }
        .title { color:#6d28d9; margin:0 0 12px; font-size:22px; }
        .text { line-height:1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1 class="title">Thank you</h1>
        <p class="text">${message}</p>
      </div>
    </body>
  </html>`;

  // Build headers using the Headers API to avoid any case/casing issues
  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("content-disposition", "inline");
  headers.set("cache-control", "no-store");
  headers.set("access-control-allow-origin", "*");
  headers.set(
    "access-control-allow-headers",
    "authorization, x-client-info, apikey, content-type"
  );

  // Log headers to confirm what is being sent at runtime
  try {
    console.log("[booking-response] Returning HTML with headers:", Array.from(headers.entries()));
  } catch (_) {
    // ignore logging errors in case of non-serializable headers
  }

  return new Response(html, {
    status: 200,
    headers,
  });
}

const handler = async (req: Request): Promise<Response> => {
  const context = createRequestContext(req, "booking-response");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return emptyResponse(context, 204, "GET, OPTIONS");
  }

  try {
    const url = new URL(req.url);
    const rawToken = url.searchParams.get("token") ?? "";
    const requestedReturnUrl = url.searchParams.get("return_url") || "";
    const returnUrl = isAllowedRedirectUrl(requestedReturnUrl)
      ? requestedReturnUrl
      : "";
    const token = rawToken.trim().replace(/[^A-Za-z0-9._-]/g, "");

    const redirect = (status: string, rid?: string, msg?: string) => {
      if (!returnUrl) {
        return jsonResponse(context, 200, { status, rid, message: msg }, "GET, OPTIONS");
      }
      try {
        const dest = new URL(returnUrl);
        dest.searchParams.set('status', status);
        if (rid) dest.searchParams.set('rid', rid);
        if (msg) dest.searchParams.set('msg', msg);
        return redirectResponse(context, dest.toString(), 302, "GET, OPTIONS");
      } catch (_) {
        const sep = returnUrl.includes('?') ? '&' : '?';
        const dest = `${returnUrl}${sep}status=${encodeURIComponent(status)}${rid ? `&rid=${encodeURIComponent(rid)}` : ''}${msg ? `&msg=${encodeURIComponent(msg)}` : ''}`;
        return redirectResponse(context, dest, 302, "GET, OPTIONS");
      }
    };

    if (!token) {
      return redirect(BOOKING_RESPONSE_PAGE_STATUS.error, undefined, 'Missing token');
    }

    const { rid, uid } = await verifyToken(token);
    const act = (url.searchParams.get("act") || "").toLowerCase();
    if (act !== "accept" && act !== "decline") {
      return redirect(BOOKING_RESPONSE_PAGE_STATUS.invalid, undefined, 'Missing or invalid action');
    }
    console.log("Verified booking response:", { rid, uid, act });

    // Fetch the booking request to build messages and verify ownership
    const { data: bookingRequestData, error: fetchErr } = await supabase
      .from("booking_requests")
      .select("*, requester_name, requester_email, event_date, event_name, location, budget, quoted_price, phone")
      .eq("id", rid)
      .maybeSingle();
    const reqRow = bookingRequestData as BookingRequestRow | null;
    if (fetchErr) throw fetchErr;
    if (!reqRow) return redirect(BOOKING_RESPONSE_PAGE_STATUS.notFound, rid, 'Booking request not found or already processed.');
    if (reqRow.portfolio_user_id !== uid) return redirect(BOOKING_RESPONSE_PAGE_STATUS.invalid, rid, 'Invalid request owner.');

    // Get portfolio owner's email from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", uid)
      .maybeSingle();

    const ownerEmail = profile?.email;

    // Build a deterministic idempotency key shared across both actions
    const idempotencyKey = `booking:response:${rid}`;

    // If already processed via either action, return one-time link message
    const { data: existingJob, error: existingCheckErr } = await supabase
      .from("jobs")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existingCheckErr) {
      console.warn("[booking-response] Idempotency pre-check error:", existingCheckErr);
    }
    if (
      existingJob ||
      reqRow.status === BOOKING_REQUEST_STATUS.declined ||
      reqRow.status === BOOKING_REQUEST_STATUS.accepted
    ) {
      return redirect(BOOKING_RESPONSE_PAGE_STATUS.alreadyUsed, rid);
    }

    if (act === "decline") {
      const { error: updErr } = await supabase
        .from("booking_requests")
        .update({ status: BOOKING_REQUEST_STATUS.declined })
        .eq("id", rid);
      if (updErr) throw updErr;

      if (ownerEmail) {
        await sendOwnerEmail(
          ownerEmail,
          `Booking request declined by ${reqRow.requester_name}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color:#7209B7;">Client Declined Quote</h2>
              <p><strong>Client:</strong> ${escapeHtml(reqRow.requester_name)} (${escapeHtml(reqRow.requester_email)})</p>
              <p><strong>Event:</strong> ${escapeHtml(reqRow.event_name || 'Event')} on ${escapeHtml(formatDateOnlyRangeForLocale(reqRow.event_date, reqRow.event_end_date))}</p>
              <p>The client has declined your quote.</p>
            </div>
          `
        );
      }

      return redirect(BOOKING_RESPONSE_PAGE_STATUS.declined, rid);
    }

    const formattedEventDate = formatDateOnlyRangeForLocale(
      reqRow.event_date,
      reqRow.event_end_date
    );

    const { data: acceptResult, error: acceptErr } = await supabase
      .rpc("accept_booking_request_transactional", {
        p_request_id: rid,
        p_owner_id: uid,
        p_idempotency_key: idempotencyKey,
      })
      .single();

    if (acceptErr) {
      throw acceptErr;
    }

    if (acceptResult?.result_status === "already_used") {
      return redirect(BOOKING_RESPONSE_PAGE_STATUS.alreadyUsed, rid);
    }

    if (acceptResult?.result_status !== "accepted") {
      throw new Error("Unexpected booking acceptance result");
    }

    if (ownerEmail) {
      await sendOwnerEmail(
        ownerEmail,
        `Booking accepted by ${reqRow.requester_name}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color:#7209B7;">Client Accepted Quote</h2>
            <p><strong>Client:</strong> ${escapeHtml(reqRow.requester_name)} (${escapeHtml(reqRow.requester_email)})</p>
            <p><strong>Event:</strong> ${escapeHtml(reqRow.event_name || 'Event')} on ${escapeHtml(formattedEventDate)}</p>
            <p>A job has been created and the booking request has been marked as accepted.</p>
          </div>
        `
      );
    }

    return redirect(BOOKING_RESPONSE_PAGE_STATUS.accepted, rid);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    await reportFunctionError(context, error, {
      status: 400,
      message: "Error handling booking response",
    });
    // If a return URL is provided, redirect with error; otherwise return JSON
    try {
      const url = new URL(req.url);
      const requestedReturnUrl = url.searchParams.get('return_url');
      const returnUrl = isAllowedRedirectUrl(requestedReturnUrl)
        ? requestedReturnUrl
        : null;
      if (returnUrl) {
        const sep = returnUrl.includes('?') ? '&' : '?';
        const dest = `${returnUrl}${sep}status=${BOOKING_RESPONSE_PAGE_STATUS.error}&msg=${encodeURIComponent(errorMessage)}`;
        return redirectResponse(context, dest, 302, "GET, OPTIONS");
      }
    } catch (_) { /* ignore */ }
    return jsonResponse(context, 400, { error: errorMessage }, "GET, OPTIONS");
  }
};

serve(handler);
