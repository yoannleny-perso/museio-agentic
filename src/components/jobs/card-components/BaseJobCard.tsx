
import React from 'react';
import { Job } from '@/types';
import { formatCurrency } from '@/lib/utils';
import JobStatusDisplay from '../JobStatusDisplay';
import JobDateDisplay from './JobDateDisplay';
import JobInfoDetails from './JobInfoDetails';
import LiveIndicator from './LiveIndicator';
import { isJobLive } from '@/utils/jobStatusUpdater';
import { getJobDisplayPrice } from '@/utils/jobPricing';

interface BaseJobCardProps {
  job: Job;
  onClick: () => void;
  children?: React.ReactNode;
  rightColumnContent?: React.ReactNode;
  className?: string;
}

// Helper function to get status-specific background class
const getStatusBackgroundClass = (status: string): string => {
  switch (status) {
    case 'drafted':
      return 'from-[#FBFAFE] to-[#F9F8FD]/60';
    case 'upcoming':
      return 'from-[#FAFCFF] to-[#F5F9FE]/60';
    case 'past':
      return 'from-[#FFFDF7] to-[#FFFCF2]/60';
    case 'invoice-sent':
      return 'from-[#FCFAFF] to-[#F8F5FF]/60';
    case 'paid':
      return 'from-[#FBFEF8] to-[#F8FDF4]/60';
    default:
      return 'from-[#FCFCFC] to-[rgba(255,255,255,0.6)]';
  }
};

// Helper function to get status-specific border class
const getStatusBorderClass = (status: string): string => {
  switch (status) {
    case 'drafted':
      return 'border-l-gray-400';
    case 'upcoming':
      return 'border-l-[#A7C7F9]';
    case 'past':
      return 'border-l-[#FBBF24]';
    case 'invoice-sent':
      return 'border-l-[#9b87f5]';
    case 'paid':
      return 'border-l-[#86CE68]';
    default:
      return 'border-l-gray-300';
  }
};

const BaseJobCard: React.FC<BaseJobCardProps> = ({ 
  job, 
  onClick, 
  children, 
  rightColumnContent,
  className = ''
}) => {
  // Get status-specific background gradient
  const statusBackgroundClass = getStatusBackgroundClass(job.status);
  // Get status-specific border color
  const statusBorderClass = getStatusBorderClass(job.status);
  // Check if the job is currently live
  const isLive = isJobLive(job);

  return (
    <div
      className={`relative rounded-xl p-4 mb-3 bg-gradient-to-br ${statusBackgroundClass} shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${statusBorderClass} ${className}`}
      onClick={onClick}
    >      
      <div className="flex items-start gap-4">
        {/* Date box */}
        <JobDateDisplay date={job.date} />
        
        {/* Content */}
        <div className="flex-grow min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mr-2 mb-2 text-left">{job.title}</h3>
          
          <JobInfoDetails job={job} />
        </div>
        
        {/* Right side column: Rate, Status, Live indicator, then Buttons */}
        <div className="flex flex-col items-end gap-3">
          {/* Rate at the top with gradient */}
          <div className="text-lg font-bold bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent">
            {formatCurrency(getJobDisplayPrice(job))}
          </div>
          
          {/* Status display in the middle (only show if NOT live) */}
          {!isLive && (
            <div className="flex items-center gap-2">
              <JobStatusDisplay status={job.status} job={job} />
            </div>
          )}
          
          {/* Live indicator (if job is live) - using md size instead of sm */}
          {isLive && (
            <LiveIndicator size="md" />
          )}
          
          {/* Action button/content at the bottom */}
          {rightColumnContent}
        </div>
      </div>
    </div>
  );
};

export default BaseJobCard;
