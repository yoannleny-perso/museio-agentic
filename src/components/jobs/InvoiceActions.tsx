
import React from 'react';
import { Job } from '@/types';
import { Edit, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialogCancel, 
  AlertDialogAction,
  AlertDialogFooter 
} from '@/components/ui/alert-dialog';
import { useSetupValidation } from '@/hooks/useSetupValidation';
import SetupValidationPopup from '@/components/setup/SetupValidationPopup';

interface InvoiceActionsProps {
  job: Job;
  isSending: boolean;
  onEdit: () => void;
  onSend: () => void;
}

const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  job,
  isSending,
  onEdit,
  onSend
}) => {
  const { validateSetupBeforeInvoice, isPopupOpen, setIsPopupOpen, missingSetup } = useSetupValidation();
  
  // Check if client email is missing
  const isEmailMissing = !job.contact_email;
  
  const handleSendClick = () => {
    if (validateSetupBeforeInvoice()) {
      onSend();
    }
  };
  
  return (
    <>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
        <Button
          onClick={onEdit}
          variant="outline"
          className="w-full sm:w-[160px] h-12 justify-center"
          disabled={isSending}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
        <AlertDialogCancel className="w-full sm:w-[160px] h-12 justify-center" disabled={isSending}>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={handleSendClick}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-[160px] h-12 justify-center"
          disabled={isSending || isEmailMissing}
          title={isEmailMissing ? "Client email is required to create and send an invoice" : ""}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Send Invoice
            </>
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
      
      <SetupValidationPopup
        open={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        missingSetup={missingSetup}
      />
    </>
  );
};

export default InvoiceActions;
