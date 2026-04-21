import React from 'react';
import { AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import PortfolioDialog from './PortfolioDialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName
}) => {
  return (
    <PortfolioDialog
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      variant="alert"
    >
      <AlertDialogDescription className="mb-6 text-center text-muted-foreground">
        {message}
        {itemName && (
          <span className="block mt-2 font-medium text-foreground">
            "{itemName}"
          </span>
        )}
      </AlertDialogDescription>
      <AlertDialogFooter className="flex gap-3 justify-center">
        <AlertDialogCancel onClick={onClose}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </PortfolioDialog>
  );
};

export default DeleteConfirmDialog;