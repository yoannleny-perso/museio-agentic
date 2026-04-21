import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Job } from '@/types';
import PriorityJobCard from './PriorityJobCard';
import { AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface PriorityJobsSectionProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onInvoiceClick?: (job: Job) => void; // Add prop for handling direct invoice clicks
  setIsTherePastJob: (value: boolean) => void; // Function to set if there are past jobs
}

const PriorityJobsSection: React.FC<PriorityJobsSectionProps> = ({
  jobs,
  onJobClick,
  onInvoiceClick,
  setIsTherePastJob
}) => {
  // Filter to only show past jobs (these need action)
  const pastJobs = jobs.filter(job => job.status === 'past');
  
  // Use useEffect to update parent state after render
  useEffect(() => {
    setIsTherePastJob(pastJobs.length > 0);
  }, [pastJobs.length, setIsTherePastJob]);
  
  // Don't render the section if there are no past jobs
  if (pastJobs.length === 0) {
    return null;
  }
  
  
  // Define card click handler for consistency with JobCard
  const handlePriorityJobClick = (job: Job) => {
    // For past jobs, use the invoice click handler which opens the PastJobModal
    if (job.status === 'past' && onInvoiceClick) {
      onInvoiceClick(job);
      return;
    }
    
    // For invoice-sent or paid jobs, use the invoice click handler
    if (onInvoiceClick && (job.status === 'invoice-sent' || job.status === 'paid')) {
      onInvoiceClick(job);
    } else {
      // Otherwise fall back to regular job click handler
      onJobClick(job);
    }
  };
  
  return (
    <>
    <div className={`mb-6 pb-4 border-b border-gray-200 ${Capacitor.isNativePlatform() ? 'pt-12 ' : ''}`}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={20} className="text-violet-500" />
        <h2 className="font-semibold text-violet-500">Actions needed</h2>
      </div>
      
      <div className="space-y-3">
        {pastJobs.map(job => (
          <PriorityJobCard 
            key={job.id} 
            job={job} 
            onClick={() => handlePriorityJobClick(job)} 
            isSending={false}
          />
        ))}
      </div>
    </div>
    </>
  );
};

export default PriorityJobsSection;
