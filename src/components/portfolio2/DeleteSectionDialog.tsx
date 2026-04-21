
import React from 'react';
import { AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import PortfolioDialog from './PortfolioDialog';

interface DeleteSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionTitle: string;
  isBuiltIn: boolean;
}

const DeleteSectionDialog: React.FC<DeleteSectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sectionTitle,
  isBuiltIn
}) => {
  const actionText = isBuiltIn ? 'disable' : 'delete';
  const actionDescription = isBuiltIn 
    ? 'This section will be hidden from your portfolio but can be re-enabled later.'
    : 'This section will be permanently removed from your portfolio.';

  return (
    <PortfolioDialog
      open={isOpen}
      onOpenChange={onClose}
      title={isBuiltIn ? 'Disable Section' : 'Delete Section'}
      variant="alert"
    >
      <AlertDialogDescription className="text-muted-foreground">
        Are you sure you want to {actionText} the "{sectionTitle}" section? {actionDescription}
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirm}
          className={isBuiltIn ? "bg-muted text-muted-foreground hover:bg-muted/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
        >
          {isBuiltIn ? 'Disable' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </PortfolioDialog>
  );
};

export default DeleteSectionDialog;
