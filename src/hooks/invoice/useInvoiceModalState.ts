
import { useState } from 'react';

/**
 * Hook for managing invoice-related modal states
 */
export const useInvoiceModalState = () => {
  const [isPastJobModalOpen, setIsPastJobModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return {
    isPastJobModalOpen,
    setIsPastJobModalOpen,
    isPreviewOpen,
    setIsPreviewOpen
  };
};
