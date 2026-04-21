import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createJobCancelationEmail } from "./email-template-cancel.ts";
import { createJobConfirmationEmail } from "./email-template-confirmation.ts";
import { createJobUpdateEmail } from "./email-template-update.ts";
import { JobConfirmationRequest } from "./types.ts";
import { validateRequestData } from "./validators.ts";
import {
  createRequestContext,
  emptyResponse,
  jsonResponse,
  reportFunctionError,
} from "../_shared/observability.ts";

const handler = async (req: Request): Promise<Response> => {
  const context = createRequestContext(req, "send-job-confirmation");

  if (req.method === "OPTIONS") {
    return emptyResponse(context);
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return jsonResponse(context, 401, { success: false, error: "Unauthorized" });
    }

    const requestData = await req.json() as JobConfirmationRequest;
    const validation = validateRequestData(requestData);
    if (!validation.isValid) {
      return validation.response!;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: authUser, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authUser?.user) {
      return jsonResponse(context, 401, { success: false, error: "Unauthorized" });
    }

    const authenticatedUserId = authUser.user.id;

    if (requestData.userId && requestData.userId !== authenticatedUserId) {
      return jsonResponse(context, 403, { success: false, error: "Forbidden" });
    }

    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id, title, client, location, date, start_time, end_time, contact_email, rate")
      .eq("id", requestData.job.id)
      .eq("user_id", authenticatedUserId)
      .maybeSingle();

    if (jobError) {
      throw new Error(`Unable to verify job ownership: ${jobError.message}`);
    }

    if (!jobRow) {
      return jsonResponse(context, 404, { success: false, error: "Job not found" });
    }

    const validatedData: JobConfirmationRequest = {
      ...requestData,
      userId: authenticatedUserId,
      job: {
        ...requestData.job,
        id: jobRow.id,
        title: jobRow.title,
        client: jobRow.client,
        location: jobRow.location,
        date: jobRow.date,
        start_time: jobRow.start_time,
        end_time: jobRow.end_time,
        contact_email: jobRow.contact_email || requestData.job.contact_email,
        total: requestData.job.total,
      },
    };

    const { data: notificationSettings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("send_job_confirmation, send_job_updates, send_job_cancellations")
      .eq("user_id", authenticatedUserId)
      .maybeSingle();

    if (!settingsError && notificationSettings) {
      if (
        (validatedData.action === "created" && notificationSettings.send_job_confirmation === false) ||
        (validatedData.action === "updated" && notificationSettings.send_job_updates === false) ||
        (validatedData.action === "cancelled" && notificationSettings.send_job_cancellations === false)
      ) {
        return jsonResponse(context, 200, {
            success: true,
            message: `Email skipped - user has disabled ${validatedData.action} notifications`,
          });
      }
    }

    if (!RESEND_API_KEY) {
      return jsonResponse(context, 200, {
          success: true,
          skipped: true,
          message: "Email skipped - RESEND_API_KEY is not configured for this environment",
        });
    }

    let emailContent: string;
    if (validatedData.action === "created") {
      emailContent = createJobConfirmationEmail(validatedData);
    } else if (validatedData.action === "updated") {
      emailContent = createJobUpdateEmail(validatedData);
    } else if (validatedData.action === "cancelled") {
      emailContent = createJobCancelationEmail(validatedData);
    } else {
      throw new Error(`Unsupported action type: ${validatedData.action}`);
    }

    const resendPayload: Record<string, unknown> = {
      from: "Museio Job <job@museioapp.com>",
      to: [validatedData.job.contact_email],
      subject: `Job ${validatedData.action}: ${validatedData.job.title}`,
      html: emailContent,
    };

    const shouldCopyArtist =
      validatedData.receiveEmailCopy === true && validatedData.artist.email;
    if (shouldCopyArtist) {
      resendPayload.cc = [validatedData.artist.email];
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendResult)}`);
    }

    return jsonResponse(context, 200, {
      success: true,
      message: "Confirmation email sent successfully",
    });
  } catch (error: any) {
    await reportFunctionError(context, error, {
      status: 500,
      message: "Error in send-job-confirmation function",
    });
    return jsonResponse(context, 500, {
      success: false,
      error: error.message,
    });
  }
};

serve(handler);
