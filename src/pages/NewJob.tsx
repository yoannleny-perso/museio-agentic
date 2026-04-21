
import { useNewJobForm } from '@/hooks/useNewJobForm';
import NewJobContent from '@/components/new-job/NewJobContent';

const NewJob = () => {
  const {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    isSaving,
    date,
    setDate,
    endDate,
    setEndDate,
    handleFormSubmit,
    handleSaveAsDraft,
    handleCancel,
    control,
    formKey,
    clearErrors
  } = useNewJobForm();

  const handleSaveDraft = () => {
    handleSaveAsDraft();
  };
  
  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#F8F9FB]" key={formKey}>
      <NewJobContent 
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        date={date}
        setDate={setDate}
        endDate={endDate}
        setEndDate={setEndDate}
        handleSubmit={handleSubmit}
        handleFormSubmit={handleFormSubmit}
        handleSaveDraft={handleSaveDraft}
        handleClose={handleCancel}
        isSaving={isSaving}
        control={control}
        clearErrors={clearErrors}
      />
    </div>
  );
};

export default NewJob;
