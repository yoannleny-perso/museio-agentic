
import React from 'react';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';

interface EditJobFormActionsProps {
  hasErrors: boolean;
  isSaving: boolean;
  onDelete: () => void;
  onSaveDraft: () => void;
}

const EditJobFormActions = ({ 
  hasErrors, 
  isSaving, 
  onDelete, 
  onSaveDraft 
}: EditJobFormActionsProps) => {
  return (
    <div className="bg-background py-4 space-y-3">
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={onDelete}
          className="py-3 font-bold text-red-500 bg-white hover:bg-red-50"
          aria-label="Delete draft"
          variant="ghost"
          disabled={isSaving}
        >
          Delete Draft
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onSaveDraft}
            className="py-3 font-bold text-gray-700"
            aria-label="Save job as draft"
            role="button"
            variant="secondary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <PrimaryActionButton
            type="submit"
            aria-label="Confirm job"
            role="button"
            disabled={hasErrors || isSaving}
          >
            {isSaving ? 'Confirming...' : 'Confirm Job'}
          </PrimaryActionButton>
        </div>
      </div>
    </div>
  );
};

export default EditJobFormActions;
