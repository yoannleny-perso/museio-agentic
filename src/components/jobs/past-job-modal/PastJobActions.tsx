
import React from 'react';
import { Job } from '@/types';
import { Eye, FileText, DollarSign, Trash2, Edit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { useSetupValidation } from '@/hooks/useSetupValidation';
import SetupValidationPopup from '@/components/setup/SetupValidationPopup';

interface PastJobActionsProps {
  job: Job;
  onEdit: () => void;
  onSendInvoice: () => Promise<boolean>;
  onMarkAsPaid?: () => void;
  onOpenPreview: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSending: boolean;
  isMarkingAsPaid: boolean;
  onClose?: () => void;
}

const PastJobActions: React.FC<PastJobActionsProps> = ({
  job,
  onEdit,
  onSendInvoice,
  onMarkAsPaid,
  onOpenPreview,
  onDelete,
  onDuplicate,
  isSending,
  isMarkingAsPaid,
  onClose
}) => {
  const { validateSetupBeforeInvoice, isPopupOpen, setIsPopupOpen, missingSetup } = useSetupValidation();
  
  // Modified to handle closing modal after successful invoice creation
  const handleSendInvoice = async () => {
    if (!validateSetupBeforeInvoice()) {
      return;
    }
    
    const success = await onSendInvoice();
    if (success && onClose) {
      onClose();
    }
  };

  // Determine if Mark as Paid button should be shown
  const showMarkAsPaid = onMarkAsPaid && 
    (job.status === 'invoice-sent' || job.status === 'past');

  return (
    <>
      <div className="flex flex-col space-y-3 mt-4 bg-background">
        {/* All buttons in a vertical list with consistent height and full width */}
        <Button 
          onClick={onEdit}
          variant="outline"
          className="flex items-center justify-center h-12 w-full gap-2"
        >
          <Edit size={16} />
          <span>Edit Job Details</span>
        </Button>
    
        
        <Button
          variant="secondary"
          onClick={onOpenPreview}
          className="flex items-center justify-center h-12 w-full gap-2"
        >
          <Eye size={16} />
          <span>Preview Invoice</span>
        </Button>
        
        <PrimaryActionButton
          onClick={handleSendInvoice}
          isLoading={isSending}
          loadingText="Processing..."
          className="flex items-center justify-center h-12 w-full gap-2"
        >
          <FileText size={16} />
          <span>Send Invoice</span>
        </PrimaryActionButton>

        {/* Mark as Paid button - only show for invoice-sent or past status */}
        {showMarkAsPaid && (
          <PrimaryActionButton
            onClick={onMarkAsPaid}
            variant="success"
            className="flex items-center justify-center h-12 w-full gap-2"
          >
            <DollarSign size={16} />
            <span>Mark as Paid</span>
          </PrimaryActionButton>
        )}
        
        {onDuplicate && (
          <Button
            onClick={onDuplicate}
            variant="outline"
            className="flex items-center justify-center h-12 w-full gap-2 text-[#6E59A5] border border-[#6E59A5] hover:bg-[#F5F0FF]"
          >
            <Copy size={16} className="text-[#6E59A5]" />
            <span>Duplicate Job</span>
          </Button>
        )}
        
        {onDelete && (
          <Button
            onClick={onDelete}
            variant="outline"
            className="flex items-center justify-center h-12 w-full text-[#ea384c] hover:bg-red-50 hover:text-[#ea384c] border-[#ea384c] gap-2"
          >
            <Trash2 size={16} />
            <span>Delete Job</span>
          </Button>
        )}
      </div>
      
      <SetupValidationPopup
        open={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        missingSetup={missingSetup}
      />
    </>
  );
};

export default PastJobActions;
