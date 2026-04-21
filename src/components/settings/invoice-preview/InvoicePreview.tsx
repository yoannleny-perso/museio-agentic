import React from 'react';
import { formatCurrency } from '@/lib/utils';
import InvoiceHeader from './InvoiceHeader';
import BillingSection from './BillingSection';
import InvoiceItemsSection from './InvoiceItemsSection';
import PaymentSummary from './PaymentSummary';
import PaymentInstructions from './PaymentInstructions';
import SignatureSection from './SignatureSection';
import SuperDetails from './SuperDetails';
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoicePreviewProps {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  job: any;
  subtotal: number;
  gst: number;
  total: number;
  showGst: boolean;
  discountAmount?: number;
  discountPercent?: number;
  logo?: string;
  signature?: string;
  signatureType?: 'drawn' | 'typed';
  profileData: any;
  bankDetails: any;
  footerNotes?: string;
  compact?: boolean;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceNumber,
  issueDate,
  dueDate,
  job,
  subtotal,
  gst,
  total,
  showGst,
  discountAmount,
  discountPercent,
  logo,
  signature,
  signatureType,
  profileData,
  bankDetails,
  footerNotes,
  compact = false
}) => {
  const isMobile = useIsMobile();
  const isExtraCompact = isMobile && compact;
  
  return (
    <div className={`font-sans ${isExtraCompact ? 'p-2' : compact ? 'p-3' : 'p-6'}`}>
      <InvoiceHeader 
        logo={logo}
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        dueDate={dueDate}
        total={formatCurrency(total)}
        compact={compact}
      />
      
      <BillingSection 
        from={{
          firstName: profileData?.firstName,
          lastName: profileData?.lastName,
          username: profileData?.username,
          email: profileData?.email,
          phone: profileData?.phone,
          companyName: profileData?.companyName,
          companyAddress: profileData?.companyAddress,
          abn: profileData?.abn
        }}
        to={{
          clientName: job.client,
          email: job.contact_email,
          location: job.location
        }}
        compact={compact}
      />
      
      <InvoiceItemsSection 
        job={job}
        subtotal={subtotal}
        compact={compact}
      />
      
      <PaymentSummary 
        subtotal={subtotal}
        gst={gst}
        total={total}
        showGst={showGst}
        discountAmount={discountAmount}
        discountPercent={discountPercent}
        compact={compact}
      />
      
      {bankDetails && (
        <PaymentInstructions 
          bankDetails={bankDetails} 
          compact={compact}
        />
      )}
      
      {bankDetails && (
        <SuperDetails 
          bankDetails={bankDetails} 
          compact={compact}
          shouldShow={bankDetails.includeSuperInInvoices}
        />
      )}
      
      <div className={isExtraCompact ? "mt-1" : compact ? "mt-2" : "mt-6"}>
        {footerNotes && (
          <div className={`${isExtraCompact ? 'mb-1' : compact ? 'mb-2' : 'mb-4'} text-gray-600 ${isExtraCompact ? 'text-[8px]' : compact ? 'text-[9px]' : ''}`}>
            <h3 className="font-bold text-gray-700 mb-0.5">Notes:</h3>
            <p className={`${isExtraCompact ? 'line-clamp-1' : compact ? 'line-clamp-2' : ''}`}>{footerNotes}</p>
          </div>
        )}
        
        <SignatureSection 
          signature={signature}
          signatureType={signatureType}
          date={issueDate}
          compact={compact}
        />
      </div>
      
      <div className={`${isExtraCompact ? 'mt-3 pb-2' : compact ? 'mt-4 pb-3' : 'mt-8 pb-4'} text-center ${isExtraCompact ? 'text-[7px]' : 'text-xs'} text-gray-400`}>
        Created by museioapp.com
      </div>
    </div>
  );
};

export default InvoicePreview;
