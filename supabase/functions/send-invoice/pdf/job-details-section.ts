
import { format } from "npm:date-fns@3.6.0";
import type { PDFGenerationOptions } from "./types.ts";

export const renderJobDetails = (
  doc: any,
  options: PDFGenerationOptions,
  currentY: number,
  job: any
): number => {
  const { margin, normalFontSize, smallFontSize } = options;
  let localY = currentY;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, localY, doc.internal.pageSize.width - (margin * 2), 10, "F");
  
  doc.setFont("helvetica", "bold");
  doc.text("Description", margin + 5, localY + 7);
  doc.text("Amount", doc.internal.pageSize.width - margin - 25, localY + 7, { align: "right" });
  localY += 10;

  // Invoice item
  doc.setFont("helvetica", "normal");
  const description = `${job.title} at ${job.location}`;
  doc.text(description, margin + 5, localY + 7);
  doc.text(`$${job.rate.toFixed(2)}`, doc.internal.pageSize.width - margin - 25, localY + 7, { align: "right" });
  localY += 7;
  
  // Add job number if provided
  if (job.job_number) {
    doc.text(`Job Number: ${job.job_number}`, margin + 5, localY + 7);
    localY += 5;
  }
  
  // Add job description if provided and not empty
  if (job.job_description && job.job_description.trim() !== '') {
    // Handle wrapping text for long descriptions
    const splitDescription = doc.splitTextToSize(job.job_description, doc.internal.pageSize.width - (margin * 2) - 50);
    doc.text(splitDescription, margin + 5, localY + 7);
    localY += (splitDescription.length * 5) + 2;
  }
  
  // Format date directly here to avoid passing it around
  const formattedDate = format(new Date(job.date), "MMMM d, yyyy");
  
  // Use the time values that are already formatted by the client or index.ts
  const startTime = job.start_time;
  const endTime = job.end_time;
  
  // Date and time details
  doc.setFontSize(smallFontSize);
  doc.text(`Date: ${formattedDate}`, margin + 5, localY + 7);
  localY += 5;
  doc.text(`Time: ${startTime} - ${endTime}`, margin + 5, localY + 7);
  localY += 20;
  
  return localY;
};
