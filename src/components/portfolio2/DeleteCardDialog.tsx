
import React from 'react';
import { AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import PortfolioDialog from './PortfolioDialog';

interface DeleteCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cardTitle: string;
}

const DeleteCardDialog: React.FC<DeleteCardDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cardTitle
}) => {
  return (
    <PortfolioDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Delete Featured Card"
      variant="alert"
    >
      <AlertDialogDescription className="text-muted-foreground">
        Do you want to delete the "{cardTitle}" featured card? This action cannot be undone.
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose}>
          No
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Yes
        </AlertDialogAction>
      </AlertDialogFooter>
    </PortfolioDialog>
  );
};

export default DeleteCardDialog;
