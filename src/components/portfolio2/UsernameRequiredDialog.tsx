import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UsernameRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsernameRequiredDialog: React.FC<UsernameRequiredDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate('/app/settings?tab=account');
    onClose();
  };

  const handleCancel = () => {
    navigate('/app');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Username Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to set a username to create and manage your portfolio. Your username will be used to create your public portfolio URL.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToSettings}>
            Go to Settings
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UsernameRequiredDialog;