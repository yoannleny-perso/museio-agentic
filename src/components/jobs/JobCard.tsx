
import React from 'react';
import { Job } from '@/types';
import BaseJobCard from './card-components/BaseJobCard';
import CallToActionButton from './card-components/CallToActionButton';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
  onMarkAsPaid?: (e: React.MouseEvent, job: Job) => void;
  isCompletedTab: boolean;
  isSending?: boolean;
  isProcessing?: boolean;
  onInvoiceClick?: (job: Job) => void; // Prop for handling invoice clicks
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onClick, 
  onMarkAsPaid,
  isCompletedTab,
  isSending = false,
  isProcessing = false,
  onInvoiceClick
}) => {
  const navigate = useNavigate();
  const { updateJob } = useAppContext();
  
  const handleCardClick = () => {
    // For past jobs, use the onInvoiceClick handler if provided
    if (job.status === 'past' && onInvoiceClick) {
      console.log('[JobCard] Opening past job modal for job:', job.id);
      onInvoiceClick(job);
      return;
    }
    
    // For invoice-sent or paid jobs, use the onInvoiceClick handler if provided
    if ((job.status === 'invoice-sent' || job.status === 'paid') && onInvoiceClick) {
      console.log(`[JobCard] Opening ${job.status} job directly:`, job.id);
      onInvoiceClick(job);
      return;
    }
    
    // For upcoming jobs, navigate directly to the edit job page
    if (job.status === 'upcoming' || job.status === 'drafted') {
      console.log('[JobCard] Navigating to edit job:', job.id);
      onClick(job);
      return;
    }
    
    // For other statuses, use the onClick handler
    onClick(job);
  };
  
  // Create the action button based on job status
  const actionButton = (
    <CallToActionButton 
      job={job}
      onMarkAsPaid={onMarkAsPaid ? (e) => onMarkAsPaid(e, job) : undefined}
      isSending={isSending || isProcessing}
    />
  );
  
  return (
    <BaseJobCard
      job={job}
      onClick={handleCardClick}
      rightColumnContent={actionButton}
      className=""
    />
  );
};

export default JobCard;
