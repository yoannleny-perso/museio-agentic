
import { Job } from '@/types';
import { useClipboardOperations } from './useClipboardOperations';
import { useJobConfirmationOperations } from './useJobConfirmationOperations';
import { useJobUpdateOperations } from './useJobUpdateOperations';
import { useJobOperations as useGlobalJobOperations } from '@/hooks/useJobOperations';

interface JobOperationsProps {
  job: Job;
  onUpdateJob: (job: Job) => void;
  onEdit?: (id: string, data: Partial<Job>) => Promise<boolean> | void;
  onClose?: (e?: React.MouseEvent) => void;
}

export const useJobOperations = ({
  job,
  onUpdateJob,
  onEdit,
  onClose,
}: JobOperationsProps) => {
  // Use our extracted clipboard operations hook
  const { handleCopyToClipboard } = useClipboardOperations();
  
  // Use our extracted job confirmation operations hook
  const { isConfirming, handleConfirmJob, handleSaveDraft } = 
    useJobConfirmationOperations(job, onEdit, onClose);
  
  // Use our extracted job update operations hook
  const { isSaving, handleJobUpdate } = 
    useJobUpdateOperations(job, onUpdateJob, onEdit, onClose);
  
  // Get handleJobSubmit from the global job operations hook
  const { handleJobSubmit } = useGlobalJobOperations();

  return {
    isSaving,
    isConfirming,
    handleJobUpdate,
    handleCopyToClipboard: () => handleCopyToClipboard(job),
    handleConfirmJob,
    handleSaveDraft,
    handleJobSubmit
  };
};
