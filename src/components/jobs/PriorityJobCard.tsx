
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, formatDistance } from 'date-fns';
import { Job } from '@/types';
import BaseJobCard from './card-components/BaseJobCard';
import JobInfoDetails from './card-components/JobInfoDetails';
import { FileText, Loader2 } from 'lucide-react';

interface PriorityJobCardProps {
  job: Job;
  onClick: () => void;
  isSending?: boolean;
}

const PriorityJobCard: React.FC<PriorityJobCardProps> = ({ 
  job, 
  onClick, 
  isSending = false
}) => {
  // Handle click for opening past job modal
  const handleCardClick = () => {
    console.log('[PriorityJobCard] Card clicked for job:', job.id);
    onClick();
  };
  
  // Priority Job status indicator - smaller and more compact now
  const actionIndicator = (
    <div
      className="flex items-center bg-[#FBBF24] text-white text-xs px-2 py-0.5 rounded whitespace-nowrap"
    >
      {isSending ? <Loader2 size={14} className="mr-0.5 animate-spin" /> : <FileText size={14} className="mr-0.5" />} Send Invoice
    </div>
  );
  
  // The PriorityJobCard will now use the BaseJobCard with the same
  // background and border style pattern as other cards, but we'll ensure
  // it stands out with the amber border color
  return (
    <BaseJobCard
      job={job}
      onClick={handleCardClick}
      className="from-[#FFFDF7] to-[#FFFCF2]/60"
      rightColumnContent={actionIndicator}
    />
  );
};

export default PriorityJobCard;
