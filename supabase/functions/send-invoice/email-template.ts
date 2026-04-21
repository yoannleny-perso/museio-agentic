
import { format } from "npm:date-fns@3.6.0";
import { InvoiceRequest } from "./types.ts";

export const createEmailHtml = (
  job: InvoiceRequest["job"],
  artist: InvoiceRequest["artist"],
  formattedInvoiceDate: string
): string => {
  // Times should already be formatted without seconds from the client
  const startTime = job.start_time;
  const endTime = job.end_time;
  
  return `
    <h1>Gig Completion Confirmation</h1>
    <p>Dear ${job.client},</p>
    <p>Thank you for job with ${artist.name}. This email confirms the completion of the gig:</p>
    <ul>
      <li><strong>Gig:</strong> ${job.title}</li>
      <li><strong>Date:</strong> ${formattedInvoiceDate}</li>
      <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
      <li><strong>Location:</strong> ${job.location}</li>
    </ul>
    <p>Please find attached your invoice for this job.</p>
    <p>Best regards,<br>${artist.name}</p>
  `;
};

export const createBasicInvoiceHtml = (
  job: InvoiceRequest["job"],
  artist: InvoiceRequest["artist"],
  invoiceNumber: string,
  amount: number,
  gstAmount: number = 0,
  invoiceSettings: InvoiceRequest["invoiceSettings"] = { 
    format: "INV-{YYYY}{MM}{DD}{NUM}",
    paymentTerms: 14,
    footerNotes: "Thank you for choosing to do business with us",
    addGST: false
  }
): string => {
  // Calculate amounts based on GST setting
  const rate = job.total || amount;
  const subtotal = rate;
  const tax = gstAmount;
  const total = invoiceSettings?.addGST ? (subtotal + tax) : subtotal;
  
  // Format dates for display in DD Mon YYYY format
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + (invoiceSettings?.paymentTerms || 14));
  
  const formattedInvoiceDate = format(today, "dd MMM yyyy");
  const formattedDueDate = format(dueDate, "dd MMM yyyy");

  // Times should already be formatted without seconds from the client
  const startTime = job.start_time;
  const endTime = job.end_time;

  return `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MUSEIO Email Templates</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f2f4f8;
    }
    .email-section {
      margin: 40px auto;
      max-width: 620px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .logo-container {
      text-align: center;
      padding: 20px;
      background-color: #f2f4f8;
    }
    .logo-container img {
      max-width: 200px;
      height: auto;
      max-height: 80px;
      object-fit: contain;
    }
    .email-header {
      background: linear-gradient(90deg, #E9D5FF 0%, #DDD6FE 100%);
      padding: 24px 24px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .email-brand {
      font-weight: bold;
      font-size: 24px;
      color: #ffffff;
    }
    .email-logo {
      max-width: 120px;
      max-height: 60px;
      width: auto;
      height: auto;
    }
    .email-meta {
      text-align: right;
      font-size: 14px;
      color: #374151;
    }
    .email-body {
      padding: 24px;
    }
    .email-body h3 {
      font-size: 20px;
      margin-bottom: 12px;
      color: #111827;
    }
    .email-body p {
      font-size: 15px;
      color: #4B5563;
      margin-bottom: 20px;
    }
    .email-body ul {
      list-style: none;
      padding: 0;
      font-size: 15px;
      color: #111827;
      line-height: 1.8;
    }
    .email-body ul li strong {
      color: #111827;
    }
    .email-footer {
      padding: 24px;
      font-size: 13px;
      color: #6B7280;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    @media only screen and (max-width: 600px) {
      .logo-container img {
        max-width: 150px;
        max-height: 60px;
      }
      .email-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .email-meta {
        text-align: left;
        margin-top: 10px;
      }
      .email-logo {
        max-width: 100px;
        max-height: 50px;
        margin-top: 10px;
      }
    }
  </style>
</head>
<body>

<section class="email-section">
    <div class="logo-container">
      <img 
        src="https://museioapp.com/uploads/825eebcb-29ce-4bfb-8915-6fc531cae0a1.png" 
        alt="Museio Logo"
      />
    </div>
    <div class="email-header" style="background: linear-gradient(90deg, #E9D5FF 0%, #DDD6FE 100%);">
      <div class="email-meta" style="text-align: left;">
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 8px;">Invoice Sent</div>
        <div style="font-size: 14px; color: #4B5563;">${formattedInvoiceDate}</div>
        <div style="font-size: 14px; color: #4B5563;">Total: A$750.00</div>
      </div>
      <div class="email-brand" style="color: #111827;">MUSEIO</div>
    </div>
    <div class="email-body">
      <h3>💼 You have received a new invoice</h3>
      <p>Here's a summary of the completed job and the billing information:</p>
      <ul>
        <li><strong>Event:</strong> ${job.title}</li>
        <li><strong>Date:</strong> ${format(new Date(job.date), "dd MMM yyyy")} </li>
        <li><strong>Time:</strong> ${job.start_time} – ${job.end_time}</li>
        <li><strong>Location:</strong> ${job.location} </li>
        <li><strong>Invoice #:</strong> ${invoiceNumber}</li>
        <li><strong>Name:</strong> ${artist.name} </li>
        <li><strong>Email:</strong> <a href="${artist.email}">${artist.email}</a></li>
        <li><strong>Phone:</strong> ${artist.phone}</li>   
      </ul>
      <p>📎 Your invoice is attached in PDF format.</p>
      <p style="font-style: italic; color: #6B7280;">If you have any questions, please reach out to ${artist.name}.</p>
      <p>Warm regards,<br>
      <strong>Museio Team</strong><br>
      <a href="mailto:support@museioapp.com">support@museioapp.com</a></p>
    </div>
    <div class="email-footer">
      <a href="https://museioapp.com/" style="
        display: inline-block;
        margin-top: 0;
        padding: 10px 18px;
        background: linear-gradient(90deg, #D8B4FE 0%, #C084FC 100%);
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 12px;">
        Discover Museio
      </a>
      <p style="margin-top: 8px; font-size: 13px; color: #6B7280;">
        <span style="font-size: 13px; font-weight: 500;">Transform your <strong>Passion</strong> into a <strong>Business</strong></span>
      </p>
      <p style="margin-top: 16px; font-size: 13px; color: #6B7280;">
        <span style="font-size: 12px;">This email was automatically generated by <strong>MuseioApp</strong>.</span>
      </p>
    </div>
  </section>
  </body>
</html>
  `;
};
