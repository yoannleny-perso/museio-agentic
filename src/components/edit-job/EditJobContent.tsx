
import React from 'react';
import MobileJobForm from '@/components/home/MobileJobForm';
import { Button } from '@/components/ui/button';
import JobStatusDisplay from '@/components/jobs/JobStatusDisplay';
import { JobStatus } from '@/types';

interface EditJobContentProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  date: Date | null;
  setDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  handleSubmit: any;
  handleFormSubmit: (data: any) => void;
  handleSaveDraft: (data: any) => void;
  handleDeleteDraft: () => void;
  handleDuplicateJob?: () => void;
  handleClose: () => void;
  hasErrors: boolean;
  isSaving: boolean;
  control: any;
  jobStatus: JobStatus; // Fixed: Changed from string to JobStatus
  clearErrors?: any;
}

const EditJobContent = ({
  register,
  errors,
  watch,
  setValue,
  date,
  setDate,
  endDate,
  setEndDate,
  handleSubmit,
  handleFormSubmit,
  handleSaveDraft,
  handleDeleteDraft,
  handleDuplicateJob,
  handleClose,
  hasErrors,
  isSaving,
  control,
  jobStatus,
  clearErrors,
}: EditJobContentProps) => {

  return (
    <MobileJobForm
      onClose={handleClose}
      onSubmit={handleFormSubmit}
      onSaveDraft={() => {
        // Get current form values and pass to handleSaveDraft
        const formValues = watch();
        handleSaveDraft(formValues);
      }}
      register={register}
      errors={errors}
      watch={watch}
      setValue={setValue}
      date={date}
      setDate={setDate}
      endDate={endDate}
      setEndDate={setEndDate}
      handleSubmit={handleSubmit}
      validateTimeRange={() => true} // This is handled in handleFormSubmit
      isSaving={isSaving}
      title="Edit Job"
      control={control}
      onDelete={handleDeleteDraft}
      onDuplicate={handleDuplicateJob}
      jobStatus={jobStatus} // Now properly typed as JobStatus
      clearErrors={clearErrors}
    />
  );
};

export default EditJobContent;
