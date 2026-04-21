
import React from 'react';
import { X, Trash2, Save, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { LoadingButton } from '@/components/ui/loading-button';
import JobFormFields from './form/JobFormFields';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Job, JobStatus } from '@/types';
import JobStatusDisplay from '@/components/jobs/JobStatusDisplay';

interface MobileJobFormProps {
  onClose: () => void;
  onSubmit: (data: Omit<Job, 'id'>) => void;
  onSaveDraft: () => void;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  date: Date | null;
  setDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  handleSubmit: any;
  validateTimeRange: () => boolean;
  isSaving?: boolean;
  title?: string;
  control?: any;
  onDelete?: () => void;
  onDuplicate?: () => void;
  jobStatus?: JobStatus;
  clearErrors?: any;
}

const MobileJobForm: React.FC<MobileJobFormProps> = ({
  onClose,
  onSubmit,
  onSaveDraft,
  register,
  errors,
  watch,
  setValue,
  date,
  setDate,
  endDate,
  setEndDate,
  handleSubmit,
  validateTimeRange,
  isSaving = false,
  title = "New Job",
  control,
  onDelete,
  onDuplicate,
  jobStatus = 'upcoming',
  clearErrors
}) => {
  const navigate = useNavigate();
  const hasErrors = Object.keys(errors).length > 0;
  const isEditMode = title === "Edit Job";
  const isDraftedJob = jobStatus === 'drafted';
  
  // Determine the text for the submit button based on job status
  const getSubmitButtonText = () => {
    if (title === "New Job" || title === "Duplicate Job") {
      return "Create Job";
    }
    return isDraftedJob ? "Create Job" : "Update Job";
  };
  
return (
  <div className="flex h-full min-h-0 flex-col rounded-2xl bg-background">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b bg-background rounded-t-2xl flex-shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent">
          {title}
        </h1>
        {jobStatus && <JobStatusDisplay status={jobStatus} />}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="rounded-full h-10 w-10 bg-transparent border border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#F5F0FF] transition"
        disabled={isSaving}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </Button>
    </div>

    {/* Scrollable Form Content */}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-background px-6 py-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-6 pb-safe">
        {/* Job Form Fields */}
        <JobFormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          date={date}
          setDate={setDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isSubmitting={isSaving}
          serverError={null}
          control={control}
          clearErrors={clearErrors}
        />

        {/* Edit Mode Buttons */}
        {isEditMode && onDelete && (
          <div className="bg-background pt-4 border-t mt-4">
            <div className="flex flex-col space-y-3 sm:space-y-4">
              {/* Save Draft Button */}
              {isDraftedJob && (
                <LoadingButton
                  type="button"
                  onClick={onSaveDraft}
                  className="flex items-center justify-center h-12 w-full font-medium gap-2"
                  aria-label="Save job as draft"
                  role="button"
                  variant="secondary"
                  isLoading={isSaving}
                  loadingText="Saving Draft..."
                >
                  <Save size={16} />
                  <span>Save Draft</span>
                </LoadingButton>
              )}

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                onClick={() => handleSubmit(onSubmit)()}
                className="flex items-center justify-center h-12 w-full gap-2"
                aria-label={isDraftedJob ? "Create job" : "Update job"}
                role="button"
                disabled={hasErrors}
                isLoading={isSaving}
                loadingText={isDraftedJob ? "Creating Job..." : "Updating Job..."}
              >
                <Check size={16} />
                <span>{getSubmitButtonText()}</span>
              </LoadingButton>

              {/* Duplicate Job Button */}
              {onDuplicate && (
                <Button
                  type="button"
                  onClick={onDuplicate}
                  className="flex items-center justify-center h-12 w-full gap-2 text-[#6E59A5] border border-[#6E59A5] hover:bg-[#F5F0FF]"
                  aria-label="Duplicate job"
                  role="button"
                  variant="outline"
                  disabled={isSaving}
                >
                  <Copy size={16} className="text-[#6E59A5]" />
                  <span>Duplicate Job</span>
                </Button>
              )}

              {/* Delete Job Button */}
              <Button
                type="button"
                onClick={onDelete}
                className="flex items-center justify-center h-12 w-full font-medium text-[#ea384c] hover:bg-red-50 hover:text-[#ea384c] border border-[#ea384c] gap-2"
                aria-label="Delete job"
                role="button"
                variant="outline"
                disabled={isSaving}
              >
                <Trash2 size={16} />
                <span>Delete Job</span>
              </Button>
            </div>
          </div>
        )}

        {/* New Job Mode Buttons */}
        {(!isEditMode || !onDelete) && (
          <div className="bg-background pt-4 border-t mt-4">
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <LoadingButton
                type="button"
                onClick={onSaveDraft}
                className="flex items-center justify-center h-12 w-full font-medium gap-2"
                aria-label="Save job as draft"
                role="button"
                variant="secondary"
                isLoading={isSaving}
                loadingText="Saving Draft..."
              >
                <Save size={16} />
                <span>Save Draft</span>
              </LoadingButton>

              <LoadingButton
                type="submit"
                onClick={() => handleSubmit(onSubmit)()}
                className="flex items-center justify-center h-12 w-full gap-2"
                aria-label="Create new job"
                role="button"
                disabled={hasErrors}
                isLoading={isSaving}
                loadingText="Creating Job..."
              >
                <Check size={16} />
                <span>{getSubmitButtonText()}</span>
              </LoadingButton>
            </div>
          </div>
        )}
      </form>
    </div>
  </div>
);

  
};

export default MobileJobForm;
