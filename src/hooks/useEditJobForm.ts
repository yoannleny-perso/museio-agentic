
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobForm } from './useJobForm';
import { useAppContext } from '@/context/AppContext';
import { Job } from '@/types';
import { useJobEditOperations } from './job-edit/useJobEditOperations';

export const useEditJobForm = (initialJob?: Job, jobId?: string) => {
  const navigate = useNavigate();
  const { jobs } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(initialJob || null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const id = jobId || (currentJob?.id || '');

  // Initialize form with job data from context if not provided
  useEffect(() => {
    if (!initialJob && id && jobs.length > 0) {
      const job = jobs.find(job => job.id === id);
      setCurrentJob(job || null);
      if (!job) {
        console.log(`[useEditJobForm] Job with ID ${id} not found`);
      }
    }
  }, [id, jobs, initialJob]);

  // Set up job form with current job data
  const jobForm = useJobForm(currentJob);
  
  // Get job edit operations
  const { 
    isSaving, 
    serverError, 
    handleFormSubmit, 
    handleSaveDraft: originalHandleSaveDraft, 
    handleDelete
  } = useJobEditOperations(currentJob, id);
  
  // Form submission state
  const hasErrors = Object.keys(jobForm.errors).length > 0;

  // Wrapper for handleSaveDraft to accept form data
  const handleSaveDraft = (formData: any) => {
    console.log('[useEditJobForm] Saving draft with form data:', formData);
    return originalHandleSaveDraft(formData);
  };

  // Delete draft
  const handleDeleteDraft = () => {
    console.log('[useEditJobForm] Opening delete dialog');
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    console.log('[useEditJobForm] Confirming delete');
    await handleDelete();
    setIsDeleteDialogOpen(false);
  };

  // Close the page
  const handleClose = () => {
    navigate(-1);
  };

  return {
    ...jobForm,
    currentJob,
    loading,
    isSaving,
    isSubmitting: isSaving,
    serverError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleSaveJob: handleFormSubmit,
    handleFormSubmit,
    handleSaveDraft,
    handleDelete,
    handleDeleteDraft,
    handleClose,
    hasErrors,
    deleteDialogOpen: isDeleteDialogOpen,
    setDeleteDialogOpen: setIsDeleteDialogOpen,
    handleConfirmDelete,
    control: jobForm.control,
  };
};
