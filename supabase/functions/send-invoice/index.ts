
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "./cors.ts";
import { validateAndPrepareData, formatInvoiceDates, sendInvoiceEmail } from "./handlers.ts";
import { generateInvoicePDF } from "./pdf-generator.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const handler = async (req: Request): Promise<Response> => {
  
  // Handle CORS preflight requests - this must come first!
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY environment variable is not set!");
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    
    // Initialize Resend with the API key
    const resend = new Resend(apiKey);
    
    // Initialize Supabase client with service role key for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize another client with anon key for user authentication
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the Authorization header to extract the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    // Parse and validate the request data
    let requestData;
    try {
      requestData = await req.json();
      console.log("Received invoice request for job:", requestData?.job?.title);
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      throw new Error(`Invalid JSON in request: ${parseError.message}`);
    }
    
    const processStartTime = Date.now();
    
    try {
      // Step 1: Validate and prepare data
      console.log("Validating request data...");
      const {
        job,
        artist,
        invoiceSettings,
        amount,
        gstAmount,
        bankDetails
      } = validateAndPrepareData(requestData);
      
      // Step 2: Authenticate user using anon client
      console.log("Authenticating user...");
      const { data: authUser, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
      
      if (authError || !authUser.user) {
        console.error("Authentication failed:", authError);
        throw new Error('Authentication failed');
      }
      
      console.log("User authenticated:", authUser.user.id);
      
      // Step 3: Generate atomic invoice number using service role client with user ID
      console.log("Generating sequential invoice number...");
      const { data: invoiceNumber, error: invoiceError } = await supabase
        .rpc('generate_invoice_number_for_user', { 
          format_string: invoiceSettings.format,
          p_user_id: authUser.user.id
        });
      
      if (invoiceError) {
        console.error("Error generating invoice number:", invoiceError);
        throw new Error(`Failed to generate invoice number: ${invoiceError.message}`);
      }
      
      if (!invoiceNumber) {
        throw new Error("No invoice number returned from database function");
      }
      
      console.log("Generated sequential invoice number:", invoiceNumber);

      // Step 4: Format dates
      const { formattedInvoiceDate, formattedDueDate } = formatInvoiceDates(invoiceSettings);
      
      // Step 5: Prepare data for PDF generation
      const pdfData = {
        job,
        artist,
        invoiceSettings,
        invoiceNumber,
        amount,
        gstAmount,
        bankDetails,
        gst: invoiceSettings.addGST,
        dueDate: formattedDueDate
      };

      // Step 6: Generate PDF invoice
      console.log("Generating invoice PDF...");
      const pdfStartTime = Date.now();
      let pdfBase64;
      try {
        pdfBase64 = await generateInvoicePDF(pdfData);
        console.log(`PDF generation completed in ${Date.now() - pdfStartTime}ms`);
        
        if (!pdfBase64 || pdfBase64.length < 100) {
          throw new Error("PDF generation failed - output is too small or empty");
        }
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        throw new Error(`Failed to generate invoice PDF: ${pdfError.message}`);
      }

      // Step 7: Send the invoice email with PDF attachment
      console.log("Sending invoice email to client:", job.contact_email);
      
      // Check if we should CC the artist
      const shouldCopyArtist = invoiceSettings.receiveEmailCopy === true && artist.email;
      if (shouldCopyArtist) {
        console.log("Will CC artist at:", artist.email);
      }
      
      const total = invoiceSettings.addGST ? (amount + gstAmount) : amount;
      try {
        await sendInvoiceEmail(
          resend,
          job, 
          artist, 
          invoiceNumber, 
          total,
          invoiceSettings,
          pdfBase64,
          shouldCopyArtist
        );
        console.log("Invoice email sent successfully");
      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError);
        throw new Error(`Email sending failed: ${emailError.message}`);
      }

      // Step 8: Record the sent invoice in the database using service role client
      try {
        console.log("Recording sent invoice in database...");
        const { error: insertError } = await supabase
          .from('sent_invoices')
          .insert({
            user_id: authUser.user.id,
            invoice_number: invoiceNumber,
            amount: total,
            job_id: job.id,
            client_email: job.contact_email,
            status: 'sent'
          });
        
        if (insertError) {
          console.error("Error recording invoice in database:", insertError);
          // Don't fail the whole operation if only the recording fails
          console.log("Continuing despite database recording error...");
        } else {
          console.log("Invoice recorded successfully in database");
        }
      } catch (dbError) {
        console.error("Error recording invoice in database:", dbError);
        // Continue execution - we don't want to fail the whole operation
        // if only the recording part fails
      }
      
      const totalTime = Date.now() - processStartTime;
      console.log(`Invoice process completed successfully in ${totalTime}ms`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invoice sent successfully",
          invoiceNumber
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (operationError) {
      console.error("Operation error:", operationError);
      throw new Error(`Operation failed: ${operationError.message}`);
    }
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
