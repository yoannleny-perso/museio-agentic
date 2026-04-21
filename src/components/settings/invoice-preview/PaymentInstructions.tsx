
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BankDetailsType {
  accountHolderName?: string;
  bsbNumber?: string;
  accountNumber?: string;
}

interface PaymentInstructionsProps {
  bankDetails: BankDetailsType;
  compact?: boolean;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({ bankDetails, compact = false }) => {
  const isMobile = useIsMobile();
  const isExtraCompact = isMobile && compact;
  
  if (!bankDetails?.accountHolderName && !bankDetails?.bsbNumber && !bankDetails?.accountNumber) {
    return null; // Don't show if no data
  }
  
  return (
    <div className={isExtraCompact ? "mb-2" : compact ? "mb-3" : "mb-6"}>
      <h3 className={`font-bold text-gray-700 ${isExtraCompact ? 'mb-0.5 text-[10px]' : compact ? 'mb-1 text-xs' : 'mb-2'}`}>
        Payment Instructions:
      </h3>
      <div className={`${isExtraCompact ? 'text-[6px]' : compact ? 'text-[7px]' : ''} space-y-0`}>
        <p><span className="font-medium">Account Name:</span> {bankDetails?.accountHolderName || ''}</p>
        <p><span className="font-medium">BSB:</span> {bankDetails?.bsbNumber || ''}</p>
        <p><span className="font-medium">Account Number:</span> {bankDetails?.accountNumber || ''}</p>
      </div>
    </div>
  );
};

export default PaymentInstructions;
