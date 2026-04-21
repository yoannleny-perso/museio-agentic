
import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
  onCancel: () => void;
  title: string;
  isDeleteLoading?: boolean;
  dialogTitle?: string;
  description?: string;
  confirmText?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  isDeleteLoading = false,
  dialogTitle = "Are you absolutely sure?",
  description,
  confirmText = "Delete"
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  
  const handleConfirm = async () => {
    console.log('[DeleteConfirmationDialog] Confirm button clicked');
    try {
      setIsDeleting(true);

      // Call the delete operation but don't close the dialog until it's done
      const success = await onConfirm();
      console.log('[DeleteConfirmationDialog] Delete operation completed with success:', success);

      // Only close the dialog if deletion was successful
      if (success) {
        console.log('[DeleteConfirmationDialog] Closing dialog after successful deletion');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('[DeleteConfirmationDialog] Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCancel = () => {
    console.log('[DeleteConfirmationDialog] Cancel button clicked');
    if (isDeleting || isDeleteLoading) {
      console.log('[DeleteConfirmationDialog] Ignoring cancel because deletion is in progress');
      return;
    }
    onCancel();
  };

  // Use the provided description or fall back to the default
  const dialogDescription = description || `This will permanently delete the job "${title}". This action cannot be undone.`;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={open => {
      console.log('[DeleteConfirmationDialog] AlertDialog onOpenChange triggered with:', open);
      // Prevent closing the dialog during deletion
      if (!open && (isDeleting || isDeleteLoading)) {
        console.log('[DeleteConfirmationDialog] Blocking close attempt during deletion');
        return;
      }

      // Only allow the dialog to be closed via the cancel/confirm buttons
      if (open === false) {
        handleCancel();
      } else {
        onOpenChange(open);
      }
    }}>
      <AlertDialogContent className="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between sm:justify-end">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isDeleting || isDeleteLoading}
            className="sm:mt-0"
          >
            No, don't {confirmText.toLowerCase()}
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isDeleting || isDeleteLoading}
          >
            {isDeleting || isDeleteLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isDeleteLoading ? "Sending notification..." : "Processing..."}
              </>
            ) : (
              `Yes, ${confirmText.toLowerCase()}`
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
