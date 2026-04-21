
import React from 'react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceHeaderProps {
  logo?: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  total: string;
  compact?: boolean;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  logo,
  invoiceNumber,
  issueDate,
  dueDate,
  total,
  compact = false
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${compact ? 'mb-2' : 'mb-4'}`}>
      <div className="flex justify-between items-start">
        <div className={`${isMobile ? 'w-1/2' : ''}`}>
          {/* Logo - only show if logo is defined */}
          {logo && (
            <div className={`${compact ? 'h-8 w-20' : 'h-10 w-24'} mb-1`}>
              <img 
                src={logo} 
                alt="Logo" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </div>
        
        <div className={`text-right ${isMobile ? 'w-1/2' : ''}`}>
          {/* Move INVOICE title to the right */}
          <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold mb-1`}>INVOICE</h1>
          
          <div className={`${compact ? 'text-[9px] space-y-0' : 'text-xs space-y-0.5'}`}>
            <p><span className="font-medium">Invoice Number:</span> {invoiceNumber}</p>
            <p><span className="font-medium">Date of Issue:</span> {format(issueDate, compact ? 'dd/MM/yy' : 'MMMM d, yyyy')}</p>
            <p><span className="font-medium">Due Date:</span> {format(dueDate, compact ? 'dd/MM/yy' : 'MMMM d, yyyy')}</p>
            <p className={`${compact ? 'font-bold text-[10px] mt-0.5' : 'font-bold text-sm mt-1'}`}>
              <span className="font-medium">Balance Due:</span> {total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHeader;
