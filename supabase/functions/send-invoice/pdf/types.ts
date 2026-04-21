
// PDF generation types
export interface PDFGenerationOptions {
  margin: number;
  headerFontSize: number;
  subheaderFontSize: number;
  normalFontSize: number;
  smallFontSize: number;
}

export interface PDFSections {
  header: (doc: any, options: PDFGenerationOptions, currentY: number) => number;
  billing: (doc: any, options: PDFGenerationOptions, currentY: number) => number;
  jobDetails: (doc: any, options: PDFGenerationOptions, currentY: number) => number;
  paymentSummary: (doc: any, options: PDFGenerationOptions, currentY: number) => number;
  paymentInstructions: (doc: any, options: PDFGenerationOptions, currentY: number) => number;
  footer: (doc: any, options: PDFGenerationOptions, currentY: number) => number;
}



