
import React from 'react';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Job } from '@/types';
import { useProfile } from '@/context/ProfileContext';
import InvoiceJobDetails from './InvoiceJobDetails';
import InvoiceActions from './InvoiceActions';

interface InvoiceConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onConfirm: () => void;
  onEdit?: (job: Job) => void;
  isSending?: boolean;
}

const InvoiceConfirmation: React.FC<InvoiceConfirmationProps> = ({
  open,
  onOpenChange,
  job,
  onConfirm,
  onEdit,
  isSending = false
}) => {
  const { profileData } = useProfile();

  if (!job) return null;

  const handleEdit = () => {
    if (onEdit && job) {
      onEdit(job);
      onOpenChange(false);
    }
  };

  const handleCreateInvoice = async () => {
    console.log("InvoiceConfirmation: Creating invoice for job:", job.id);
    
    // Call the confirm callback which should trigger the invoice creation in the parent
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-xl max-h-[90vh] overflow-y-auto p-4">
        <AlertDialogHeader className="pb-2">
          <AlertDialogTitle>Create Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Review the job details before creating an invoice.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <InvoiceJobDetails job={job} />
        
        <InvoiceActions
          job={job}
          isSending={isSending}
          onEdit={handleEdit}
          onSend={handleCreateInvoice}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InvoiceConfirmation;
