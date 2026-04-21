
import { useState, useCallback } from 'react';
import { Job } from '@/types';

export function useHomePageState() {
  // Date and job selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Modal states (excluding job form modal which is now managed in App.tsx)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPastJobModalOpen, setIsPastJobModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Processing state
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  
  // Date selection handler
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);
  
  // Details modal open/close handler
  const handleDetailsOpenChange = useCallback((isOpen: boolean) => {
    setIsDetailsOpen(isOpen);
    if (!isOpen) {
      // Reset selected job when closing the details modal
      setSelectedJob(null);
    }
  }, []);
  
  // Job click handler
  const handleJobClick = useCallback((job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  }, []);
  
  return {
    selectedDate,
    selectedJob,
    setSelectedJob,
    isDetailsOpen,
    setIsDetailsOpen,
    isInvoiceModalOpen, 
    setIsInvoiceModalOpen,
    processingJobId,
    setProcessingJobId,
    isPastJobModalOpen,
    setIsPastJobModalOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    handleSelectDate,
    handleDetailsOpenChange,
    handleJobClick
  };
}
