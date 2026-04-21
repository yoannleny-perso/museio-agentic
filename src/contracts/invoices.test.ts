import { describe, expect, it } from 'vitest';

import {
  INVOICE_FUNCTIONS,
  getInvoiceFunctionName,
  isInvoiceSendResponse,
} from './invoices';

describe('invoice contracts', () => {
  it('routes both simple and itemized invoices through the v2 sender', () => {
    expect(getInvoiceFunctionName('simple')).toBe(INVOICE_FUNCTIONS.simple);
    expect(getInvoiceFunctionName('itemized')).toBe(INVOICE_FUNCTIONS.itemized);
    expect(getInvoiceFunctionName(null)).toBe(INVOICE_FUNCTIONS.simple);
  });

  it('validates invoice send responses defensively', () => {
    expect(
      isInvoiceSendResponse({
        success: true,
        message: 'sent',
        invoiceNumber: 'INV-1001',
      })
    ).toBe(true);

    expect(
      isInvoiceSendResponse({
        success: 'yes',
      })
    ).toBe(false);

    expect(isInvoiceSendResponse(null)).toBe(false);
  });
});
