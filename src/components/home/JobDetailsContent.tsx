
import React, { useState } from 'react';
import { Job } from '@/types';
import JobEditForm from './JobEditForm';
import JobView from './JobView';
import { useJobOperations } from '@/hooks/job-details/useJobOperations';

interface JobDetailsContentProps {
  job: Job;
  onUpdateJob: (job: Job) => void;
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  onEdit?: (id: string, data: Partial<Job>) => Promise<boolean> | void;
  onClose?: (e?: React.MouseEvent) => void;
  onDelete?: (e?: React.MouseEvent) => void;
}

const JobDetailsContent: React.FC<JobDetailsContentProps> = ({
  job,
  onUpdateJob,
  isEditing = false,
  setIsEditing = () => {},
  onEdit,
  onClose,
  onDelete
}) => {
  const [localIsEditing, setLocalIsEditing] = useState(isEditing);
  
  // Use either the parent-controlled state or local state
  const currentIsEditing = setIsEditing ? isEditing : localIsEditing;
  const setCurrentIsEditing = setIsEditing || setLocalIsEditing;

  // Use our extracted job operations hook
  const {
    isSaving,
    isConfirming,
    handleJobUpdate,
    handleCopyToClipboard,
    handleConfirmJob,
    handleSaveDraft
  } = useJobOperations({
    job,
    onUpdateJob,
    onEdit,
    onClose
  });

  const cancelEdit = () => {
    setCurrentIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Job Details</h2>
      </div>
      
      {/* Show edit form when isEditing is true */}
      {currentIsEditing ? (
        <JobEditForm 
          job={job}
          onClose={cancelEdit}
          onSubmit={async (data) => {
            const success = await handleJobUpdate(data);
            return success;
          } } isSubmitting={false}        />
      ) : (
        // Just show the job view without any action buttons
        <JobView job={job} />
      )}
    </div>
  );
};

export default JobDetailsContent;
