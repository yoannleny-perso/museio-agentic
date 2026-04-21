
// Export the InvoiceSettings type
export interface InvoiceSettings {
  format: string;
  paymentTerms: number;
  footerNotes: string;
  logo?: string;
  addGST: boolean;
  autoRemindersEnabled: boolean;
  absorbPaymentFees: boolean;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  format: "INV-{YYYY}{MM}{DD}{NUM}",
  paymentTerms: 14,
  footerNotes: "Thank you for choosing to do business with us",
  addGST: false,
  autoRemindersEnabled: false,
  absorbPaymentFees: false
};

