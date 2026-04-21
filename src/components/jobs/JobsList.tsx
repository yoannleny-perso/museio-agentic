
import React from 'react';
import { Job } from '@/types';
import JobCard from './JobCard';
import EmptyJobsState from './EmptyJobsState';
import { sortjobs } from './utils/jobsSorter';

interface JobsListProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onMarkAsPaid?: (e: React.MouseEvent, job: Job) => void;
  isCompletedTab?: boolean;
  onInvoiceClick?: (job: Job) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

const JobsList: React.FC<JobsListProps> = ({ 
  jobs, 
  onJobClick, 
  onMarkAsPaid,
  isCompletedTab = false,
  onInvoiceClick,
  emptyStateTitle,
  emptyStateDescription
}) => {
  // Use the sortjobs utility to sort the jobs based on the tab
  const sortedJobs = sortjobs(jobs, isCompletedTab);
  
  if (sortedJobs.length === 0) {
    return (
      <EmptyJobsState 
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    );
  }
  
  return (
    <>
      {sortedJobs.map((job) => (
        <JobCard 
          key={job.id}
          job={job}
          onClick={() => onJobClick(job)}
          onMarkAsPaid={onMarkAsPaid}
          isCompletedTab={isCompletedTab}
          onInvoiceClick={onInvoiceClick}
        />
      ))}
    </>
  );
};

export default JobsList;
