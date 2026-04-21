
// Types for the email service
export interface EmailResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

export interface EmailHtmlResponse {
  success: boolean;
  data?: EmailResponse;
  error?: {
    message: string;
    statusCode: number;
  };
}

// Type for the resend action/request
export interface ResendAction {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

// PDF data structure for generating invoices
export interface PdfData {
  job: {
    id: string;
    title: string;
    date: string;
    client: string;
    contact_email: string;
    location: string;
  };
  artist: {
    name: string;
    email: string;
    companyName?: string;
    companyAddress?: string;
    abn?: string;
  };
  invoiceSettings: {
    format: string;
    paymentTerms: number;
    footerNotes?: string;
    addGST: boolean;
    signature?: string;
    receiveEmailCopy?: boolean;
  };
  invoiceNumber: string;
  amount: number;
  gstAmount: number;
  bankDetails: {
    accountHolderName: string;
    bsbNumber: string;
    accountNumber: string;
  };
  dueDate: string;
}

// Define interfaces for request and response data
export interface Artist {
  name: string;
  email: string;
  phone?: string;
  artistName?: string;
}

export interface job {
  id: string;
  title: string;
  client: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  formattedDate: string;
  contact_email: string;
  total: string; // Changed from number to string since it's formatted with toFixed(2)
}

export interface InvoiceSettings  { 
    format : string,
    paymentTerms: number
    footerNotes: string,
    addGST: boolean
  }

export interface InvoiceRequest {
  job: job;
  artist: Artist;
  invoiceSettings: InvoiceSettings;
}
