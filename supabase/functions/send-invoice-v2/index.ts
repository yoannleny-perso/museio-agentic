import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@latest";
import { format, addDays } from "npm:date-fns@3.6.0";
import {
  createRequestContext,
  emptyResponse,
  jsonResponse,
  reportFunctionError,
} from "../_shared/observability.ts";

// ===== Payment processing fee configuration =====
const FEE_CONFIG = {
  // Stripe AU processing fees
  STRIPE_FEE_PERCENT: 0.0175, // 1.75%
  STRIPE_FEE_FIXED: 0.30,     // $0.30 AUD

  // Platform fee (% of gross charge)
  PLATFORM_FEE_PERCENT: 0.016, // 1.6%

  // If true, compute a higher gross charge so the payer covers Stripe + platform fees,
  // and the artist receives exactly their target amount.
  // If false, customer pays the target amount and the artist nets less (platform + Stripe fees deducted).
  PASS_FEES_TO_PAYER: false, // Default if not specified in invoice settings

  // Fee notification message for email
  FEE_NOTE: "A payment processing fee (1.75% + $0.30) and platform fee (1.6%) will be added at checkout to cover transaction costs.",
};

// ===== Helper Functions =====

// Data validation
function validateAndPrepareData(requestData) {
  if (!requestData.job) {
    throw new Error("Job data is missing");
  }
  if (!requestData.artist) {
    throw new Error("Artist data is missing");
  }
  if (!requestData.bankDetails) {
    throw new Error("Bank details are missing");
  }
  if (!requestData.invoiceSettings) {
    throw new Error("Invoice settings are missing");
  }

  const { job, artist, invoiceSettings, amount, gstAmount, bankDetails } = requestData;

  return {
    job,
    artist,
    invoiceSettings,
    amount,
    gstAmount,
    bankDetails
  };
}

// Date formatting
function formatInvoiceDates(invoiceSettings) {
  const invoiceDate = new Date();
  const dueDate = addDays(invoiceDate, invoiceSettings.paymentTerms || 14);

  return {
    formattedInvoiceDate: format(invoiceDate, "dd MMM yyyy"),
    formattedDueDate: format(dueDate, "dd MMM yyyy")
  };
}

// Calculate itemized totals
function calculateItemizedTotals(jobItems) {
  if (!jobItems || jobItems.length === 0) {
    return {
      subtotal: 0,
      totalDiscount: 0,
      taxableAmount: 0,
      nonTaxableAmount: 0
    };
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let nonTaxableAmount = 0;

  for (const item of jobItems) {
    const itemTotal = item.quantity * item.unit_cost;
    const discountAmount = (item.discount_percent || 0) / 100 * itemTotal;
    const finalItemAmount = itemTotal - discountAmount;
    
    subtotal += finalItemAmount;
    totalDiscount += discountAmount;
    
    if (item.is_taxable) {
      taxableAmount += finalItemAmount;
    } else {
      nonTaxableAmount += finalItemAmount;
    }
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    nonTaxableAmount: Math.round(nonTaxableAmount * 100) / 100
  };
}

// Text wrapping helper
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text || text.trim() === '') return [''];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (textWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long, add it anyway
        lines.push(word);
        currentLine = '';
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
}

// Calculate item totals for PDF
function calculateItemTotals(items) {
  let subtotal = 0;
  for (const item of items) {
    const itemTotal = item.quantity * item.unit_cost;
    const discountAmount = (item.discount_percent || 0) / 100 * itemTotal;
    subtotal += itemTotal - discountAmount;
  }
  return subtotal;
}

