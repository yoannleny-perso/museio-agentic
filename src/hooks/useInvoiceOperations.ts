
import { useState } from 'react';
import { Job } from '@/types';
import { useInvoiceSender } from './useInvoiceSender';
import { usePaymentOperations } from './invoice/usePaymentOperations';
import { useClockOffOperations } from './invoice/useClockOffOperations';
import { useInvoiceModalState } from './invoice/useInvoiceModalState';
import { useBankDetails } from '@/context/BankDetailsContext';
import { useProfile } from '@/context/ProfileContext';
import { useInvoiceSettings } from './useInvoiceSettings';

/**
 * Hook for handling invoice operations
 */
export const useInvoiceOperations = () => {
  const { profileData } = useProfile();
  const { bankDetails } = useBankDetails();
  const { invoiceSettings, loading } = useInvoiceSettings();
  
  
  // Use the focused hooks
  const { isSending, sendInvoice } = useInvoiceSender();
  const { markAsPaid, isMarkingAsPaid, processingJobId: paymentProcessingJobId } = usePaymentOperations();
  const { clockOff, processingJobId: clockOffProcessingJobId } = useClockOffOperations();
  const { isPastJobModalOpen, setIsPastJobModalOpen, isPreviewOpen, setIsPreviewOpen } = useInvoiceModalState();
  
  // Combine processing job IDs
  const processingJobId = paymentProcessingJobId || clockOffProcessingJobId;
  
  return {
    handleComplete: (e: React.MouseEvent, job: Job) => clockOff(e, job),
    handleSendInvoice: (job: Job) => sendInvoice(job, profileData, bankDetails, invoiceSettings?.logo),
    handleMarkAsPaid: markAsPaid,
    isSending,
    isMarkingAsPaid,
    processingJobId,
    isPastJobModalOpen,
    setIsPastJobModalOpen,
    isPreviewOpen,
    setIsPreviewOpen
  };
};
