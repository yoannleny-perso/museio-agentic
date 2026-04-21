
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaymentSummaryProps {
  subtotal: number;
  gst: number;
  total: number;
  showGst: boolean;
  discountAmount?: number;
  discountPercent?: number;
  compact?: boolean;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ 
  subtotal, 
  gst, 
  total,
  showGst,
  discountAmount = 0,
  discountPercent = 0,
  compact = false
}) => {
  const isMobile = useIsMobile();
  const isExtraCompact = isMobile && compact;
  
  return (
    <div className={`flex justify-end ${isExtraCompact ? 'mb-2' : compact ? 'mb-3' : 'mb-6'}`}>
      <div className={`${isExtraCompact ? 'w-36' : compact ? 'w-44' : 'w-64'} ${isExtraCompact ? 'space-y-0.5' : compact ? 'space-y-1' : 'space-y-2'}`}>
        <div className="flex justify-between pb-1 border-b">
          <span className={isExtraCompact ? "text-[9px]" : compact ? "text-xs" : ""}>Subtotal:</span>
          <span className={isExtraCompact ? "text-[9px]" : compact ? "text-xs" : ""}>{formatCurrency(subtotal)}</span>
        </div>
        
        {/* Show discount line if there's a discount */}
        {discountAmount > 0 && (
          <div className="flex justify-between pb-1 border-b">
            <span className={isExtraCompact ? "text-[9px]" : compact ? "text-xs" : ""}>Discount ({discountPercent}%):</span>
            <span className={isExtraCompact ? "text-[9px]" : compact ? "text-xs" : ""}>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        
        {/* Only show GST line if showGst is true */}
        {showGst && (
          <div className="flex justify-between pb-1 border-b">
            <span className={isExtraCompact ? "text-[9px]" : compact ? "text-xs" : ""}>GST (10%):</span>
            <span className={isExtraCompact ? "text-[9px]" : compact ? "text-xs" : ""}>{formatCurrency(gst)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold">
          <span className={isExtraCompact ? "text-[10px]" : compact ? "text-xs" : "text-lg"}>Total:</span>
          <span className={isExtraCompact ? "text-[10px]" : compact ? "text-xs" : "text-lg"}>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
