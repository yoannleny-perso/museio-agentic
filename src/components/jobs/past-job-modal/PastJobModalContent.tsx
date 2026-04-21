
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Job } from '@/types';
import PastJobDetailsContent from '@/components/jobs/past-job-modal/PastJobDetailsContent';
import PastJobActions from '@/components/jobs/past-job-modal/PastJobActions';


interface PastJobModalContentProps {
  job: Job;
  onEdit: () => void;
  onSendInvoice: () => Promise<boolean>;
  onMarkAsPaid?: () => void;
  onOpenPreview: () => void;
  onOpenDeleteDialog?: () => void;
  onDuplicate?: () => void;
  isSending: boolean;
  isMarkingAsPaid: boolean;
  onClose: () => void;
}

const PastJobModalContent: React.FC<PastJobModalContentProps> = ({
  job,
  onEdit,
  onSendInvoice,
  onMarkAsPaid,
  onOpenPreview,
  onOpenDeleteDialog,
  onDuplicate,
  isSending,
  isMarkingAsPaid,
  onClose
}) => {
  // Create a ref to the ScrollArea
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea
      className="min-h-0 flex-1 bg-background px-6 py-5"
      ref={scrollAreaRef}
    >
      <div className="bg-background">
        <div className="space-y-3 bg-background">
          <PastJobDetailsContent job={job} />
              
          <PastJobActions
            job={job}
            onEdit={onEdit}
            onSendInvoice={onSendInvoice}
            onMarkAsPaid={onMarkAsPaid}
            onOpenPreview={onOpenPreview}
            onDelete={onOpenDeleteDialog}
            onDuplicate={onDuplicate}
            isSending={isSending}
            isMarkingAsPaid={isMarkingAsPaid}
            onClose={onClose}
          />
        </div>
      </div>
    </ScrollArea>
  );
};

export default PastJobModalContent;