// Draw itemized table in PDF
function drawItemizedTable(page, jobItems, startY, font, boldFont, pageWidth) {
  let currentY = startY;
  const marginX = 50;
  const tableWidth = pageWidth - marginX * 2;
  const rowHeight = 20;
  const itemWidth = tableWidth * 0.5;
  const rateWidth = tableWidth * 0.15;
  const qtyWidth = tableWidth * 0.15;
  const totalWidth = tableWidth * 0.2;

  // Header background
  page.drawRectangle({
    x: marginX,
    y: currentY - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Header text
  page.drawText("Description", {
    x: marginX + 10,
    y: currentY - 12,
    size: 10,
    font: boldFont,
  });
  page.drawText("Rate", {
    x: marginX + itemWidth + 10,
    y: currentY - 12,
    size: 10,
    font: boldFont,
  });
  page.drawText("Qty", {
    x: marginX + itemWidth + rateWidth + 10,
    y: currentY - 12,
    size: 10,
    font: boldFont,
  });
  page.drawText("Amount", {
    x: marginX + itemWidth + rateWidth + qtyWidth + 10,
    y: currentY - 12,
    size: 10,
    font: boldFont,
  });

  currentY -= rowHeight;

  for (const item of jobItems) {
    const itemTotal = item.quantity * item.unit_cost;
    const discount = (item.discount_percent || 0) / 100 * itemTotal;
    const finalAmount = itemTotal - discount;

    // Wrap item description text to fit within the Description column
    const maxDescriptionWidth = itemWidth - 20; // Account for padding
    const wrappedLines = wrapText(item.item_name || '', maxDescriptionWidth, font, 9);
    
    // Calculate row height based on number of lines needed
    const lineHeight = 12;
    const actualRowHeight = Math.max(rowHeight, wrappedLines.length * lineHeight + 8);
    
    // Draw each line of the wrapped text
    let textY = currentY - 12;
    for (const line of wrappedLines) {
      page.drawText(line, {
        x: marginX + 10,
        y: textY,
        size: 9,
        font,
      });
      textY -= lineHeight;
    }
    
    // Calculate vertical center position for other columns based on row height
    const centerOffsetY = (actualRowHeight - rowHeight) / 2;
    
    page.drawText(`$${item.unit_cost.toFixed(2)}`, {
      x: marginX + itemWidth + 10,
      y: currentY - 12 - centerOffsetY,
      size: 9,
      font,
    });
    page.drawText(`${item.quantity}`, {
      x: marginX + itemWidth + rateWidth + 10,
      y: currentY - 12 - centerOffsetY,
      size: 9,
      font,
    });
    page.drawText(`$${finalAmount.toFixed(2)}`, {
      x: marginX + itemWidth + rateWidth + qtyWidth + 10,
      y: currentY - 12 - centerOffsetY,
      size: 9,
      font: boldFont,
    });

    if (item.discount_percent > 0) {
      page.drawText(`(${item.discount_percent}% discount)`, {
        x: marginX + itemWidth + rateWidth + qtyWidth + 10,
        y: currentY - 22 - centerOffsetY,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    currentY -= actualRowHeight;
  }

  return currentY;
}

// Generate PDF
async function generateInvoicePDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const rightMargin = 50;

  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  console.log("PDF document and fonts loaded successfully");
  
  let currentY = height - 60; // Start from top with margin

  // Handle logo embedding if provided (logo is now always base64)
  let logoImage = null;
  let logoHeight = 0;
  if (data.invoiceSettings?.logo) {
    try {
      console.log("Processing logo (base64 data)");
      
      // Extract base64 content from data URL
      const base64Data = data.invoiceSettings.logo.split(',')[1];
      const logoData = Uint8Array.from(atob(base64Data), (c)=>c.charCodeAt(0));
      
      // Try to embed as PNG first, then JPG
      try {
        logoImage = await pdfDoc.embedPng(logoData);
        console.log("Logo embedded as PNG successfully");
      } catch (pngError) {
        try {
          logoImage = await pdfDoc.embedJpg(logoData);
          console.log("Logo embedded as JPG successfully");
        } catch (jpgError) {
          console.error("Failed to embed logo as PNG or JPG:", pngError, jpgError);
        }
      }
    } catch (error) {
      console.error("Error processing logo:", error);
      // Continue without logo if there's an error
    }
  }

  // Header Section - Logo on left, INVOICE text on right
  // Add logo if successfully loaded (top left)
  if (logoImage) {
    try {
      // Scale logo to match preview (max height 60, maintain aspect ratio)
      const originalDims = logoImage.scale(1);
      const maxHeight = 60;
      const maxWidth = 150;
      let logoWidth = originalDims.width;
      let logoScaledHeight = originalDims.height;
      
      // Scale down if too large
      if (logoScaledHeight > maxHeight) {
        const scale = maxHeight / logoScaledHeight;
        logoScaledHeight = maxHeight;
        logoWidth = originalDims.width * scale;
      }
      
      if (logoWidth > maxWidth) {
        const scale = maxWidth / logoWidth;
        logoWidth = maxWidth;
        logoScaledHeight = logoScaledHeight * scale;
      }
      
      // Position logo at top left
      page.drawImage(logoImage, {
        x: 50,
        y: currentY - logoScaledHeight + 20,
        width: logoWidth,
        height: logoScaledHeight
      });
      
      logoHeight = logoScaledHeight;
      console.log("Logo added to PDF with dimensions:", {
        width: logoWidth,
        height: logoScaledHeight
      });
    } catch (error) {
      console.error("Error drawing logo on PDF:", error);
    }
  }

  // INVOICE Title
  const titleWidth = boldFont.widthOfTextAtSize("INVOICE", 28);
  page.drawText("INVOICE", {
    x: width - titleWidth - rightMargin,
    y: currentY,
    font: boldFont,
    size: 28,
  });
  currentY -= 15;

  // Invoice Info
  const issueDate = format(new Date(), "MMM d, yyyy");
  const dueDate = data.dueDate ? format(new Date(data.dueDate), "MMM d, yyyy") : "Due upon receipt";

  [
    `Invoice Number: ${data.invoiceNumber}`,
    `Date of Issue: ${issueDate}`,
    `Due Date: ${dueDate}`,
  ].forEach((line) => {
    const textWidth = helveticaFont.widthOfTextAtSize(line, 11);
    page.drawText(line, {
      x: width - rightMargin - textWidth,
      y: currentY,
      font: helveticaFont,
      size: 11,
    });
    currentY -= 15;
  });

  const jobSubtotal = data.jobItems?.length > 0 ? calculateItemTotals(data.jobItems) : data.amount || 0;
  const gstAmount = data.invoiceSettings?.addGST ? jobSubtotal * 0.1 : 0;
  const total = jobSubtotal + gstAmount;

  const balanceText = `Balance Due: $${total.toFixed(2)}`;
  page.drawText(balanceText, {
    x: width - rightMargin - helveticaFont.widthOfTextAtSize(balanceText, 12),
    y: currentY,
    font: helveticaFont,
    size: 12,
  });
  currentY -= 40;

  // From/To Sections
  page.drawText("From:", { x: 50, y: currentY, font: boldFont, size: 12 });
  page.drawText("Bill To:", { x: 320, y: currentY, font: boldFont, size: 12 });
  currentY -= 20;

  const drawLines = (x, y, lines, fontSize = 10) => {
    for (const line of lines) {
      page.drawText(line, { x, y, font: helveticaFont, size: fontSize });
      y -= 15;
    }
    return y;
  };

  const fromLines = [
    data.artist?.companyName,
    data.artist?.companyAddress,
    data.artist?.abn ? `ABN: ${data.artist.abn}` : null,
  ].filter(Boolean);

  const toLines = [
    data.job?.client,
    data.job?.contact_email,
    data.job?.location,
  ].filter(Boolean);

  const fromY = drawLines(50, currentY, fromLines);
  const toY = drawLines(320, currentY, toLines);
  currentY = Math.min(fromY, toY) - 30;

  // Itemized Table
  if (data.jobItems?.length > 0) {
    currentY = drawItemizedTable(page, data.jobItems, currentY, helveticaFont, boldFont, width);
  }

  // Payment Summary
  currentY -= 20;
  const summaryX = width - 200;

  page.drawText("Subtotal:", { x: summaryX, y: currentY, font: helveticaFont, size: 11 });
  page.drawText(`$${jobSubtotal.toFixed(2)}`, {
    x: summaryX + 80,
    y: currentY,
    font: helveticaFont,
    size: 11,
  });
  currentY -= 15;

  if (data.invoiceSettings?.addGST && gstAmount > 0) {
    page.drawText("GST (10%):", { x: summaryX, y: currentY, font: helveticaFont, size: 11 });
    page.drawText(`$${gstAmount.toFixed(2)}`, {
      x: summaryX + 80,
      y: currentY,
      font: helveticaFont,
      size: 11,
    });
    currentY -= 15;
  }

  page.drawLine({
    start: { x: summaryX, y: currentY },
    end: { x: summaryX + 150, y: currentY },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  currentY -= 15;

  page.drawText("Total:", { x: summaryX, y: currentY, font: boldFont, size: 12 });
  page.drawText(`$${total.toFixed(2)}`, {
    x: summaryX + 80,
    y: currentY,
    font: boldFont,
    size: 12,
  });

  // Define bottom positioning for all bottom elements
  const bottomMargin = 90; // Distance from bottom of page
  const bottomY = bottomMargin; // Y coordinate for bottom elements

  // Payment Instructions (BOTTOM LEFT) - First element
  const paymentInstructionsX = 50;
  let paymentY = bottomY + 250; // Start payment instructions
  
  page.drawText("Please make payment to:", {
    x: paymentInstructionsX,
    y: paymentY,
    size: 12,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0)
  });
  paymentY -= 12;
  
  if (data.bankDetails) {
    page.drawText(`Account Name: ${data.bankDetails.accountHolderName || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 12;
    page.drawText(`BSB: ${data.bankDetails.bsbNumber || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 12;
    page.drawText(`Account Number: ${data.bankDetails.accountNumber || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 60; 
  }

  if (data.bankDetails?.includeSuperInInvoices) {
    page.drawText("Please make super contribution to:", {
      x: paymentInstructionsX,
      y: paymentY,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 12;

    page.drawText(`Fund Name: ${data.bankDetails.fundName || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 12;
    page.drawText(`Member Number: ${data.bankDetails.memberNumber || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 12;
    page.drawText(`Fund ABN: ${data.bankDetails.fundAbn || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 12;
    page.drawText(`Fund USI: ${data.bankDetails.fundUsi || ''}`, {
      x: paymentInstructionsX,
      y: paymentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 60; // Extra spacing before notes
  }

  // Notes (BOTTOM LEFT - below payment instructions)
  const leftColumnX = 50;
  let notesY = paymentY; // Start notes below payment instructions
  
  if (data.invoiceSettings?.footerNotes) {
    page.drawText("Notes:", {
      x: leftColumnX,
      y: notesY,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    notesY -= 15;
    page.drawText(data.invoiceSettings.footerNotes, {
      x: leftColumnX,
      y: notesY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    notesY -= 20; // Space after notes content
  }

  // Signature (BOTTOM RIGHT) - positioned at the bottom of notes
  if (data.invoiceSettings?.signature) {
    try {
      console.log("Processing signature (base64 data)");
      
      // Define signature positioning (bottom right, starting at bottom of notes)
      const signatureWidth = 150;
      const signatureX = width - rightMargin - signatureWidth;
      const signatureStartY = notesY + 15; // Start signature at bottom of notes
      
      // Extract base64 content from data URL
      const base64Data = data.invoiceSettings.signature.split(',')[1];
      const signatureData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      
      // Process signature image
      try {
        let signatureImage;
        try {
          signatureImage = await pdfDoc.embedPng(signatureData);
          console.log("Signature embedded as PNG successfully");
        } catch (pngError) {
          console.log("PNG embed failed, trying JPG:", pngError.message);
          signatureImage = await pdfDoc.embedJpg(signatureData);
          console.log("Signature embedded as JPG successfully");
        }
        
        // Calculate signature dimensions (maintain aspect ratio)
        const originalDims = signatureImage.scale(1);
        const maxWidth = 150;
        const maxHeight = 40;
        
        let sigWidth = originalDims.width;
        let sigHeight = originalDims.height;
        
        // Scale down if too large
        if (sigHeight > maxHeight) {
          const scale = maxHeight / sigHeight;
          sigHeight = maxHeight;
          sigWidth = originalDims.width * scale;
        }
        
        if (sigWidth > maxWidth) {
          const scale = maxWidth / sigWidth;
          sigWidth = maxWidth;
          sigHeight = sigHeight * scale;
        }
        
        // Center the signature within the signature area
        const centeredSignatureX = signatureX + (signatureWidth - sigWidth) / 2;
        
        page.drawImage(signatureImage, {
          x: centeredSignatureX,
          y: signatureStartY - sigHeight + 15,
          width: sigWidth,
          height: sigHeight
        });
        
        console.log("Signature image added to PDF successfully with dimensions:", {
          width: sigWidth,
          height: sigHeight,
          x: centeredSignatureX
        });
      } catch (imageError) {
        console.error("Failed to embed signature as image:", imageError);
        // Continue without signature image but still draw the line
      }

      // Always draw signature line and date (bottom right)
      const lineY = signatureStartY - 25;
      page.drawLine({
        start: { x: signatureX, y: lineY },
        end: { x: signatureX + signatureWidth, y: lineY },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6)
      });

      // Center the date below the signature line
      const dateText = format(new Date(), "MMM d, yyyy");
      const dateTextWidth = helveticaFont.widthOfTextAtSize(dateText, 9);
      const centeredDateX = signatureX + (signatureWidth - dateTextWidth) / 2;

      page.drawText(dateText, {
        x: centeredDateX,
        y: lineY - 15,
        size: 9,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });

    } catch (error) {
      console.error("Error processing signature for PDF:", error);
      // Still draw signature line and date even if signature processing fails
      const signatureWidth = 150;
      const signatureX = width - rightMargin - signatureWidth;
      const signatureStartY = notesY + 15;
      const lineY = signatureStartY - 25;
      
      page.drawLine({
        start: { x: signatureX, y: lineY },
        end: { x: signatureX + signatureWidth, y: lineY },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6)
      });

      const dateText = format(new Date(), "MMM d, yyyy");
      const dateTextWidth = helveticaFont.widthOfTextAtSize(dateText, 9);
      const centeredDateX = signatureX + (signatureWidth - dateTextWidth) / 2;

      page.drawText(dateText, {
        x: centeredDateX,
        y: lineY - 15,
        size: 9,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });
    }
  }

  // Footer
  page.drawText("Created by museioapp.com", {
    x: (width - helveticaFont.widthOfTextAtSize("Created by museioapp.com", 8)) / 2,
    y: 30,
    font: helveticaFont,
    size: 8,
    color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  return btoa(String.fromCharCode(...pdfBytes));
}

// Send invoice email
async function sendInvoiceEmail(
  resend, 
  job, 
  artist, 
  invoiceNumber, 
  total, 
  invoiceSettings, 
  pdfBase64, 
  shouldCopyArtist,
  jobItems = [],
  paymentLink?: string | null,
  feeConfig?: { enabled: boolean; note: string }
) {
  const emailSubject = `Invoice ${invoiceNumber} from ${artist.name}`;
  // Format the current date in DD Mon YYYY format
  const currentDate = format(new Date(), "dd MMM yyyy");

  const emailBody = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MUSEIO Email Templates</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    .logo-container {
      text-align: center;
      padding: 20px 0;
      background-color: #ffffff;
    }
    .logo-container img {
      max-width: 200px;
      height: auto;
      width: auto;
      max-height: 80px;
    }
    .email-section {
      margin: 0 auto 40px;
      max-width: 620px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(90deg, #E9D5FF 0%, #DDD6FE 100%);
      padding: 24px 24px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .email-brand {
      font-weight: bold;
      font-size: 24px;
      color: #ffffff;
    }
    .email-logo {
      max-width: 120px;
      max-height: 60px;
      width: auto;
      height: auto;
    }
    .email-meta {
      text-align: right;
      font-size: 14px;
      color: #374151;
    }
    .email-body {
      background-color: #ffffff;
      padding: 24px;
    }
    .email-body h3 {
      font-size: 20px;
      margin-bottom: 12px;
      color: #111827;
      background-color: #ffffff;

    }
    .email-body p {
      font-size: 15px;
      color: #4B5563;
      margin-bottom: 20px;
      background-color: #ffffff;

    }
    .email-body ul {
      list-style: none;
      padding: 0;
      font-size: 15px;
      color: #111827;
      line-height: 1.8;
      background-color: #ffffff;

    }
    .email-body ul li strong {
      color: #111827;
    }
    .email-footer {
      padding: 24px;
      font-size: 13px;
      color: #6B7280;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    @media only screen and (max-width: 600px) {
      .logo-container img {
        max-width: 150px;
        max-height: 60px;
      }
      .email-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .email-meta {
        text-align: left;
        margin-top: 10px;
      }
      .email-logo {
        max-width: 100px;
        max-height: 50px;
        margin-top: 10px;
      }
    }
  </style>
</head>
<body>

  <div class="logo-container">
    <img 
      src="https://museioapp.com/museio-gradient-logo.svg" 
      alt="Museio Logo"
    />
  </div>
<section class="email-section">
    <div class="email-header" style="background: linear-gradient(90deg, #E9D5FF 0%, #DDD6FE 100%);">
      <div class="email-meta" style="text-align: left;">
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 8px;">Invoice Sent</div>
        <div style="font-size: 14px; color: #4B5563;">${currentDate}</div>
        <div style="font-size: 14px; color: #4B5563; font-weight: bold;">Total: A$${total}</div>
      </div>
    </div>
    <div class="email-body">
      <h3>💼 You have received a new invoice</h3>
      <p>Here's a summary of the completed job and the billing information:</p>
      <ul>
        <li><strong>Event:</strong> ${job.title}</li>
        <li><strong>Date:</strong> ${format(new Date(job.date), "dd MMM yyyy")} </li>
        <li><strong>Time:</strong> ${job.start_time} – ${job.end_time}</li>
        <li><strong>Location:</strong> ${job.location} </li>
        <li><strong>Invoice #:</strong> ${invoiceNumber}</li>
        <li><strong>Name:</strong> ${artist.name} </li>
        <li><strong>Email:</strong> <a href="${artist.email}">${artist.email}</a></li>
        ${artist.phone ? `<li><strong>Phone:</strong> ${artist.phone}</li>` : ''}
      </ul>
      <p>📎 Your invoice is attached in PDF format.</p>
      ${paymentLink ? `
    <div style="padding: 20px; border-radius: 12px; text-align: center; background:#f9fafb; color:#111827; border:1px solid #e5e7eb;">
      <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%); padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; color: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">Pay Invoice Now</a>
      <p style="margin-top: 12px; font-size: 14px; color: #374151;">🔒 Secure payment powered by Stripe (Visa, Mastercard, Amex & more)<br>Or pay via bank transfer using the details in the attached invoice</p>
      ${feeConfig?.enabled ? `
      <div style="margin-top: 16px; padding: 14px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; text-align: left;">
        <p style="margin: 0; font-size: 13px; color: #92400E;">
          <strong>ℹ️ Payment Processing Fee Notice:</strong><br>
          ${feeConfig.note}
        </p>
      </div>
      ` : ''}
    </div>
      ` : ''}
      <p style="font-style: italic; color: #6B7280;">If you have any questions, please reach out to ${artist.name}.</p>
      <p>Warm regards,<br>
      <strong>Museio Team</strong><br>
      <a href="mailto:support@museioapp.com">support@museioapp.com</a></p>
    </div>
    <div class="email-footer">
      <a href="https://museioapp.com/" style="
        display: inline-block;
        margin-top: 0;
        padding: 10px 18px;
        background: linear-gradient(90deg, #D8B4FE 0%, #C084FC 100%);
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 12px;">
        Discover Museio
      </a>
      <p style="margin-top: 8px; font-size: 13px; color: #6B7280;">
        <span style="font-size: 13px; font-weight: 500;">Transform your <strong>Passion</strong> into a <strong>Business</strong></span>
      </p>
      <p style="margin-top: 16px; font-size: 13px; color: #6B7280;">
        <span style="font-size: 12px;">This email was automatically generated by <strong>MuseioApp</strong>.</span>
      </p>
    </div>
  </section>
  </body>
</html>
  `;

  // Parse comma-separated email addresses into an array
  const recipientEmails = job.contact_email
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);

  const emailData: any = {
    from: `Museio Invoice <invoice@museioapp.com>`,
    to: recipientEmails,
    subject: emailSubject,
    html: emailBody,
    attachments: [
      {
        filename: `Invoice-${invoiceNumber}.pdf`,
        content: pdfBase64,
        content_type: 'application/pdf',
      },
    ],
  };

  // Add CC if artist wants to receive a copy
  if (shouldCopyArtist) {
    emailData.cc = [artist.email];
  }

  const { data, error } = await resend.emails.send(emailData);

  if (error) {
    console.error("Resend API error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log("Invoice email sent successfully");
  return data;
}

// ===== Main Handler =====

const handler = async (req: Request): Promise<Response> => {
  const context = createRequestContext(req, "send-invoice-v2");
  let recordedInvoiceId: string | null = null;

  // CORS preflight
  if (req.method === "OPTIONS") {
    return emptyResponse(context);
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    const resend = new Resend(resendKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

    // Extract bearer token safely
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) {
      throw new Error("Invalid or missing bearer token");
    }

    // Parse JSON
    let requestData: any;
    try {
      requestData = await req.json();
    } catch (parseError: any) {
      console.error("Failed to parse request JSON:", parseError);
      throw new Error(`Invalid JSON in request: ${parseError.message}`);
    }

    const processStart = Date.now();

    // 1) Validate + prepare data
    console.log("Validating request data…");
    const { job, artist, invoiceSettings, amount, gstAmount, bankDetails } =
      validateAndPrepareData(requestData);

    // 2) Authenticate user with anon client
    console.log("Authenticating user…");
    const { data: authUser, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authUser?.user) {
      console.error("Authentication failed:", authError);
      throw new Error("Authentication failed");
    }
    const userId = authUser.user.id;
    const { data: verifiedJobRow, error: verifiedJobError } = await supabase
      .from("jobs")
      .select("id, user_id, title, client, location, date, end_date, start_time, end_time, contact_email, contact_name, contact_phone, rate, pricing_mode")
      .eq("id", job.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (verifiedJobError) {
      console.error("Error verifying invoice job ownership:", verifiedJobError);
      throw new Error(`Failed to verify job ownership: ${verifiedJobError.message}`);
    }

    if (!verifiedJobRow) {
      throw new Error("Job not found or not owned by the authenticated user");
    }

    Object.assign(job, {
      id: verifiedJobRow.id,
      title: verifiedJobRow.title,
      client: verifiedJobRow.client,
      location: verifiedJobRow.location,
      date: verifiedJobRow.date,
      end_date: verifiedJobRow.end_date,
      start_time: verifiedJobRow.start_time,
      end_time: verifiedJobRow.end_time,
      contact_email: verifiedJobRow.contact_email,
      contact_name: verifiedJobRow.contact_name,
      contact_phone: verifiedJobRow.contact_phone,
      rate: verifiedJobRow.rate,
      pricing_mode: verifiedJobRow.pricing_mode,
    });

    if (!job.contact_email) {
      throw new Error("The selected job does not have a client email address");
    }

    // 3) Fetch job items
    console.log("Fetching job items for job:", job.id);
    const { data: jobItems, error: itemsError } = await supabase
      .from("job_items")
      .select("*")
      .eq("job_id", job.id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Error fetching job items:", itemsError);
      throw new Error(`Failed to fetch job items: ${itemsError.message}`);
    }
    console.log(`Found ${jobItems?.length || 0} job items`);

    // 4) Generate atomic invoice number
    console.log("Generating sequential invoice number…");
    const { data: invoiceNumber, error: invoiceError } = await supabase.rpc(
      "generate_invoice_number_for_user",
      { format_string: invoiceSettings.format, p_user_id: userId },
    );
    if (invoiceError) {
      console.error("Error generating invoice number:", invoiceError);
      throw new Error(`Failed to generate invoice number: ${invoiceError.message}`);
    }
    if (!invoiceNumber) throw new Error("No invoice number returned");
    console.log("Generated invoice number:", invoiceNumber);

    // 5) Stripe status + Payment Link
    console.log("Checking Stripe payment status…");
    let paymentLink: string | null = null;
    let stripePaymentsEnabled = false;

    try {
      // get user's connected Stripe account metadata
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_account_id, stripe_onboarding_completed")
        .eq("id", userId)
        .single();

      if (!profileError && profileData?.stripe_account_id && profileData?.stripe_onboarding_completed) {
        // Confirm account charges_enabled from platform
        const account = await stripe.accounts.retrieve(profileData.stripe_account_id);
        stripePaymentsEnabled = !!account.charges_enabled;

        if (stripePaymentsEnabled) {
          console.log("Creating Stripe Payment Link (destination charge)…");

          // Helper for cents
          const toCents = (d: number) => Math.round(d * 100);

          // Artist's target amount T (in AUD). If GST applies, T includes it.
          const T = invoiceSettings.addGST ? amount + gstAmount : amount;
          const T_cents = toCents(T);

          // Fees
          const s = FEE_CONFIG.STRIPE_FEE_PERCENT;           // Stripe %
          const p = FEE_CONFIG.PLATFORM_FEE_PERCENT;         // Platform %
          const f_cents = toCents(FEE_CONFIG.STRIPE_FEE_FIXED); // Stripe fixed

          // Determine fee passing strategy from invoice settings
          // If absorbPaymentFees is true, artist absorbs fees (passFeesToPayer = false)
          // If absorbPaymentFees is false, customer pays fees (passFeesToPayer = true)
          const passFeesToPayer = !invoiceSettings.absorbPaymentFees;

          // Compute gross charge X (in cents)
          let X_cents: number;
          if (passFeesToPayer) {
            const denom = 1 - s - p;
            if (denom <= 0) {
              throw new Error("Invalid fee configuration: 1 - s - p must be > 0");
            }
            X_cents = Math.round((T_cents + f_cents) / denom);
          } else {
            // Customer pays target amount; artist nets less after fees
            X_cents = T_cents;
          }

          // Derived components
          const stripePercentFee_cents = Math.round(X_cents * s);
          const stripeFixedFee_cents = f_cents;
          const platformFee_cents = Math.round(X_cents * p);

          // Artist net (for sanity)
          const artistNet_cents =
            X_cents - stripePercentFee_cents - stripeFixedFee_cents - platformFee_cents;

          // Create Payment Link FROM THE PLATFORM ACCOUNT
          // Route funds to the connected account (destination charge),
          // and collect platform fee via application_fee_amount.
          const paymentLinkResponse = await stripe.paymentLinks.create({
            line_items: [
              {
                price_data: {
                  currency: "aud",
                  product_data: {
                    name: `Invoice ${invoiceNumber} - ${job.title}`,
                    description: `Payment for ${job.title} on ${job.date}`,
                  },
                  unit_amount: X_cents,
                },
                quantity: 1,
              },
            ],
            // Platform fee collected from the charge
            application_fee_amount: platformFee_cents + stripeFixedFee_cents + stripePercentFee_cents,

            // Transfer to connected account (TOP LEVEL - not in payment_intent_data)
            transfer_data: {
              destination: profileData.stripe_account_id,
            },

            payment_intent_data: {
              metadata: {
                invoice_number: invoiceNumber,
                job_title: job.title,
              },
            },

            after_completion: {
              type: "hosted_confirmation",
              hosted_confirmation: {
                custom_message:
                  `Thank you for your payment! You will receive a receipt from Stripe shortly. Your invoice ${invoiceNumber} has been marked as paid.`,
              },
            },
            automatic_tax: {
              enabled: false,
            },
            billing_address_collection: "auto",
            customer_creation: "always",
            metadata: {
              invoice_number: invoiceNumber,
              job_id: String(job.id),
              user_id: userId,

              // Transparency/debug
              pricing_model: passFeesToPayer ? "payer_covers_fees" : "artist_covers_fees",
              target_artist_amount_cents: String(T_cents),
              gross_charge_cents: String(X_cents),
              stripe_percent_fee_cents: String(stripePercentFee_cents),
              stripe_fixed_fee_cents: String(stripeFixedFee_cents),
              platform_fee_cents: String(platformFee_cents),
              computed_artist_net_cents: String(artistNet_cents),
            },
          });

          paymentLink = paymentLinkResponse.url;
          console.log("Payment link created:", paymentLinkResponse.id);

          // Create invoice_payments record to track this payment
          const paymentDueDate = new Date();
          paymentDueDate.setDate(paymentDueDate.getDate() + (invoiceSettings.paymentTerms || 14));

          const { error: paymentRecordError } = await supabase
            .from("invoice_payments")
            .insert({
              user_id: userId,
              invoice_id: null, // to be linked after sent_invoices insert
              amount: X_cents / 100, // store as dollars (keep consistent with your schema)
              currency: "aud",
              payment_url: paymentLink,
              stripe_payment_link_id: paymentLinkResponse.id,
              status: "pending",
              expires_at: paymentDueDate.toISOString(),
            });

          if (paymentRecordError) {
            console.error("Error creating invoice_payments record:", paymentRecordError);
          } else {
            console.log("Invoice payment record created");
          }
        } else {
          console.log("Stripe payments not enabled for this account");
        }
      } else {
        console.log("No Stripe account configured or onboarding incomplete for user");
      }
    } catch (stripeError) {
      console.error("Stripe operation error:", stripeError);
      stripePaymentsEnabled = false;
      paymentLink = null;
    }

    // 6) Format dates
    const { formattedInvoiceDate, formattedDueDate } = formatInvoiceDates(invoiceSettings);

    // 7) Generate PDF
    console.log("Generating itemized invoice PDF…");
    const pdfStart = Date.now();
    const pdfData = {
      job,
      artist,
      invoiceSettings,
      invoiceNumber,
      amount,
      gstAmount,
      bankDetails,
      gst: invoiceSettings.addGST,
      dueDate: formattedDueDate,
      jobItems: jobItems || [],
    };

    let pdfBase64: string;
    try {
      pdfBase64 = await generateInvoicePDF(pdfData);
      console.log(`PDF generation completed in ${Date.now() - pdfStart}ms`);
      if (!pdfBase64 || pdfBase64.length < 100) {
        throw new Error("PDF generation failed - output too small/empty");
      }
    } catch (pdfError: any) {
      console.error("PDF generation error:", pdfError);
      throw new Error(`Failed to generate invoice PDF: ${pdfError.message}`);
    }

    const total = invoiceSettings.addGST ? amount + gstAmount : amount;
    console.log("Recording sent invoice in database…");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (invoiceSettings.paymentTerms || 14));

    const { data: sentInvoiceData, error: insertError } = await supabase
      .from("sent_invoices")
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        amount: total,
        job_id: job.id,
        client_email: job.contact_email,
        status: "sending",
        due_date: dueDate.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (insertError || !sentInvoiceData) {
      console.error("Error recording invoice:", insertError);
      throw new Error(`Failed to record invoice before delivery: ${insertError?.message || "Unknown database error"}`);
    }
    recordedInvoiceId = sentInvoiceData.id;

    if (stripePaymentsEnabled && paymentLink) {
      const { error: linkError } = await supabase
        .from("invoice_payments")
        .update({ invoice_id: sentInvoiceData.id })
        .eq("user_id", userId)
        .eq("payment_url", paymentLink);

      if (linkError) {
        console.error("Error linking invoice_payments:", linkError);
        throw new Error(`Failed to link payment record to invoice: ${linkError.message}`);
      }
    }

    // 8) Email the invoice
    console.log("Sending invoice email");
    const shouldCopyArtist = invoiceSettings.receiveEmailCopy === true && !!artist.email;
    if (shouldCopyArtist) {
      console.log("Artist copy is enabled for this invoice");
    }

    try {
      await sendInvoiceEmail(
        resend,
        job,
        artist,
        invoiceNumber,
        total,
        invoiceSettings,
        pdfBase64,
        shouldCopyArtist,
        jobItems,
        paymentLink,
        {
          enabled: FEE_CONFIG.PASS_FEES_TO_PAYER,
          note: FEE_CONFIG.FEE_NOTE,
        },
      );
      console.log("Invoice email sent");
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError);
      await supabase
        .from("sent_invoices")
        .update({ status: "delivery_failed" })
        .eq("id", sentInvoiceData.id)
        .eq("user_id", userId);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

    const { error: sentUpdateError } = await supabase
      .from("sent_invoices")
      .update({ status: "sent" })
      .eq("id", sentInvoiceData.id)
      .eq("user_id", userId);

    if (sentUpdateError) {
      console.error("Failed to finalize sent invoice status:", sentUpdateError);
      throw new Error(`Invoice delivered but failed to finalize sent state: ${sentUpdateError.message}`);
    }

    console.log(`Invoice v2 process completed in ${Date.now() - processStart}ms`);

    return jsonResponse(context, 200, {
      success: true,
      message: "Itemized invoice sent successfully",
      invoiceNumber,
      itemCount: jobItems?.length || 0,
    });
  } catch (error: any) {
    await reportFunctionError(context, error, {
      status: 500,
      message: "Error in send-invoice-v2 function",
      extra: {
        recordedInvoiceId,
      },
    });
    if (recordedInvoiceId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("sent_invoices")
          .update({ status: "delivery_failed" })
          .eq("id", recordedInvoiceId);
      } catch (_) {
        // Ignore cleanup failures while returning the primary error
      }
    }
    return jsonResponse(context, 500, {
      success: false,
      error: error.message,
    });
  }
};

serve(handler);
