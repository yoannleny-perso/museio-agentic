
import React from 'react';
import NewJobCreationShell from '@/components/new-job/NewJobCreationShell';

interface NewJobContentProps {
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
  handleSaveDraft: () => void; 
  handleClose: () => void;
  isSaving: boolean;
  control: any;
  clearErrors?: any;
}

const NewJobContent = ({
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
  handleClose,
  isSaving,
  control,
  clearErrors
}: NewJobContentProps) => {
  return (
    <NewJobCreationShell
      onClose={handleClose}
      onSubmit={handleFormSubmit}
      onSaveDraft={handleSaveDraft}
      register={register}
      errors={errors}
      watch={watch}
      setValue={setValue}
      date={date}
      setDate={setDate}
      endDate={endDate}
      setEndDate={setEndDate}
      handleSubmit={handleSubmit}
      isSaving={isSaving}
      title="New Job"
      control={control}
      clearErrors={clearErrors}
    />
  );
};

export default NewJobContent;
