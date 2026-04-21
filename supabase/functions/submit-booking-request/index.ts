import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { z } from "npm:zod@3.23.8";
import { BOOKING_REQUEST_STATUS } from "../../../src/contracts/booking.ts";
import {
  getClientIpAddress,
  sha256Hex,
  verifyTurnstileToken,
} from "../_shared/security.ts";
import {
  createRequestContext,
  emptyResponse,
  jsonResponse,
  reportFunctionError,
} from "../_shared/observability.ts";

const MAX_TEXT_LENGTH = 4000;
const MAX_NAME_LENGTH = 120;
const MAX_LOCATION_LENGTH = 200;
const MAX_CAPTCHA_TOKEN_LENGTH = 4096;
const DUPLICATE_WINDOW_MS = 60 * 1000;

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || null)
    .nullable()
    .optional();

const payloadSchema = z
  .object({
    portfolio_user_id: z.string().uuid(),
    requester_name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
    requester_email: z.string().trim().email().max(254),
    event_date: z.string().regex(datePattern),
    event_end_date: z.string().regex(datePattern).nullable().optional(),
    event_start_time: z.string().regex(timePattern),
    event_end_time: z.string().regex(timePattern),
    location: z.string().trim().min(1).max(MAX_LOCATION_LENGTH),
    budget: z.number().finite().nonnegative().max(1_000_000).nullable().optional(),
    phone: optionalTrimmedString(40),
    event_name: optionalTrimmedString(200),
    event_description: optionalTrimmedString(MAX_TEXT_LENGTH),
    special_requirements: optionalTrimmedString(MAX_TEXT_LENGTH),
    captcha_token: optionalTrimmedString(MAX_CAPTCHA_TOKEN_LENGTH),
    company_website: optionalTrimmedString(200),
  })
  .strict();

type SubmitBookingRequestPayload = z.infer<typeof payloadSchema>;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

const isMissingColumnError = (error: unknown, columnName: string) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST204" && message.includes(columnName);
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const validateBookingWindow = (
  payload: SubmitBookingRequestPayload
): string | null => {
  const eventEndDate = payload.event_end_date ?? payload.event_date;

  if (eventEndDate < payload.event_date) {
    return "event_end_date must be on or after event_date";
  }

  if (
    eventEndDate === payload.event_date &&
    timeToMinutes(payload.event_end_time) <= timeToMinutes(payload.event_start_time)
  ) {
    return "event_end_time must be later than event_start_time for single-day bookings";
  }

  return null;
};

