import React, { useEffect, useState } from 'react';
import { Check, Clock, DollarSign, FileText, Edit3 } from 'lucide-react';
import { JobStatus } from '@/types';
import LiveIndicator from './card-components/LiveIndicator';
import { isJobLive } from '@/utils/jobStatusUpdater';

interface StatusDisplayProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
  job?: any; // Optional job object to check if it's live
}

const JobStatusDisplay: React.FC<StatusDisplayProps> = ({ 
  status,
  size = 'md',
  job
}) => {
  // Use state to track if the job is live
  const [isLive, setIsLive] = useState(false);
  
  // Check if the job is currently live (happening now)
  useEffect(() => {
    if (job && status === 'upcoming') {
      setIsLive(isJobLive(job));
      
      // Set up interval to check status every minute if job is upcoming
      const checkInterval = setInterval(() => {
        setIsLive(isJobLive(job));
      }, 60000); // Check every minute
      
      return () => clearInterval(checkInterval);
    } else {
      setIsLive(false);
    }
  }, [job, status]);
  
  // Log status changes for debugging
  useEffect(() => {
  }, [status, isLive]);
  
  const getStatusDisplay = () => {
    // If job is live (ongoing), show live indicator regardless of status
    if (isLive) {
      return {
        component: <LiveIndicator size={size === 'sm' ? 'sm' : 'md'} />,
        useComponent: true
      };
    }
    
    // Otherwise show normal status indicators
    switch (status) {
      case 'drafted':
        return {
          text: 'Draft',
          bgColor: 'bg-[#D4D4D8]/50',
          textColor: 'text-gray-800',
          icon: <Edit3 size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />,
          useComponent: false
        };
      case 'upcoming':
        return {
          text: 'Upcoming',
          bgColor: 'bg-[#A7C7F9]/50',
          textColor: 'text-blue-800',
          icon: <Clock size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />,
          useComponent: false
        };
      case 'past':
        return {
          text: 'Past',
          bgColor: 'bg-[#FDE68A]/50',
          textColor: 'text-amber-800',
          icon: <Clock size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />,
          useComponent: false
        };
      case 'invoice-sent':
        return {
          text: 'Invoiced',
          bgColor: 'bg-[#9b87f5]',
          textColor: 'text-white',
          icon: <FileText size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />,
          useComponent: false
        };
      case 'paid':
        return {
          text: 'Paid',
          bgColor: 'bg-[#D1F2BB]/50',
          textColor: 'text-[#4B7F52]',
          icon: <DollarSign size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />,
          useComponent: false
        };
      default:
        console.warn('[JobStatusDisplay] Unknown status:', status);
        return {
          text: 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: <Clock size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />,
          useComponent: false
        };
    }
  };
  
  const statusDisplay = getStatusDisplay();
  
  // If we need to use a component (like LiveIndicator)
  if (statusDisplay.useComponent) {
    return statusDisplay.component;
  }
  
  // Otherwise use the regular status display
  const { text, bgColor, textColor, icon } = statusDisplay;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  };
  
  return (
    <div className={`${bgColor} ${textColor} ${sizeClasses[size]} font-medium rounded flex items-center gap-1.5`}>
      {icon} {text}
    </div>
  );
};

export default JobStatusDisplay;
