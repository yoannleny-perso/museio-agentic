import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Job } from '@/types';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import JobDetailsContent from './JobDetailsContent';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JobDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onEdit: (id: string, data: Partial<Job>) => void;
  onDelete: (id: string) => Promise<boolean>;
}

const JobDetails: React.FC<JobDetailsProps> = ({ 
  open, 
  onOpenChange, 
  job, 
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reset editing state when job changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsEditing(false);
    } else {
      // Reset all states when dialog closes to ensure clean state for next open
      setIsEditing(false);
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  }, [job, open]);
  
  const handleDeleteClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (job) {
      // Store the job to delete separately to prevent issues during state updates
      setJobToDelete(job);
      setIsDeleteDialogOpen(true);
    }
  };
  
  const handleDeleteCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDeleteDialogOpen(false);
    setJobToDelete(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) {
      return false;
    }
    
    const jobId = jobToDelete.id;
    
    setIsDeleting(true);
    
    try {
      // Call the delete function and let it handle all the logic including email sending
      const success = await onDelete(jobId);
      
      
      if (success) {
        // Only close the main dialog if deletion was successful
        onOpenChange(false);
        setIsDeleteDialogOpen(false);
        setJobToDelete(null);
      } else {
        // Keep the dialog open if deletion failed
        setIsDeleteDialogOpen(false);
        setJobToDelete(null);
      }
      
      return success;
    } catch (error) {
      console.error('[JobDetails] Error during deletion:', error);
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    
    // Reset states first
    setIsEditing(false);
    
    // Then close dialog
    onOpenChange(false);
  };

  // Return null during initial render if job is null
  if (!job && open) {
    console.log('[JobDetails] No job data available, returning null');
    return null;
  }
  
  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(newState) => {
          console.log('[JobDetails] Dialog onOpenChange triggered with:', newState);
          onOpenChange(newState);
        }}
      >
        {open && job && (
          <DialogContent>
            <DialogTitle className="sr-only">{job.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Review the details for {job.title}.
            </DialogDescription>
            <ScrollArea className="max-h-[80vh]" type="always">
              <JobDetailsContent
                job={job}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onEdit={onEdit}
                onClose={handleClose}
                onDelete={handleDeleteClick}
                onUpdateJob={(updatedJob) => onEdit(updatedJob.id, updatedJob)}
              />
            </ScrollArea>
          </DialogContent>
        )}
      </Dialog>
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={(newState) => {
          setIsDeleteDialogOpen(newState);
          if (!newState) {
            setJobToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title={jobToDelete?.title || ''}
        isDeleteLoading={isDeleting}
        dialogTitle={jobToDelete?.status === 'upcoming' ? "Cancel Job" : "Delete Job"}
        confirmText={jobToDelete?.status === 'upcoming' ? "Cancel" : "Delete"}
        description={jobToDelete?.status === 'upcoming' 
          ? `This will cancel the job "${jobToDelete?.title}" and notify the client. This action cannot be undone.`
          : `This will permanently delete the job "${jobToDelete?.title}". This action cannot be undone.`
        }
      />
    </>
  );
};

export default JobDetails;
