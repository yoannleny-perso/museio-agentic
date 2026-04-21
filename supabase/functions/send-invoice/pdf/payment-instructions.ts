
import type { PDFGenerationOptions } from "./types.ts";

export const renderPaymentInstructions = (
  doc: any,
  options: PDFGenerationOptions,
  currentY: number,
  bankDetails: any
): number => {
  const { margin, subheaderFontSize, normalFontSize } = options;
  let localY = currentY;
  
  // Payment Instructions header
  doc.setFontSize(subheaderFontSize);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Instructions:", margin, localY);
  localY += 7;
  
  // Payment Instructions content
  doc.setFontSize(normalFontSize);
  doc.setFont("helvetica", "normal");
  doc.text("Please make payment to:", margin, localY);
  localY += 6;
  
  // Bank account details - use exactly as provided, no defaults or placeholders
  doc.text(`Account Name: ${bankDetails?.accountHolderName || ''}`, margin, localY);
  localY += 6;
  
  doc.text(`BSB: ${bankDetails?.bsbNumber || ''}`, margin, localY);
  localY += 6;
  
  doc.text(`Account Number: ${bankDetails?.accountNumber || ''}`, margin, localY);
  localY += 10;
  
  return localY;
};
