
import type { PDFGenerationOptions } from "./types.ts";

export const renderBillingInfo = (
  doc: any,
  options: PDFGenerationOptions,
  currentY: number,
  artist: any,
  job: any
): number => {
  const { margin, subheaderFontSize, normalFontSize } = options;
  let localY = currentY;
  
  // From section
  doc.setFontSize(subheaderFontSize);
  doc.setFont("helvetica", "bold");
  doc.text("From:", margin, localY);
  
  // To section
  doc.text("Bill To:", 120, localY);
  localY += 7;
  
  // From details
  doc.setFontSize(normalFontSize);
  doc.setFont("helvetica", "normal");
  
  // To details
  doc.text(job.client, 120, localY);
  localY += 6;

  // Artist company details if available
  if (artist.companyName) {
    doc.text(artist.companyName, margin, localY);
    localY += 6;
  }
  
  if (artist.companyAddress) {
    doc.text(artist.companyAddress, margin, localY);
    localY += 6;
  }
  
  if (artist.abn) {
    doc.text(`ABN: ${artist.abn}`, margin, localY);
    localY += 6;
  }

  // Reset Y position for client details column
  let clientY = localY - 6;
  if (job.contact_email) {
    doc.text(job.contact_email, 120, clientY);
    clientY += 6;
  }
  
  doc.text(job.location, 120, clientY);
  
  // Update current Y to be the max of both columns
  localY = Math.max(localY, clientY) + 10;
  
  return localY;
};
