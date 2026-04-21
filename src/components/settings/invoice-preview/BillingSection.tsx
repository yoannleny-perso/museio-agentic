
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BillingSectionProps {
  from: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    abn?: string;
  };
  to: {
    clientName: string;
    email?: string;
    location?: string;
  };
  compact?: boolean;
}

const FullName = ({ firstName, lastName }: { firstName?: string; lastName?: string }) => {
  if (!firstName && !lastName) {
    return <p></p>;
  }
  return <p>{firstName} {lastName}</p>;
}

const BillingSection: React.FC<BillingSectionProps> = ({ from, to, compact = false }) => {
  const isMobile = useIsMobile();
  const isExtraCompact = isMobile && compact;
  
  return (
    <div className={`flex justify-between ${isExtraCompact ? 'mb-1 text-[9px]' : compact ? 'mb-2 text-xs' : 'mb-6'}`}>
      <div className="w-1/2 pr-1">
        <h3 className={`font-bold text-gray-700 ${isExtraCompact ? 'mb-0.5 text-[9px]' : 'mb-1'}`}>From:</h3>
        {from.email && <p className={isExtraCompact ? "line-clamp-1" : ""}>{from.email}</p>}
        {from.phone && <p>{from.phone}</p>}
        {isExtraCompact ? null : compact ? null : <br></br>}
        {from.companyName && <p className={isExtraCompact ? "line-clamp-1" : ""}>{from.companyName}</p>}
        {from.companyAddress && <p className={isExtraCompact ? "line-clamp-1" : compact ? "line-clamp-1" : ""}>{from.companyAddress}</p>}
        {from.abn && <p>ABN: {from.abn}</p>}
      </div>
      <div className="w-1/2 pl-1">
        <h3 className={`font-bold text-gray-700 ${isExtraCompact ? 'mb-0.5 text-[9px]' : 'mb-1'}`}>Bill To:</h3>
        <p>{to.clientName || 'Client Name'}</p>
        <p className={isExtraCompact ? "line-clamp-1" : ""}>{to.email || 'client@example.com'}</p>
        <p className={isExtraCompact ? "line-clamp-1" : compact ? "line-clamp-1" : ""}>{to.location || 'Client Address'}</p>
      </div>
    </div>
  );
};

export default BillingSection;
