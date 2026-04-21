import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  client_email: string;
  user_id: string;
  job_id: string;
  last_reminder_sent_at: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting invoice reminder check...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: overdueInvoices, error: queryError } = await supabase
      .from('sent_invoices')
      .select(`
        id,
        invoice_number,
        amount,
        due_date,
        client_email,
        user_id,
        job_id,
        last_reminder_sent_at
      `)
      .eq('status', 'sent')
      .lt('due_date', today)
      .not('due_date', 'is', null);

    if (queryError) {
      console.error("Error fetching overdue invoices:", queryError);
      throw queryError;
    }

    console.log(`Found ${overdueInvoices?.length || 0} overdue invoices`);

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(
        JSON.stringify({ message: "No overdue invoices found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let remindersSent = 0;
    let remindersSkipped = 0;

    for (const invoice of overdueInvoices as OverdueInvoice[]) {
      const { data: settings } = await supabase
        .from('invoice_settings')
        .select('auto_reminders_enabled')
        .eq('user_id', invoice.user_id)
        .single();

      if (!settings?.auto_reminders_enabled) {
        console.log(`Skipping invoice ${invoice.invoice_number} - auto reminders disabled`);
        remindersSkipped++;
        continue;
      }

      if (invoice.last_reminder_sent_at) {
        const lastReminder = new Date(invoice.last_reminder_sent_at);
        if (lastReminder > sevenDaysAgo) {
          console.log(`Skipping invoice ${invoice.invoice_number} - reminder sent recently`);
          remindersSkipped++;
          continue;
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, company_name')
        .eq('id', invoice.user_id)
        .single();

      const senderName = profile?.company_name || 
                        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                        'Your service provider';

      const dueDate = new Date(invoice.due_date);
      const diffTime = new Date().getTime() - dueDate.getTime();
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const emails = invoice.client_email
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      try {
        const emailResponse = await resend.emails.send({
          from: "invoices@audaciangroup.com",
          to: emails,
          subject: `Payment Reminder: Invoice ${invoice.invoice_number} is ${daysOverdue} days overdue`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6E59A5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Payment Reminder</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  This is a friendly reminder that invoice <strong>${invoice.invoice_number}</strong> from ${senderName} is now <strong>${daysOverdue} days overdue</strong>.
                </p>
                
                <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400E;">
                    <strong>Invoice Details:</strong><br>
                    Invoice Number: ${invoice.invoice_number}<br>
                    Amount Due: $${Number(invoice.amount).toFixed(2)} AUD<br>
                    Original Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}<br>
                    Days Overdue: ${daysOverdue} days
                  </p>
                </div>
                
                <p style="font-size: 16px; margin: 20px 0;">
                  Please arrange payment at your earliest convenience. If you have already paid this invoice, please disregard this reminder.
                </p>
                
                <p style="font-size: 16px; margin: 20px 0;">
                  If you have any questions about this invoice, please don't hesitate to reach out to ${senderName}.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                  <p>This is an automated reminder from ${senderName}</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Reminder sent for invoice ${invoice.invoice_number}:`, emailResponse);

        await supabase
          .from('sent_invoices')
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq('id', invoice.id);

        remindersSent++;
      } catch (emailError) {
        console.error(`Failed to send reminder for invoice ${invoice.invoice_number}:`, emailError);
      }
    }

    console.log(`Reminder job complete: ${remindersSent} sent, ${remindersSkipped} skipped`);

    return new Response(
      JSON.stringify({ 
        message: "Reminder check complete",
        remindersSent,
        remindersSkipped,
        totalChecked: overdueInvoices.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: any) {
    console.error("Error in send-invoice-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

serve(handler);
