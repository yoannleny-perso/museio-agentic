
import { format } from "npm:date-fns@3.6.0";
import type { PDFGenerationOptions } from "./types.ts";

export const renderHeader = (
  doc: any,
  options: PDFGenerationOptions,
  currentY: number,
  invoiceNumber: string,
  dueDateString: string,
  invoiceSettings: any
): number => {
  const { margin, headerFontSize, normalFontSize } = options;
  let localY = currentY;

  // Only add logo if it's defined
  if (invoiceSettings.logo) {
    try {
      // Extract base64 content from data URL if it's a data URL
      const base64Logo = invoiceSettings.logo.startsWith('data:image') 
        ? invoiceSettings.logo.split(',')[1] 
        : invoiceSettings.logo;
      
      doc.addImage(
        base64Logo,
        "PNG",
        margin,
        localY,
        40,
        20
      );
      
      // Move current position to below logo for next content
      localY = 30;
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
      // If logo fails, just continue without it
      localY = margin;
    }
  } else {
    // No logo - just start at top
    localY = 30;
  }

  // HEADER SECTION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(normalFontSize);
  doc.text("INVOICE", 120, localY);
  localY += 1;

  // Invoice details
  doc.setFontSize(normalFontSize);
  doc.setFont("helvetica", "normal");
  doc.setAlign("right");
  doc.text(`Invoice Number: ${invoiceNumber}`, 120, localY);
  localY += 7;
  
  // Use current date for the issue date
  const currentDate = new Date();
  doc.text(`Date of Issue: ${format(currentDate, "MMMM d, yyyy")}`, 120, localY);
  localY += 7;
  
  // Use the formatted due date string that's passed in
  doc.text(`Due Date: ${dueDateString}`, 120, localY);
  localY += 7;
  
  return Math.max(localY, 70); // Ensure we're below the logo
};