serve(async (req) => {
  const context = createRequestContext(req, "submit-booking-request");
  const requestId = context.requestId;

  if (req.method === "OPTIONS") {
    return emptyResponse(context);
  }

  const clientIp = getClientIpAddress(req);
  const userAgent = req.headers.get("user-agent")?.trim() || null;

  try {
    const payload = payloadSchema.parse(await req.json());
    const bookingWindowError = validateBookingWindow(payload);

    if (bookingWindowError) {
      return jsonResponse(context, 400, { error: bookingWindowError });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(context, 500, {
        error: "Server configuration is incomplete",
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const abuseProtectionSalt =
      Deno.env.get("BOOKING_REQUEST_RATE_LIMIT_SALT")?.trim() || serviceRoleKey;

    const { data: portfolioSettings, error: portfolioError } = await supabase
      .from("portfolio_settings")
      .select("user_id, is_public")
      .eq("user_id", payload.portfolio_user_id)
      .eq("is_public", true)
      .maybeSingle();

    if (portfolioError) {
      console.error("[submit-booking-request] Failed to verify public portfolio:", portfolioError);
      await reportFunctionError(context, portfolioError, {
        status: 500,
        message: "Unable to verify booking target",
      });
      return jsonResponse(context, 500, { error: "Unable to verify booking target" });
    }

    if (!portfolioSettings) {
      return jsonResponse(context, 404, {
        error: "This booking page is not available for public requests",
      });
    }

    const now = Date.now();
    const duplicateCutoff = new Date(now - DUPLICATE_WINDOW_MS).toISOString();

    const normalizedEmail = payload.requester_email.trim().toLowerCase();
    const normalizedLocation = payload.location.trim();
    const emailHash = await sha256Hex(
      `${payload.portfolio_user_id}:${normalizedEmail}`,
      abuseProtectionSalt
    );
    const ipHash = clientIp
      ? await sha256Hex(clientIp, abuseProtectionSalt)
      : null;
    const userAgentHash = userAgent
      ? await sha256Hex(userAgent, abuseProtectionSalt)
      : null;

    const logAttempt = async (
      outcome: "pending" | "accepted" | "duplicate" | "rate_limited" | "bot_rejected" | "invalid" | "failed",
      rejectionReason?: string | null,
      bookingRequestId?: string | null
    ) => {
      const { error } = await supabase
        .from("booking_request_attempts")
        .upsert(
          {
            request_id: requestId,
            portfolio_user_id: payload.portfolio_user_id,
            requester_email_hash: emailHash,
            ip_hash: ipHash,
            user_agent_hash: userAgentHash,
            outcome,
            rejection_reason: rejectionReason ?? null,
            booking_request_id: bookingRequestId ?? null,
          },
          { onConflict: "request_id" }
        );

      if (error) {
        console.error(
          `[submit-booking-request][${requestId}] Failed to persist abuse-protection attempt log:`,
          error
        );
      }
    };

    if (payload.company_website) {
      console.warn(
        `[submit-booking-request][${requestId}] Honeypot field was filled; dropping request`
      );
      await logAttempt("bot_rejected", "honeypot_triggered");
      return jsonResponse(context, 200, {
        success: true,
        requestId,
      });
    }

    const turnstileResult = await verifyTurnstileToken({
      token: payload.captcha_token ?? "",
      remoteIp: clientIp,
    });

    if (!turnstileResult.success) {
      const rejectionReason = turnstileResult.enforced
        ? `captcha_failed:${turnstileResult.errors.join(",") || "unknown"}`
        : "captcha_unavailable";

      console.warn(
        `[submit-booking-request][${requestId}] Verification failed: ${rejectionReason}`
      );
      await logAttempt("bot_rejected", rejectionReason);
      return jsonResponse(context, 403, {
        error: "Verification failed. Please refresh and try again.",
        requestId,
      });
    }

    const { data: reservationResult, error: reservationError } = await (supabase as any)
      .rpc("reserve_booking_request_attempt", {
        p_request_id: requestId,
        p_portfolio_user_id: payload.portfolio_user_id,
        p_requester_email_hash: emailHash,
        p_ip_hash: ipHash,
        p_user_agent_hash: userAgentHash,
      })
      .single();

    if (reservationError) {
      console.error(
        `[submit-booking-request][${requestId}] Failed to reserve booking request attempt:`,
        reservationError
      );
      await reportFunctionError(context, reservationError, {
        status: 500,
        message: "Unable to validate booking request",
      });
      return jsonResponse(context, 500, {
        error: "Unable to validate booking request",
        requestId,
      });
    }

    if (!reservationResult?.allowed) {
      console.warn(
        `[submit-booking-request][${requestId}] Rate limit rejected booking attempt: ${reservationResult?.rejection_reason ?? "unknown"}`
      );
      return jsonResponse(context, 429, {
        error: "Too many booking requests were submitted recently. Please try again later.",
        requestId,
      });
    }

    const { data: duplicateSubmission, error: duplicateError } = await supabase
      .from("booking_requests")
      .select("id")
      .eq("portfolio_user_id", payload.portfolio_user_id)
      .eq("requester_email", normalizedEmail)
      .eq("event_date", payload.event_date)
      .eq("event_start_time", payload.event_start_time)
      .eq("event_end_time", payload.event_end_time)
      .eq("location", normalizedLocation)
      .gte("created_at", duplicateCutoff)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        `[submit-booking-request][${requestId}] Failed duplicate check:`,
        duplicateError
      );
      await (supabase as any).rpc("finalize_booking_request_attempt", {
        p_request_id: requestId,
        p_outcome: "failed",
        p_rejection_reason: "duplicate_check_failed",
      });
      await reportFunctionError(context, duplicateError, {
        status: 500,
        message: "Unable to validate booking request",
      });
      return jsonResponse(context, 500, {
        error: "Unable to validate booking request",
        requestId,
      });
    }

    if (duplicateSubmission) {
      console.warn(
        `[submit-booking-request][${requestId}] Duplicate booking attempt detected`
      );
      await (supabase as any).rpc("finalize_booking_request_attempt", {
        p_request_id: requestId,
        p_outcome: "duplicate",
        p_rejection_reason: "duplicate_submission",
      });
      return jsonResponse(context, 409, {
        error: "A similar booking request was just submitted. Please wait before trying again.",
        requestId,
      });
    }

    const insertPayload = {
      portfolio_user_id: payload.portfolio_user_id,
      requester_name: payload.requester_name.trim(),
      requester_email: normalizedEmail,
      event_date: payload.event_date,
      event_end_date: payload.event_end_date ?? payload.event_date,
      event_start_time: payload.event_start_time,
      event_end_time: payload.event_end_time,
      location: normalizedLocation,
      budget: payload.budget ?? null,
      phone: payload.phone ?? null,
      event_name: payload.event_name ?? null,
      event_description: payload.event_description ?? null,
      special_requirements: payload.special_requirements ?? null,
      status: BOOKING_REQUEST_STATUS.pending,
    };

    let insertResult = await supabase
      .from("booking_requests")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertResult.error && isMissingColumnError(insertResult.error, "event_end_date")) {
      const fallbackPayload = { ...insertPayload } as Record<string, unknown>;
      delete fallbackPayload.event_end_date;

      insertResult = await supabase
        .from("booking_requests")
        .insert(fallbackPayload)
        .select("*")
        .single();
    }

    if (insertResult.error) {
      console.error(
        `[submit-booking-request][${requestId}] Failed to create booking request:`,
        insertResult.error
      );
      await (supabase as any).rpc("finalize_booking_request_attempt", {
        p_request_id: requestId,
        p_outcome: "failed",
        p_rejection_reason: "booking_insert_failed",
      });
      await reportFunctionError(context, insertResult.error, {
        status: 500,
        message: "Failed to create booking request",
      });
      return jsonResponse(context, 500, {
        error: getErrorMessage(insertResult.error),
        requestId,
      });
    }

    await (supabase as any).rpc("finalize_booking_request_attempt", {
      p_request_id: requestId,
      p_outcome: "accepted",
      p_booking_request_id: insertResult.data.id,
    });

    return jsonResponse(context, 200, {
      success: true,
      requestId,
      bookingRequest: insertResult.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(
        `[submit-booking-request][${requestId}] Invalid booking payload rejected`
      );
      return jsonResponse(context, 400, {
        error: "Invalid booking request payload",
        requestId,
        details: error.flatten(),
      });
    }

    console.error(`[submit-booking-request][${requestId}] Unexpected error:`, error);
    await reportFunctionError(context, error, {
      status: 500,
      message: "Unexpected error while creating booking request",
    });
    return jsonResponse(context, 500, {
      error: getErrorMessage(error),
      requestId,
    });
  }
});
