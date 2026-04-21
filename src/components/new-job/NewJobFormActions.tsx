
import React from 'react';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';

interface NewJobFormActionsProps {
  hasErrors: boolean;
  isSaving: boolean;
  onSaveDraft: () => void;
}

const NewJobFormActions = ({ hasErrors, isSaving, onSaveDraft }: NewJobFormActionsProps) => {
  return (
    <div className="py-4 space-y-3">
      <PrimaryActionButton
        type="submit"
        className="w-full"
        aria-label="Create new job"
        role="button"
        disabled={hasErrors || isSaving}
      >
        Create Job
      </PrimaryActionButton>
      <Button
        type="button"
        onClick={onSaveDraft}
        className="w-full py-3 font-bold text-gray-700"
        aria-label="Save job as draft"
        role="button"
        variant="secondary"
        disabled={isSaving}
      >
        Save Draft
      </Button>
    </div>
  );
};

export default NewJobFormActions;
