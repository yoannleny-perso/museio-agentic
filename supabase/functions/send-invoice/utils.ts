
import { format, addDays } from "npm:date-fns@3.6.0";

/**
 * Validate and prepare the data for sending an invoice
 */
export function validateAndPrepareData(requestData: any): {
  job: any;
  artist: any;
  invoiceSettings: any;
  invoiceNumber: string;
  amount: number;
  gstAmount: number;
  bankDetails: any;
} {
  const { job, artist, invoiceSettings, invoiceNumber, amount, gstAmount, bankDetails } = requestData;
  
  // Validate required fields
  if (!job) throw new Error("Job data is required");
  if (!job.contact_email) throw new Error("Client email is required");
  
  // Log the data received
  console.log("Job data:", job.id, job.title);
  console.log("Artist data:", artist || {});
  console.log("Invoice settings:", invoiceSettings || { 
    footerNotes: "Thank you for your business.",
    paymentTerms: 14,
    addGST: false 
  });
  console.log("Bank details:", bankDetails || {});
  
  // Use provided invoice number or generate fallback
  const finalInvoiceNumber = invoiceNumber || `INV-${Date.now().toString().slice(-8)}`;
  
  // Use provided amount or fall back to job rate
  const finalAmount = amount || job.rate || 0;
  
  // Calculate GST if needed
  const finalGstAmount = gstAmount !== undefined ? 
    gstAmount : 
    (invoiceSettings?.addGST ? finalAmount * 0.1 : 0);
  
  return {
    job,
    artist: artist || { name: null, email: null },
    invoiceSettings: invoiceSettings || { 
      footerNotes: "Thank you for your business.",
      paymentTerms: 14,
      addGST: false 
    },
    invoiceNumber: finalInvoiceNumber,
    amount: finalAmount,
    gstAmount: finalGstAmount,
    bankDetails: bankDetails || {}
  };
}

/**
 * Format the invoice dates based on settings
 */
export function formatInvoiceDates(invoiceSettings: any): {
  formattedInvoiceDate: string;
  formattedDueDate: string;
} {
  const today = new Date();
  const dueDate = addDays(today, invoiceSettings?.paymentTerms || 14);
  
  return {
    formattedInvoiceDate: format(today, "MMMM d, yyyy"),
    formattedDueDate: format(dueDate, "MMMM d, yyyy")
  };
}
