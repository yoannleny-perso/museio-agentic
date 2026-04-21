
import React from 'react';
import { Job } from '@/types';
import JobDetails from '@/components/home/JobDetails';  // Updated name
import JobForm from '@/components/home/JobForm';        // Updated name
import InvoiceConfirmation from '@/components/jobs/InvoiceConfirmation';
import PastJobModal from '@/components/jobs/PastJobModal';
import { Edit } from 'lucide-react';
import EditJobForm from '../edit-job/EditJobForm';

interface HomePageModalsProps {
  isDetailsOpen: boolean;
  onDetailsOpenChange: (open: boolean) => void;
  selectedJob: Job | null;
  onEditJob: (id: string, data: Partial<Job>) => Promise<boolean>;
  onDeleteJob: (id: string) => Promise<boolean>;
  isInvoiceModalOpen: boolean;
  onInvoiceModalOpenChange: (open: boolean) => void;
  onConfirmInvoice: (job: Job) => Promise<boolean>; // Updated return type to match
  onEditFromInvoice: (job: Job) => void;
  onMarkAsPaid: (job: Job) => Promise<boolean>;
  isSending: boolean;
  isMarkingAsPaid?: boolean;
  isJobFormOpen: boolean;
  onJobFormOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onJobSubmit: (data: Omit<Job, 'id'>) => void;
  onJobSaveDraft: (data: any) => void | Promise<void>;
  isPastJobModalOpen: boolean;
  onPastJobModalOpenChange: (open: boolean) => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  onDuplicateJob?: (job: Job) => void; // Added new prop for job duplication
}

const HomePageModals: React.FC<HomePageModalsProps> = ({
  isDetailsOpen,
  onDetailsOpenChange,
  selectedJob,
  onEditJob,
  onDeleteJob,
  isInvoiceModalOpen,
  onInvoiceModalOpenChange,
  onConfirmInvoice,
  onEditFromInvoice,
  onMarkAsPaid,
  isSending,
  isMarkingAsPaid,
  isJobFormOpen,
  onJobFormOpenChange,
  selectedDate,
  onJobSubmit,
  onJobSaveDraft,
  isPastJobModalOpen,
  onPastJobModalOpenChange,
  isPreviewOpen,
  setIsPreviewOpen,
  onDuplicateJob // Added new prop
}) => {
  // Wrapper functions to handle cases where selectedJob might be null
  const handleConfirmInvoice = () => {
    if (selectedJob) {
      return onConfirmInvoice(selectedJob);
    }
    return Promise.resolve(false);
  };
  
  const handleEditFromInvoice = () => {
    if (selectedJob) {
      onEditFromInvoice(selectedJob);
    }
  };

  // Wrap the onSendInvoice prop for PastJobModal to match expected signature
  const handleSendInvoice = async () => {
    if (selectedJob) {
      return await onConfirmInvoice(selectedJob);
    }
    return false;
  };
  
  // Wrap the onMarkAsPaid prop for PastJobModal
  const handleMarkAsPaid = (job: Job) => {
    return onMarkAsPaid(job);
  };
  
  return (
    <>
      {/* Job Details Modal */}
      { selectedJob && (
          <EditJobForm 
            isDetailsOpen={isDetailsOpen}
            setIsDetailsOpen={onDetailsOpenChange}
            job={selectedJob} 
          />
      )}
        
      
      {/* Invoice Confirmation Modal */}
      <InvoiceConfirmation
        open={isInvoiceModalOpen}
        onOpenChange={onInvoiceModalOpenChange}
        job={selectedJob}
        onConfirm={handleConfirmInvoice}
        onEdit={handleEditFromInvoice}
      />
      
      {/* New Job Form */}
      <JobForm
        open={isJobFormOpen}
        onOpenChange={onJobFormOpenChange}
        selectedDate={selectedDate}
        onSubmit={onJobSubmit}
        onSaveDraft={onJobSaveDraft}
      />
      
      {/* Past Job Modal */}
      <PastJobModal
        isOpen={isPastJobModalOpen}
        onOpenChange={onPastJobModalOpenChange}
        job={selectedJob}
        onEdit={onEditJob}
        onSendInvoice={handleSendInvoice}
        onMarkAsPaid={handleMarkAsPaid}
        onDelete={onDeleteJob}
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        isSending={isSending}
        isMarkingAsPaid={isMarkingAsPaid}
        onDuplicateJob={onDuplicateJob}
      />
    </>
  );
};

export default HomePageModals;
