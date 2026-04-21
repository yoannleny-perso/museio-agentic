
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clipboard, Check, Edit, Trash } from 'lucide-react';
import { Job } from '@/types';

interface JobActionsProps {
  job: Job;
  isConfirming?: boolean;
  isSaving?: boolean;
  onDelete?: (e?: React.MouseEvent) => void;
  onConfirmJob?: () => void;
  onSaveDraft?: () => void;
  onCopyToClipboard?: () => void;
  onEditClick?: () => void;
}

const JobActions: React.FC<JobActionsProps> = ({ 
  job,
  isConfirming = false,
  isSaving = false,
  onDelete,
  onConfirmJob,
  onSaveDraft,
  onCopyToClipboard,
  onEditClick
}) => {
  
  // Determine if this is a draft that can be confirmed
  const isDraft = job.status === 'drafted';
  
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {/* Edit button - shown for all jobs */}
      <Button 
        type="button" 
        variant="outline" 
        className="flex items-center gap-1"
        onClick={onEditClick}
      >
        <Edit className="h-4 w-4" />
        <span>Edit</span>
      </Button>
      
      {/* Copy to clipboard button - shown for all jobs */}
      <Button
        type="button"
        variant="outline"
        className="flex items-center gap-1"
        onClick={onCopyToClipboard}
      >
        <Clipboard className="h-4 w-4" />
        <span>Copy Details</span>
      </Button>
      
      {/* Delete button - shown for all jobs */}
      <Button 
        type="button" 
        variant="destructive"
        className="flex items-center gap-1 ml-auto"
        onClick={onDelete}
      >
        <Trash className="h-4 w-4" />
        <span>{job.status === 'upcoming' ? 'Cancel Job' : 'Delete'}</span>
      </Button>
      
      {/* Draft-specific buttons */}
      {isDraft && (
        <>
          {/* Confirm button - converts draft to confirmed job */}
          {onConfirmJob && (
            <Button 
              type="button" 
              variant="default" 
              className="flex items-center gap-1"
              onClick={onConfirmJob}
              disabled={isConfirming}
            >
              <Check className="h-4 w-4" />
              <span>{isConfirming ? 'Confirming...' : 'Confirm Job'}</span>
            </Button>
          )}
          
          {/* Save draft button - saves any changes to the draft */}
          {onSaveDraft && (
            <Button 
              type="button" 
              variant="secondary" 
              className="flex items-center gap-1"
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default JobActions;
