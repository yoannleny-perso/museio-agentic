
import type { PDFGenerationOptions } from "./types.ts";

export const renderPaymentSummary = (
  doc: any,
  options: PDFGenerationOptions,
  currentY: number,
  finalAmount: number,
  finalGstAmount: number,
  invoiceSettings: any
): number => {
  const { margin, normalFontSize } = options;
  let localY = currentY;

  // Calculate the total here instead of receiving it as a parameter
  const total = invoiceSettings.addGST ? finalAmount + finalGstAmount : finalAmount;

  // Payment details section
  doc.setFontSize(normalFontSize);
  doc.setDrawColor(200, 200, 200);
  doc.line(
    doc.internal.pageSize.width - margin - 80, 
    localY, 
    doc.internal.pageSize.width - margin, 
    localY
  );
  localY += 5;
  
  // Totals section
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", doc.internal.pageSize.width - margin - 80, localY + 5);
  doc.text(`$${finalAmount.toFixed(2)}`, doc.internal.pageSize.width - margin - 25, localY + 5, { align: "right" });
  localY += 7;
  
  // GST line (only show if we're adding GST)
  if (invoiceSettings.addGST && finalGstAmount > 0) {
    doc.text("GST (10%):", doc.internal.pageSize.width - margin - 80, localY + 5);
    doc.text(`$${finalGstAmount.toFixed(2)}`, doc.internal.pageSize.width - margin - 25, localY + 5, { align: "right" });
    localY += 7;
  }
  
  // Total and balance due
  doc.line(
    doc.internal.pageSize.width - margin - 80, 
    localY, 
    doc.internal.pageSize.width - margin, 
    localY
  );
  localY += 5;
  
  doc.setFont("helvetica", "bold");
  doc.text("Total:", doc.internal.pageSize.width - margin - 80, localY + 5);
  doc.text(`$${total.toFixed(2)}`, doc.internal.pageSize.width - margin - 25, localY + 5, { align: "right" });
  localY += 15;
  
  return localY;
};
