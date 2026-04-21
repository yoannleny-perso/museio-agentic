
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Job } from '@/types';
import PastJobModalHeader from '@/components/jobs/past-job-modal/PastJobModalHeader';
import PastJobModalContent from '@/components/jobs/past-job-modal/PastJobModalContent';
import DeleteConfirmationDialog from '@/components/home/DeleteConfirmationDialog';
import PaymentConfirmationDialog from '@/components/jobs/PaymentConfirmationDialog';
import JobForm from '@/components/home/JobForm';
import { useDuplicateJob } from '@/hooks/useDuplicateJob';
import { useNavigate } from 'react-router-dom';

interface PastJobModalContainerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onEdit: (id: string, job: Partial<Job>) => Promise<boolean>;
  onSendInvoice: () => Promise<boolean>;
  onMarkAsPaid?: (job: Job) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  isSending?: boolean;
  isMarkingAsPaid?: boolean;
  onDuplicateJob?: (job: Job) => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
}

const PastJobModalContainer: React.FC<PastJobModalContainerProps> = ({
  isOpen,
  onOpenChange,
  job,
  onEdit,
  onSendInvoice,
  onMarkAsPaid,
  onDelete,
  isPreviewOpen,
  setIsPreviewOpen,
  isSending = false,
  isMarkingAsPaid = false,
  onDuplicateJob
}) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Initialize the duplicate job functionality with closing the current modal
  const {
    jobToDuplicate, 
    isDuplicateModalOpen, 
    setIsDuplicateModalOpen, 
    handleDuplicateJob,
    handleDuplicatedJobSubmit,
    handleCloseDuplicateModal
  } = useDuplicateJob({
    onCloseCurrentModal: () => onOpenChange(false)
  });
  
  // Reset dialog states when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsDeleteDialogOpen(false);
      setIsPaymentDialogOpen(false);
    }
  }, [isOpen]);
  
  // Handle edit button click - close this modal and open edit form
  const handleEdit = () => {
    if (job?.id) {
      onEdit(job.id, job);
    }
  };
  
  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  // Function to close the modal and navigate to calendar
  const handleClose = () => {
    onOpenChange(false);
    
  };

  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };
  
  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!job?.id || !onDelete) return false;
    
    const success = await onDelete(job.id);
    if (success) {
      handleClose();
    }
    return success;
  };

  // Handle opening payment confirmation dialog
  const handleOpenPaymentDialog = () => {
    setIsPaymentDialogOpen(true);
  };
  
  // Handle job payment confirmation
  const handleConfirmPayment = async () => {
    if (!job || !onMarkAsPaid) return false;
    
    const success = await onMarkAsPaid(job);
    if (success) {
      setIsPaymentDialogOpen(false);
      handleClose();
    }
    return success;
  };

  // Handle job duplication
  const handleDuplicate = () => {
    if (job) {
      handleDuplicateJob(job);
    }
  };

  const handleDuplicateJobClose = (v: boolean) => {
    setIsDuplicateModalOpen(v);
    onOpenChange(v);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[min(90vh,960px)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0"
          hideCloseButton={true}
        >
          <DialogTitle className="sr-only">{job.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Review details and actions for the job {job.title}.
          </DialogDescription>
          <PastJobModalHeader status={job.status} onClose={handleClose} />
          <PastJobModalContent
            job={job}
            onEdit={handleEdit}
            onSendInvoice={onSendInvoice}
            onMarkAsPaid={handleOpenPaymentDialog}
            onOpenPreview={handleOpenPreview}
            onOpenDeleteDialog={onDelete ? handleOpenDeleteDialog : undefined}
            onDuplicate={onDuplicateJob ? handleDuplicate : undefined}
            isSending={isSending}
            isMarkingAsPaid={isMarkingAsPaid}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteJob}
        onCancel={() => setIsDeleteDialogOpen(false)}
        title={job.title}
        dialogTitle="Delete Job?"
        description={`This will permanently delete the job "${job.title}". This action cannot be undone.`}
        confirmText="Delete"
      />
      
      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onConfirm={handleConfirmPayment}
        onCancel={() => setIsPaymentDialogOpen(false)}
        isProcessing={isMarkingAsPaid}
        jobTitle={job.title}
      />
      
      {/* Job duplication form */}
      {jobToDuplicate && (
        <JobForm
          open={isDuplicateModalOpen}
          onOpenChange={handleDuplicateJobClose}
          selectedDate={jobToDuplicate?.date ? new Date(jobToDuplicate.date) : null}
          onSubmit={handleDuplicatedJobSubmit}
          initialJobData={jobToDuplicate}
        />
      )}
    </>
  );
};

export default PastJobModalContainer;
