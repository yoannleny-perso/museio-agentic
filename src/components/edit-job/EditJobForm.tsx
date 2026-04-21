import React, { useEffect, useState } from 'react';
import { Job } from '@/types';
import { useEditJobForm } from '@/hooks/useEditJobForm';
import DeleteJobDialog from './DeleteJobDialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useDuplicateJob } from '@/hooks/useDuplicateJob';
import JobForm from '@/components/home/JobForm';
import EditJobContent from './EditJobContent';
import { useNavigate } from 'react-router-dom';

interface EditJobFormProps {
  job: Job;
  setIsDetailsOpen: (open: boolean) => void;
  isDetailsOpen: boolean;
}

const EditJobForm: React.FC<EditJobFormProps> = ({ job, isDetailsOpen, setIsDetailsOpen }) => {
  const navigate = useNavigate();
  const [submitRequest, setSubmitRequest] = useState(false);
  const [saveDraftRequest, setSaveDraftRequest] = useState(false);
  
  // Initialize the duplicate job functionality
  const {
    jobToDuplicate, 
    isDuplicateModalOpen, 
    setIsDuplicateModalOpen, 
    handleDuplicateJob,
    handleDuplicatedJobSubmit,
    handleCloseDuplicateModal
  } = useDuplicateJob();
  
  const {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    hasErrors,
    isSaving,
    date,
    setDate,
    endDate,
    setEndDate,
    handleFormSubmit,
    handleSaveDraft,
    handleDeleteDraft,
    handleClose: originalHandleClose,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleConfirmDelete,
    control,
    clearErrors
  } = useEditJobForm(job);

  
  // Handler for job duplication
  const handleDuplicateRequest = () => {
    handleDuplicateJob(job);
  };
  
  // Enhanced close handler to update dialog state and navigate
  const handleClose = () => {
    console.log('Closing edit job form');
    setIsDetailsOpen(false);
    
  };
  
  // Updated wrapper for save draft to pass current form data
  const handleSaveDraftWithData = () => {
    console.log('Saving draft with current form data');
    setSaveDraftRequest(true);
    const formData = watch();
    handleSaveDraft(formData);
  };

  const handleDuplicateJobClose = (v: boolean) => {
    setIsDuplicateModalOpen(v);
    setIsDetailsOpen(v);
  };

  const handleEditSave = () => {
    setSubmitRequest(true);
    handleFormSubmit(watch());
  }

  const handleDeleteJob = () => {
    setSubmitRequest(true);

    handleConfirmDelete();
  }

  useEffect(() => {
    if (!isSaving && submitRequest) {
      console.log('Job updated successfully, closing dialog');
      setSubmitRequest(false);
      setIsDetailsOpen(false);
    }
  }, [isSaving, setIsDetailsOpen, submitRequest]);

  useEffect(() => {
    if (!isSaving && saveDraftRequest) {
      console.log('Draft saved successfully, closing dialog');
      setSaveDraftRequest(false);
      setIsDetailsOpen(false);
    }
  }, [isSaving, setIsDetailsOpen, saveDraftRequest]);


  
  if ( job === null) {
    return (
     <>
     </>
    );
  }
  else{
  return (
    <Dialog open={isDetailsOpen} onOpenChange={(open) => {
      setIsDetailsOpen(open);
      if (!open) handleClose();
    }}>
      <DialogContent
        className="flex h-[min(90vh,960px)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0"
        hideCloseButton={true}
      >
        <DialogTitle className="sr-only">Edit job</DialogTitle>
        <DialogDescription className="sr-only">
          Review and update the details for {job.title}.
        </DialogDescription>
        <EditJobContent 
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          date={date}
          setDate={setDate}
          endDate={endDate}
          setEndDate={setEndDate}
          handleSubmit={handleSubmit}
          handleFormSubmit={handleEditSave}
          handleSaveDraft={handleSaveDraftWithData}
          handleDeleteDraft={handleDeleteDraft}
          handleDuplicateJob={handleDuplicateRequest}
          handleClose={handleClose}
          hasErrors={hasErrors}
          isSaving={isSaving}
          control={control}
          jobStatus={job.status}
          clearErrors={clearErrors}
        />
      </DialogContent>
      
      <DeleteJobDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteJob}
      />
      
      {/* Job duplication form */}
      {jobToDuplicate && (
        <JobForm
          open={isDuplicateModalOpen}
          onOpenChange={handleDuplicateJobClose}
          selectedDate={jobToDuplicate?.date ? new Date(jobToDuplicate.date) : null}
          onSubmit={handleDuplicatedJobSubmit}
          initialJobData={jobToDuplicate}
        />
      )}
    </Dialog>
  );}
};

export default EditJobForm;
