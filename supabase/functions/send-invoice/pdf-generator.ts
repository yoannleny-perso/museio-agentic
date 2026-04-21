import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@latest";
import { format } from "npm:date-fns@3.6.0";

export async function generateInvoicePDF(data) {
  try {
    console.log("Starting PDF generation with pdf-lib, data:", JSON.stringify({
      invoiceNumber: data.invoiceNumber,
      dueDate: data.dueDate,
      amount: data.amount,
      addGST: data.invoiceSettings?.addGST,
      jobTitle: data.job?.title,
      artistName: data.artist?.name,
      hasLogo: !!data.invoiceSettings?.logo,
      hasSignature: !!data.invoiceSettings?.signature,
      signatureType: data.invoiceSettings?.signatureType
    }));
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    const { width, height } = page.getSize();
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
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

    // INVOICE text at top right
    const invoiceTextWidth = helveticaBoldFont.widthOfTextAtSize("INVOICE", 28);
    const rightMargin = 50;
    page.drawText("INVOICE", {
      x: width - invoiceTextWidth - rightMargin,
      y: currentY,
      size: 28,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });

    // Adjust currentY to be below both logo and text
    currentY -= 15;

    // Invoice details (right column) - all right aligned
    // Use the invoice number that was passed from the frontend
    const invoiceText = `Invoice Number: ${data.invoiceNumber}`;
    const invoiceTextWidth2 = helveticaFont.widthOfTextAtSize(invoiceText, 12);
    page.drawText(invoiceText, {
      x: width - rightMargin - invoiceTextWidth2,
      y: currentY,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    currentY -= 15;

    const currentDate = new Date();
    const issueDateText = `Date of Issue: ${format(currentDate, "MMM d, yyyy")}`;
    const issueDateTextWidth = helveticaFont.widthOfTextAtSize(issueDateText, 11);
    page.drawText(issueDateText, {
      x: width - rightMargin - issueDateTextWidth,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    currentY -= 15;

    // Parse and format the due date
    let formattedDueDate = "Due upon receipt";
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate);
      if (!isNaN(dueDate.getTime())) {
        formattedDueDate = format(dueDate, "MMM d, yyyy");
      }
    }
    const dueDateText = `Due Date: ${formattedDueDate}`;
    const dueDateTextWidth = helveticaFont.widthOfTextAtSize(dueDateText, 11);
    page.drawText(dueDateText, {
      x: width - rightMargin - dueDateTextWidth,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    currentY -= 15;

    // Calculate total for display
    const subtotal = data.amount || 0;
    const gstAmount = data.gstAmount || 0;
    const total = data.invoiceSettings?.addGST ? subtotal + gstAmount : subtotal;
    const totalText = `Balance Due: $${total.toFixed(2)}`;
    const totalTextWidth = helveticaFont.widthOfTextAtSize(totalText, 12);
    page.drawText(totalText, {
      x: width - rightMargin - totalTextWidth,
      y: currentY,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    currentY -= 50;

    // Billing Information Section
    page.drawText("From:", {
      x: 50,
      y: currentY,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    page.drawText("Bill To:", {
      x: 350,
      y: currentY,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    currentY -= 20;

    // From details (left column)
    let fromY = currentY;
    if (data.artist?.name) {
      page.drawText(data.artist.name, {
        x: 50,
        y: fromY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      fromY -= 15;
    }
    if (data.artist?.companyName) {
      page.drawText(data.artist.companyName, {
        x: 50,
        y: fromY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      fromY -= 15;
    }
    if (data.artist?.companyAddress) {
      page.drawText(data.artist.companyAddress, {
        x: 50,
        y: fromY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      fromY -= 15;
    }
    if (data.artist?.abn) {
      page.drawText(`ABN: ${data.artist.abn}`, {
        x: 50,
        y: fromY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      fromY -= 15;
    }

    // To details (right column)
    let toY = currentY;
    if (data.job?.client) {
      page.drawText(data.job.client, {
        x: 350,
        y: toY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      toY -= 15;
    }
    if (data.job?.contact_email) {
      page.drawText(data.job.contact_email, {
        x: 350,
        y: toY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      toY -= 15;
    }
    if (data.job?.location) {
      page.drawText(data.job.location, {
        x: 350,
        y: toY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      toY -= 15;
    }
    currentY = Math.min(fromY, toY) - 30;

    // Job Details Section - Table Style
    const tableStartY = currentY;
    const tableX = 50;
    const tableWidth = width - 50 - tableX; // Calculate table width (from left margin to right margin)
    const tableHeight = 25;
    
    // Table header background
    page.drawRectangle({
      x: tableX,
      y: tableStartY - tableHeight,
      width: tableWidth,
      height: tableHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderRadius: 16

    });
    
    // Table headers
    page.drawText("Description", {
      x: 60,
      y: tableStartY - 15,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    const amountTextWidth = helveticaBoldFont.widthOfTextAtSize("Amount", 12);
    page.drawText("Amount", {
      x: width - rightMargin - amountTextWidth - 8,
      y: tableStartY - 15,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    
    currentY = tableStartY - tableHeight - 24;
    
    // Job details row
    const jobDescription = `${data.job?.title || 'Job'} at ${data.job?.location || 'Location'}`;
    page.drawText(jobDescription, {
      x: 60,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    const dataAmmountText = `$${(data.amount || 0).toFixed(2)}`;
    const dataAmountWidth = helveticaFont.widthOfTextAtSize(dataAmmountText, 11);
    page.drawText(dataAmmountText, {
      x: width - rightMargin - dataAmountWidth - 8,
      y: currentY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    currentY -= 15;
    
    // Job additional details
    if (data.job?.job_number) {
      page.drawText(`Job Number: ${data.job.job_number}`, {
        x: 60,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      currentY -= 12;
    }
    if (data.job?.date) {
      const formattedJobDate = format(new Date(data.job.date), "MMM d, yyyy");
      page.drawText(`Date: ${formattedJobDate}`, {
        x: 60,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      currentY -= 12;
    }
    if (data.job?.start_time && data.job?.end_time) {
      page.drawText(`Time: ${data.job.start_time} - ${data.job.end_time}`, {
        x: 60,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      currentY -= 12;
    }
    if (data.job?.job_description && data.job.job_description.trim() !== '') {
      const descLines = pdfDoc.splitTextToSize ? [
        data.job.job_description
      ] : data.job.job_description.length > 60 ? [
        data.job.job_description.substring(0, 60) + '...'
      ] : [
        data.job.job_description
      ];
      descLines.forEach((line)=>{
        page.drawText(line, {
          x: 60,
          y: currentY,
          size: 10,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4)
        });
        currentY -= 12;
      });
    }
    
    // Calculate the total table height including all content but no extra padding
    const totalTableHeight = tableStartY - currentY;
    
    // Draw the complete table border around all content, ending exactly at job description
    page.drawRectangle({
      x: tableX,
      y: currentY,
      width: tableWidth,
      height: totalTableHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      borderRadius: 16
    });
    
    // Move currentY for next section with proper spacing
    currentY -= 30;
    
    // Store the Y position after the table for the two-column layout
    const twoColumnStartY = currentY;
    
    // Payment Summary - Clean lines style, aligned with table right edge (RIGHT COLUMN)
    const summaryBoxWidth = 200;
    const summaryX = tableX + tableWidth - summaryBoxWidth; // Align with table's right edge
    let summaryY = twoColumnStartY - 15;
    
    // Subtotal
    page.drawText("Subtotal:", {
      x: summaryX + 10,
      y: summaryY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    const subtotalAmountText = `$${subtotal.toFixed(2)}`;
    const subtotalAmountWidth = helveticaFont.widthOfTextAtSize(subtotalAmountText, 11);
    page.drawText(subtotalAmountText, {
      x: width - rightMargin - subtotalAmountWidth,
      y: summaryY,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    summaryY -= 5;
    
    // Line under subtotal
    page.drawLine({
      start: {
        x: summaryX + 10,
        y: summaryY
      },
      end: {
        x: width - rightMargin,
        y: summaryY
      },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    });
    summaryY -= 13;
    
    // GST line (only show if we're adding GST)
    if (data.invoiceSettings?.addGST && gstAmount > 0) {
      page.drawText("GST (10%):", {
        x: summaryX + 10,
        y: summaryY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      const gstAmountText = `$${gstAmount.toFixed(2)}`;
      const gstAmountWidth = helveticaFont.widthOfTextAtSize(gstAmountText, 11);
      page.drawText(gstAmountText, {
        x: width - rightMargin - gstAmountWidth,
        y: summaryY,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      });
      summaryY -= 5;
      
      // Line after GST
      page.drawLine({
        start: {
          x: summaryX + 10,
          y: summaryY
        },
        end: {
          x: width - rightMargin,
          y: summaryY
        },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8)
      });
      summaryY -= 13;
    }
    
    // Total
    page.drawText("Total:", {
      x: summaryX + 10,
      y: summaryY,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    const totalAmountText = `$${total.toFixed(2)}`;
    const totalAmountWidth = helveticaBoldFont.widthOfTextAtSize(totalAmountText, 12);
    page.drawText(totalAmountText, {
      x: width - rightMargin - totalAmountWidth,
      y: summaryY,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });

    // Define bottom positioning for all bottom elements
    const bottomMargin = 90; // Distance from bottom of page
    const bottomY = bottomMargin; // Y coordinate for bottom elements

    // Payment Instructions (BOTTOM LEFT) - First element
    const paymentInstructionsX = 50;
    let paymentY = bottomY + 250; // Start payment instructions
    
    page.drawText("Payment Instructions:", {
      x: paymentInstructionsX,
      y: paymentY,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0)
    });
    paymentY -= 15;
    
    
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
      paymentY -= 120; // Extra spacing before notes
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

    // Footer branding - properly centered at bottom of page
    const footerText = "Created by museioapp.com";
    const footerTextWidth = helveticaFont.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (width - footerTextWidth) / 2, // Properly centered calculation
      y: 30,
      size: 8,
      font: helveticaFont,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    console.log("PDF content added successfully, generating base64...");
    
    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    console.log(`PDF generated, size: ${Math.round(pdfBytes.length / 1024)} KB`);
    
    // Convert to base64 using a simple, reliable method
    const base64String = await convertToBase64Reliable(pdfBytes);
    console.log(`PDF base64 conversion completed: ${Math.round(base64String.length / 1024)} KB`);
    
    if (!base64String || base64String.length < 100) {
      throw new Error("PDF generation failed - output is too small or empty");
    }
    
    // Validate the base64 string format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
      throw new Error("Invalid base64 format generated");
    }
    
    // Test decode a small portion to verify integrity
    try {
      const testSample = base64String.substring(0, 100);
      atob(testSample);
      console.log("Base64 encoding integrity verified");
    } catch (validateError) {
      console.error("Base64 validation failed:", validateError);
      throw new Error(`PDF base64 encoding validation failed: ${validateError.message}`);
    }
    
    return base64String;
  } catch (error) {
    console.error("Error in generateInvoicePDF:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

// Simple and reliable base64 conversion
async function convertToBase64Reliable(buffer) {
  try {
    console.log(`Converting buffer of size ${buffer.length} bytes to base64`);
    // Convert the entire buffer to binary string in chunks to avoid call stack issues
    let binaryString = '';
    const chunkSize = 24576; // 24KB chunks - aligned for base64 (divisible by 3)
    for(let i = 0; i < buffer.length; i += chunkSize){
      const chunk = buffer.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      // Yield control occasionally for very large files
      if (i % (chunkSize * 10) === 0 && i > 0) {
        await new Promise((resolve)=>setTimeout(resolve, 0));
      }
    }
    // Convert to base64
    const base64Result = btoa(binaryString);
    console.log(`Base64 conversion successful, output length: ${base64Result.length}`);
    return base64Result;
  } catch (error) {
    console.error("Base64 conversion failed:", error);
    throw new Error(`Base64 conversion failed: ${error.message}`);
  }
}
