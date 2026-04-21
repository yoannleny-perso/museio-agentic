import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BankDetailsType {
  fundName?: string;
  memberNumber?: string;
  fundAbn?: string;
  fundUsi?: string;
}

interface SuperDetailsProps {
  bankDetails: BankDetailsType;
  compact?: boolean;
  shouldShow?: boolean;
}

const SuperDetails: React.FC<SuperDetailsProps> = ({ bankDetails, compact = false, shouldShow = true }) => {
  const isMobile = useIsMobile();
  const isExtraCompact = isMobile && compact;
  
  // Check if any super details exist
  const hasSuper = bankDetails?.fundName || bankDetails?.memberNumber || bankDetails?.fundAbn || bankDetails?.fundUsi;
  
  if (!hasSuper || !shouldShow) {
    return null; // Don't show if no super data or if disabled by user
  }
  
  return (
    <div className={isExtraCompact ? "mb-2" : compact ? "mb-3" : "mb-6"}>
      <h3 className={`font-bold text-gray-700 ${isExtraCompact ? 'mb-0.5 text-[10px]' : compact ? 'mb-1 text-xs' : 'mb-2'}`}>
        Please pay superannuation contributions to:
      </h3>
      <div className={`${isExtraCompact ? 'text-[6px]' : compact ? 'text-[7px]' : ''} space-y-0`}>
        {bankDetails?.fundName && (
          <p><span className="font-medium">Fund Name:</span> {bankDetails.fundName}</p>
        )}
        {bankDetails?.memberNumber && (
          <p><span className="font-medium">Member Number:</span> {bankDetails.memberNumber}</p>
        )}
        {bankDetails?.fundAbn && (
          <p><span className="font-medium">Fund ABN:</span> {bankDetails.fundAbn}</p>
        )}
        {bankDetails?.fundUsi && (
          <p><span className="font-medium">Fund USI:</span> {bankDetails.fundUsi}</p>
        )}
      </div>
    </div>
  );
};

export default SuperDetails;