
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Job } from '@/types';
import { useJobForm } from '@/hooks/useJobForm';
import { useToast } from '@/hooks/use-toast';
import NewJobCreationShell from '@/components/new-job/NewJobCreationShell';

interface JobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSubmit: (data: Omit<Job, 'id'>) => void;
  onSaveDraft?: (data: any) => void | Promise<void>;
  initialJobData?: Partial<Job>;
}

const JobForm: React.FC<JobFormProps> = ({ 
  open, 
  onOpenChange, 
  selectedDate, 
  onSubmit,
  onSaveDraft,
  initialJobData
}) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    errors,
    setValue,
    reset,
    watch,
    date,
    endDate,
    setDate,
    setEndDate,
    formatJobData,
    validateTimeRange,
    control,
    clearErrors,
  } = useJobForm(initialJobData as Job | undefined);
  
  // Track if form has been initialized to prevent re-initialization
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Initialize form data only once when modal opens
  React.useEffect(() => {
    if (open && !isInitialized) {
      let newDate: Date | null = null;
      
      // If we have initialJobData with a date, use that
      if (initialJobData?.date) {
        newDate = new Date(initialJobData.date);
      } 
      // Otherwise use the selectedDate or current date
      else if (selectedDate) {
        newDate = selectedDate;
      } else {
        newDate = new Date();
      }
      
      if (newDate) {
        setDate(newDate);
        
        // For end date, prefer initialJobData.end_date if available
        const newEndDate = initialJobData?.end_date 
          ? new Date(initialJobData.end_date)
          : newDate; // Fall back to same as start date
          
        setEndDate(newEndDate);
        
        setValue('date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });
        setValue('end_date', format(newEndDate, 'yyyy-MM-dd'), { shouldValidate: true });
      }
      
      // Pre-fill form fields with initialJobData if provided
      if (initialJobData) {
        if (initialJobData.title) setValue('title', initialJobData.title);
        if (initialJobData.job_number) setValue('job_number', initialJobData.job_number);
        if (initialJobData.job_description) setValue('job_description', initialJobData.job_description);
        if (initialJobData.client) setValue('client', initialJobData.client);
        if (initialJobData.location) setValue('location', initialJobData.location);
        if (initialJobData.start_time) setValue('start_time', initialJobData.start_time);
        if (initialJobData.end_time) setValue('end_time', initialJobData.end_time);
        if (initialJobData.rate) setValue('rate', String(initialJobData.rate));
        if (initialJobData.notes) setValue('notes', initialJobData.notes);
        if (initialJobData.contact_email) setValue('contact_email', initialJobData.contact_email);
        if (initialJobData.contact_phone) setValue('contact_phone', initialJobData.contact_phone);
      }
      
      setIsInitialized(true);
      console.log("[JobForm] Form initialized with data:", { newDate, initialJobData });
    }
  }, [open, isInitialized, initialJobData, selectedDate, setDate, setEndDate, setValue]);
  
  // Reset initialization flag when modal closes
  React.useEffect(() => {
    if (!open) {
      setIsInitialized(false);
    }
  }, [open]);
  
  const handleFormSubmit = (data: any) => {
    if (!date) return;
    
    // Validate time range
    if (!validateTimeRange()) {
      toast({
        title: "Invalid date/time range",
        description: "End date and time must be after start date and time.",
        variant: "destructive"
      });
      return;
    }
    
    // Use the formatJobData function to determine the status based on date
    const formattedData = formatJobData(data, false);
    
    // No longer forcing status to 'upcoming' - let the formatJobData function determine the correct status
    console.log("[JobForm] Using date-based status determination for new job:", formattedData.status);
    
    onSubmit(formattedData);
    
    reset();
    onOpenChange(false);
  };

  const handleSaveDraft = () => {
    if (!date) return;
    
    // Even for drafts, we should validate date/time range
    if (!validateTimeRange()) {
      toast({
        title: "Invalid date/time range",
        description: "End date and time must be after start date and time.",
        variant: "destructive"
      });
      return;
    }
    
    // Get current form values, even if incomplete
    const currentData = watch();

    if (onSaveDraft) {
      onSaveDraft(currentData);
    } else {
      const formattedData = formatJobData(currentData, true);
      onSubmit(formattedData);
    }
    
    reset();
    onOpenChange(false);
  };

  if (!open) {
    return null;
  }
  
  const formTitle = initialJobData ? "Duplicate Job" : "New Job";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(90vh,960px)] max-w-4xl flex-col gap-0 overflow-hidden border border-[#DDDCE7] bg-[#F8F9FB] p-0 sm:rounded-[32px]"
        hideCloseButton={true}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{formTitle}</DialogTitle>
        <DialogDescription className="sr-only">
          {initialJobData ? 'Duplicate an existing job and adjust the details before saving.' : 'Create a new job and fill in the booking details.'}
        </DialogDescription>
        <NewJobCreationShell
          onClose={() => onOpenChange(false)}
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
          isSaving={false}
          control={control}
          title={formTitle}
          clearErrors={clearErrors}
        />
      </DialogContent>
    </Dialog>
  );
};

export default JobForm;
