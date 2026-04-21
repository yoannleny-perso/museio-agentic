
import React from 'react';
import { format } from 'date-fns';

interface SignatureSectionProps {
  signature?: string;
  signatureType?: 'drawn' | 'typed';
  date: Date;
  compact?: boolean;
}

const SignatureSection: React.FC<SignatureSectionProps> = ({
  signature,
  signatureType,
  date,
  compact = false
}) => {
  if (!signature) return null;

  const isExtraCompact = compact;

  return (
    <div className={`flex justify-end ${isExtraCompact ? 'mt-1' : 'mt-4'}`}>
      <div className="text-right">
        {/* Handle both signed URLs and legacy signatures */}
        <div className={`border-b border-gray-300 ${isExtraCompact ? 'pb-1 mb-1' : 'pb-2 mb-2'} ${isExtraCompact ? 'w-24' : 'w-32'}`}>
          <img 
            src={signature} 
            alt="Signature" 
            className={`${isExtraCompact ? 'h-4' : 'h-6'} object-contain ml-auto`}
            onError={(e) => {
              console.error('Failed to load signature in preview:', signature);
              // Fallback: hide the image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <p className={`${isExtraCompact ? 'text-[7px]' : compact ? 'text-[8px]' : 'text-xs'} text-gray-500`}>
          {format(date, 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  );
};

export default SignatureSection;
