export const INVOICE_FUNCTIONS = {
  // `send-invoice-v2` now handles both simple and itemized invoice delivery.
  simple: 'send-invoice-v2',
  itemized: 'send-invoice-v2',
  legacySimple: 'send-invoice',
} as const;

export type InvoiceFunctionName =
  (typeof INVOICE_FUNCTIONS)[keyof typeof INVOICE_FUNCTIONS];

export interface InvoiceArtistPayload {
  name: string;
  email: string;
  companyName?: string;
  companyAddress?: string;
  abn?: string;
}

export interface InvoiceSettingsPayload {
  format: string;
  paymentTerms: number;
  footerNotes: string;
  addGST: boolean;
  absorbPaymentFees?: boolean;
  signature?: string | null;
  signatureType?: 'drawn' | 'typed' | null;
  receiveEmailCopy?: boolean;
  logo?: string | null;
}

export interface InvoiceRequestPayload {
  job: {
    id: string;
    title: string;
    pricing_mode?: string | null;
    contact_email?: string | null;
  };
  artist: InvoiceArtistPayload;
  invoiceSettings: InvoiceSettingsPayload;
  amount: number;
  gstAmount: number;
  bankDetails: Record<string, unknown>;
}

export interface InvoiceSendResponse {
  success: boolean;
  message?: string;
  invoiceNumber?: string;
  error?: string;
}

export const getInvoiceFunctionName = (
  pricingMode?: string | null
): InvoiceFunctionName =>
  pricingMode === 'itemized'
    ? INVOICE_FUNCTIONS.itemized
    : INVOICE_FUNCTIONS.simple;

export const isInvoiceSendResponse = (
  value: unknown
): value is InvoiceSendResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === 'boolean' &&
    (candidate.message === undefined || typeof candidate.message === 'string') &&
    (candidate.invoiceNumber === undefined ||
      typeof candidate.invoiceNumber === 'string') &&
    (candidate.error === undefined || typeof candidate.error === 'string')
  );
};
