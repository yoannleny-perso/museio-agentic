
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'dialog' | 'alert';
  className?: string;
  hideCloseButton?: boolean;
}

const PortfolioDialog: React.FC<PortfolioDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = 'dialog',
  className = '',
  hideCloseButton = false,
}) => {
  if (variant === 'alert') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent 
          className={`max-w-lg w-[95%] ${className}`}
        >
          <AlertDialogHeader className="sr-only">
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              {title || 'Portfolio dialog'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {description || 'Portfolio confirmation dialog'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {children}
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton={hideCloseButton}
        className={`max-w-lg w-[95%] ${className}`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {title || 'Portfolio dialog'}
          </DialogTitle>
          <DialogDescription>
            {description || 'Portfolio modal content'}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioDialog;
