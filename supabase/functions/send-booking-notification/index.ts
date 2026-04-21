import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  formatDateOnlyRangeForLocale,
} from "../../../src/contracts/dateOnly.ts";
import { buildCorsHeaders, escapeHtml } from "../_shared/security.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface BookingNotificationRequest {
  bookingRequest: {
    id: string;
    event_name: string;
    event_date: string;
    event_end_date?: string | null;
    event_start_time: string;
    event_end_time: string;
    location: string;
    event_description: string;
    requester_name: string;
    requester_email: string;
    phone?: string | null;
    budget?: number;
    special_requirements?: string;
  };
  portfolioOwner: {
    email?: string;
    name?: string;
    nickname?: string;
    username?: string;
  };
}


const createBookingNotificationEmail = (data: BookingNotificationRequest) => {
  const { bookingRequest, portfolioOwner } = data;
  const appUrl =
    Deno.env.get("APP_URL") ||
    Deno.env.get("PUBLIC_APP_URL") ||
    Deno.env.get("SITE_URL") ||
    "https://museioapp.com";
  const jobsUrl = `${appUrl.replace(/\/+$/, "")}/app/jobs`;
  const formattedDate = formatDateOnlyRangeForLocale(
    bookingRequest.event_date,
    bookingRequest.event_end_date,
    'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
  const formatTimeRange = () => {
    if (!bookingRequest.event_start_time || !bookingRequest.event_end_time) {
      return '';
    }

    return `${formatTime(bookingRequest.event_start_time)} - ${formatTime(bookingRequest.event_end_time)}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">New Booking Request</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">You've received a new booking inquiry</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: #334155; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Event Details</h2>
            
            <div style="display: grid; gap: 20px;">
              <div>
                <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Event Name</strong>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 500;">${escapeHtml(bookingRequest.event_name)}</p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Date</strong>
                  <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;">${escapeHtml(formattedDate)}</p>
                </div>
                <div>
                  <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Time</strong>
                  <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;">${escapeHtml(formatTimeRange())}</p>
                </div>
              </div>
              
              <div>
                <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Location</strong>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;">${escapeHtml(bookingRequest.location)}</p>
              </div>
              
              ${bookingRequest.budget ? `
              <div>
                <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Budget</strong>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;">$${bookingRequest.budget}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <h3 style="color: #334155; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Client Information</h3>
            
            <div style="display: grid; gap: 15px;">
              <div>
                <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Name</strong>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;">${escapeHtml(bookingRequest.requester_name)}</p>
              </div>
              
              <div>
                <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Email</strong>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;"><a href="mailto:${escapeHtml(bookingRequest.requester_email)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(bookingRequest.requester_email)}</a></p>
              </div>
              
              ${bookingRequest.phone ? `
              <div>
                <strong style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</strong>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px;"><a href="tel:${escapeHtml(bookingRequest.phone)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(bookingRequest.phone)}</a></p>
              </div>
              ` : ''}
            </div>
          </div>

          ${bookingRequest.event_description ? `
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Event Description</h3>
            <p style="margin: 0; color: #1e293b; font-size: 16px; line-height: 1.6;">${escapeHtml(bookingRequest.event_description)}</p>
          </div>
          ` : ''}

          ${bookingRequest.special_requirements ? `
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Special Requirements</h3>
            <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">${escapeHtml(bookingRequest.special_requirements)}</p>
          </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 40px;">
            <a href="${jobsUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              View Booking Requests
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              This email was sent because you received a new booking request through your public booking page.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: BookingNotificationRequest = await req.json();
    console.log('[send-booking-notification] Incoming notification request');

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve portfolio owner email/name if missing using username
    let ownerEmail = requestData.portfolioOwner.email;
    let ownerName = requestData.portfolioOwner.name;
    let ownerNickname = requestData.portfolioOwner.nickname;

    if (!ownerEmail && requestData.portfolioOwner.username) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, nickname')
        .eq('username', requestData.portfolioOwner.username)
        .maybeSingle();

      if (error) {
        console.error('[send-booking-notification] Failed to fetch profile by username:', error);
      }

      if (profile) {
        ownerEmail = profile.email ?? ownerEmail;
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
        ownerName = ownerName || fullName || profile.nickname || requestData.portfolioOwner.username || 'Portfolio Owner';
        ownerNickname = ownerNickname || profile.nickname || requestData.portfolioOwner.username || 'Artist';
      }
    }

    if (!ownerEmail) {
      console.error('[send-booking-notification] No recipient email could be resolved');
      return new Response(JSON.stringify({ success: false, error: 'Recipient email not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('[send-booking-notification] Sending to:', ownerEmail);

    const enrichedData: BookingNotificationRequest = {
      bookingRequest: requestData.bookingRequest,
      portfolioOwner: {
        email: ownerEmail,
        name: ownerName || 'Portfolio Owner',
        nickname: ownerNickname || 'Artist',
      },
    };

    const emailContent = createBookingNotificationEmail(enrichedData);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Bookings <noreply@museioapp.com>",
      to: [ownerEmail],
      subject: `New Booking Request: ${requestData.bookingRequest.event_name}`,
      html: emailContent,
    });


    console.log('[send-booking-notification] Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Booking notification sent successfully',
        data: emailResponse 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('[send-booking-notification] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send booking notification' 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
