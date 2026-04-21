
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { InvoiceSettings } from '@/types/invoiceSettings';
import { Job } from '@/types';
import InvoicePreview from './invoice-preview/InvoicePreview';
import { BankDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useJobItems } from '@/hooks/useJobItems';
import { calculateJobItemsSummary } from '@/services/jobItemsService';

// Mock job data for invoice preview when no job is provided
const mockJob = {
  id: 'preview-job-id',
  title: 'Job Title', 
  client: 'Sample Client',
  location: 'Sample Venue, Sydney',
  date: new Date().toISOString().split('T')[0],
  start_time: '19:00:00',
  end_time: '23:00:00',
  rate: 550,
  status: 'confirmed',
  contact_email: 'client@example.com',
  job_description: 'This is a sample job description for invoice preview purposes.',
  pricing_mode: 'simple',
  discount_percent: 0
};

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceSettings: InvoiceSettings;
  profileData: any;
  bankDetails: BankDetails | null;
  signature?: string;
  signatureType?: 'drawn' | 'typed';
  job?: Job; // Optional job prop to support both use cases
}

const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  open,
  onOpenChange,
  invoiceSettings,
  profileData,
  bankDetails,
  signature,
  signatureType,
  job
}) => {
  // Use provided job or fallback to mock data
  const jobData = job || mockJob;
  
  // Fetch job items for itemized pricing
  const { data: jobItems = [] } = useJobItems(job?.id);
  
  // Calculate current date + payment terms for due date
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + (invoiceSettings.paymentTerms || 14));
  
  // Calculate subtotal, GST, and total based on pricing mode
  let subtotal: number;
  let gst: number;
  let total: number;
  
  const isItemized = jobData.pricing_mode === 'itemized' && jobItems.length > 0;
  
  // Calculate discount values for display
  let discountAmount = 0;
  let discountPercent = 0;
  
  if (isItemized) {
    // Use itemized calculation with global discount
    const gstRate = invoiceSettings.addGST ? 0.1 : 0;
    discountPercent = jobData.discount_percent || 0;
    const summary = calculateJobItemsSummary(jobItems, gstRate, discountPercent);
    
    subtotal = summary.subtotal; // Raw subtotal (before discount)
    discountAmount = summary.discountAmount;
    gst = summary.tax;
    total = summary.total;
  } else {
    // Use simple calculation from job rate
    subtotal = jobData.rate || 0;
    gst = invoiceSettings.addGST ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    total = subtotal + gst;
  }

  console.log('Pricing mode:', jobData.pricing_mode, 'Items:', jobItems.length, 'Subtotal:', subtotal, 'GST:', gst, 'Total:', total);
  
  // Generate a sample invoice number using the format
  const invoiceNumber = invoiceSettings.format
    .replace('{YYYY}', today.getFullYear().toString())
    .replace('{MM}', (today.getMonth() + 1).toString().padStart(2, '0'))
    .replace('{DD}', today.getDate().toString().padStart(2, '0'))
    .replace('{NUM}', '001');
    
  const handleClose = () => {
    onOpenChange(false);
  };

  // Add state for scaling and refs for measurement
  const [scale, setScale] = useState(1);
  const invoiceContainerRef = useRef<HTMLDivElement>(null);
  const invoiceContentRef = useRef<HTMLDivElement>(null);
  
  // Calculate scale factor when the dialog opens or content changes
  useEffect(() => {
    if (!open) return;
    
    const calculateScale = () => {
      const container = invoiceContainerRef.current;
      const content = invoiceContentRef.current;
      
      if (!container || !content) return;
      
      // Get the container and content dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      
      // Calculate scale factors for both width and height
      const widthScale = containerWidth / contentWidth;
      const heightScale = containerHeight / contentHeight;
      
      // Use the smaller scale to ensure content fits in both dimensions
      // Use a smaller safety margin (0.9) to ensure more content fits
      const safetyMargin = 0.9;
      const calculatedScale = Math.min(
        widthScale,
        heightScale,
        1 // Never scale up, only down
      ) * safetyMargin;
      
      setScale(calculatedScale);
    };
    
    // Calculate initial scale
    calculateScale();
    
    // Recalculate when window is resized
    window.addEventListener('resize', calculateScale);
    console.log('Invoice preview dialog opened, calculating scale:', scale);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, [open, invoiceSettings, profileData, bankDetails, signature, job, scale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg max-h-[90vh] rounded-2xl gap-0" hideCloseButton={true}>
        {/* Custom Header - Similar to PastJobModalHeader */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent">
              Invoice Preview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full border border-[#8B5CF6] h-9 w-9 bg-transparent">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scaling Container - Updated with flex justify-center AND items-center */}
        <div 
          ref={invoiceContainerRef} 
          className="flex-1 px-4 py-3 bg-[#f9f7fc] h-[80vh] overflow-hidden flex justify-center items-center"
        >
          <div 
            ref={invoiceContentRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              width: '100%'
            }}
          >
            <div className="bg-white rounded-lg border">
              <InvoicePreview
                invoiceNumber={invoiceNumber}
                issueDate={today}
                dueDate={dueDate}
                job={jobData}
                subtotal={subtotal}
                discountAmount={discountAmount}
                discountPercent={discountPercent}
                gst={gst}
                total={total}
                showGst={invoiceSettings.addGST}
                logo={invoiceSettings.logo}
                signature={signature}
                signatureType={signatureType}
                profileData={profileData}
                bankDetails={bankDetails}
                footerNotes={invoiceSettings.footerNotes}
                compact={true}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewDialog;
