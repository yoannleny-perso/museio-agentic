
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobDetailsFooterProps {
  isEditing: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (e: React.MouseEvent) => void;
  onCancel: (e?: React.MouseEvent) => void;  // Make event parameter optional for flexibility
}

const JobDetailsFooter: React.FC<JobDetailsFooterProps> = ({
  isEditing,
  onClose,
  onEdit,
  onDelete,
  onSave,
  onCancel
}) => {
  console.log('[JobDetailsFooter] Rendering with isEditing:', isEditing);
  
  // Create separate handlers with explicit event prevention
  const handleClose = (e: React.MouseEvent) => {
    console.log('[JobDetailsFooter] Close button clicked');
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleEdit = (e: React.MouseEvent) => {
    console.log('[JobDetailsFooter] Edit button clicked');
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    console.log('[JobDetailsFooter] Delete button clicked');
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };
  
  const handleCancel = (e: React.MouseEvent) => {
    console.log('[JobDetailsFooter] Cancel button clicked');
    e.preventDefault();
    e.stopPropagation();
    onCancel(e);
  };
  
  const handleSave = (e: React.MouseEvent) => {
    console.log('[JobDetailsFooter] Save button clicked');
    e.preventDefault();
    e.stopPropagation();
    onSave(e);
  };

  return (
    <>
      {isEditing ? (
        <div className="flex gap-2 w-full">
          <Button 
            type="button" 
            variant="outline" 
            className="w-1/2"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            className="w-1/2"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 w-full">
          <Button 
            type="button" 
            variant="outline"
            className="w-1/3"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            className="w-1/3"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            className="w-1/3"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </>
  );
};

export default JobDetailsFooter;
