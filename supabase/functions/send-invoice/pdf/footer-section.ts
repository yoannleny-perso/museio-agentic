
import { format } from "npm:date-fns@3.6.0";
import type { PDFGenerationOptions } from "./types.ts";

export const renderFooter = (
  doc: any,
  options: PDFGenerationOptions,
  currentY: number,
  invoiceSettings: any,
  bankDetails: any = {},
  formattedInvoiceDate: string
): number => {
  const { margin, normalFontSize, smallFontSize } = options;
  let localY = currentY;

  // Payment instructions
  doc.setFont("helvetica", "bold");
  doc.text("Payment Instructions:", margin, localY);
  localY += 7;
  
  doc.setFont("helvetica", "normal");
  doc.text("Please make payment to:", margin, localY);
  localY += 7;
  
  // Payment details from bankDetails - use exactly as provided by the user
  const accountName = bankDetails?.accountHolderName || "";
  const bsb = bankDetails?.bsbNumber || "";
  const accountNumber = bankDetails?.accountNumber || "";
  
  doc.text(`Account Name: ${accountName}`, margin, localY);
  localY += 7;
  
  doc.text(`BSB: ${bsb}`, margin, localY);
  localY += 7;
  
  doc.text(`Account Number: ${accountNumber}`, margin, localY);
  localY += 20;

  // Footer notes - safely access the property
  if (invoiceSettings && invoiceSettings.footerNotes) {
    doc.setFontSize(smallFontSize);
    doc.text(invoiceSettings.footerNotes, margin, localY);
    localY += 15;
  }
  
  // Add signature if available
  if (invoiceSettings && invoiceSettings.signature) {
    try {
      // Assuming the signature is a base64 data URL
      if (invoiceSettings.signature.startsWith('data:image')) {
        // Extract base64 content from data URL
        const base64Data = invoiceSettings.signature.split(',')[1];
        doc.addImage(
          base64Data,
          "PNG", 
          doc.internal.pageSize.width - margin - 60, 
          localY, 
          50, 
          20
        );
      } else {
        // Handle text signature
        doc.setFontSize(12);
        doc.setFont("times", "italic");
        doc.text(invoiceSettings.signature, doc.internal.pageSize.width - margin - 60, localY + 15);
      }
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
    }
    
    // Add signature line and date
    doc.setDrawColor(100, 100, 100);
    doc.line(
      doc.internal.pageSize.width - margin - 60, 
      localY + 22, 
      doc.internal.pageSize.width - margin, 
      localY + 22
    );
    
    doc.setFontSize(smallFontSize);
    doc.setFont("helvetica", "normal");
    doc.text(
      formattedInvoiceDate, 
      doc.internal.pageSize.width - margin - 30, 
      localY + 27
    );
  }
  
  // Add museioapp.com footer at the very bottom of the page
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8); // Even smaller font for the footer
  doc.setTextColor(150, 150, 150); // Light gray color
  doc.text(
    "Created by museioapp.com",
    doc.internal.pageSize.width / 2,
    pageHeight - margin,
    { align: "center" }
  );
  
  // Reset text color for future text
  doc.setTextColor(0, 0, 0);
  
  return localY;
};
