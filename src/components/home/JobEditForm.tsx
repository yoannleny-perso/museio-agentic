import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobFormSchema } from '@/lib/validations/job';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import FormField from '@/components/home/form/FormField';
import TextAreaField from '@/components/home/form/TextAreaField';
import DatePickerField from '@/components/home/form/DatePickerField';
import { Label } from '@/components/ui/label';
import TimeSelect from '@/components/home/form/TimeSelect';
import ClientSelectionField from '@/components/home/form/ClientSelectionField';
import PhoneInput from '@/components/shared/PhoneInput';
import { Job } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export interface JobEditFormProps {
  job: Job;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<boolean> | void;
  isSubmitting: boolean;
}

const JobEditForm = ({
  job,
  onClose,
  onSubmit: propOnSubmit,
  isSubmitting = false,
}: JobEditFormProps) => {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [isExistingClientSelected, setIsExistingClientSelected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [hasClientSelection, setHasClientSelection] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(job.date));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(job.end_date || job.date));

  const [clientData, setClientData] = useState({
    contact_name: '',
    location: '',
    email_address: '',
    phone: ''
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: job.title,
      client: job.client,
      contact_name: job.contact_name || '',
      job_number: job.job_number || '',
      job_description: job.job_description || '',
      date: job.date,
      end_date: job.end_date || job.date,
      start_time: job.start_time,
      end_time: job.end_time,
      location: job.location,
      notes: job.notes || '',
      contact_email: job.contact_email || '',
      contact_phone: job.contact_phone || '',
      rate: String(job.rate)
    }
  });

  useEffect(() => {
    if (job) {
      const formattedStartTime = job.start_time.split(':').slice(0, 2).join(':');
      const formattedEndTime = job.end_time.split(':').slice(0, 2).join(':');
      setValue('start_time', formattedStartTime);
      setValue('end_time', formattedEndTime);
    }
  }, [job, setValue]);

  const handleClientDataChange = (newClientData: any) => {
    setClientData(newClientData);
    setValue('contact_name', newClientData.contact_name || '');
    setValue('location', newClientData.location || '');
    setValue('contact_email', newClientData.email_address || '');
    setValue('contact_phone', newClientData.phone || '');
  };

  const onSubmit = async (data: any) => {
    setHasSubmittedOnce(true);

    console.log('[JobEditForm] Form submitted with data:', data);
    
    data.rate = parseFloat(data.rate);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const firstErrorElement = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      }
      return;
    }

    if (propOnSubmit) {
      const result = await propOnSubmit(data);
      if (result !== false) {
        onClose();
      }
    } else {
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      onClose();
    }
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setValue(field as any, value);
  };

  const handleClientIdChange = useCallback(
    (newClientId: string | null) => {
      setClientId(newClientId);
      setValue('client_id' as any, newClientId);
    },
    [setValue]
  );

  const handleClientSelectionMade = useCallback((hasSelection: boolean) => {
    setHasClientSelection(hasSelection);
  }, []);

  const handleClientSelectionChange = useCallback((isExisting: boolean) => {
    setIsExistingClientSelected(isExisting);
  }, []);

  const handleClearClientErrors = useCallback(() => {
    clearErrors(['client', 'contact_name', 'contact_email', 'location', 'contact_phone']);
  }, [clearErrors]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setValue('date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });
      
      // Ensure end date is not before start date
      if (endDate && newDate > endDate) {
        const adjustedEndDate = new Date(newDate);
        setEndDate(adjustedEndDate);
        setValue('end_date', format(adjustedEndDate, 'yyyy-MM-dd'), { shouldValidate: true });
      }
    }
  };

  const handleEndDateSelect = (newDate: Date | undefined) => {
    if (newDate && date) {
      // Ensure end date is not before start date
      let adjustedDate = newDate;
      if (newDate < date) {
        adjustedDate = new Date(date);
      }
      
      // Check if transitioning from single-day to multi-day job
      const wasSingleDay = date && endDate && date.toDateString() === endDate.toDateString();
      const willBeMultiDay = date && adjustedDate.toDateString() !== date.toDateString();
      
      setEndDate(adjustedDate);
      setValue('end_date', format(adjustedDate, 'yyyy-MM-dd'), { shouldValidate: true });
      
      // Clear time validation errors when transitioning to multi-day job
      if (wasSingleDay && willBeMultiDay) {
        clearErrors(['end_time']);
      }
    }
  };

  const errorFields = Object.keys(errors);
  const hasErrors = errorFields.length > 0;

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {hasErrors && hasSubmittedOnce && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {errorFields.map((fieldName) => {
                  const error = errors[fieldName as keyof typeof errors];
                  const message = typeof error === 'object' && error?.message
                    ? error.message
                    : typeof error === 'string'
                      ? error
                      : `${fieldName} is invalid`;
                  return (
                    <li key={fieldName} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
                      <span>{message}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-museio-purple mb-4">Job Details</h2>

        <FormField id="title" label="Title" placeholder="Enter title" {...register('title')} error={errors.title?.message} />

        <FormField id="job_number" label="Job Number (Optional)" placeholder="#123456" {...register('job_number')} error={errors.job_number?.message} />

        <TextAreaField
          id="job_description"
          label="Job Description (Optional)"
          placeholder="Brief description of the job (e.g. DJ set at wedding, 3-hour session)"
          {...register('job_description')}
          error={errors.job_description?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePickerField
            id="date"
            label="Start Date"
            date={date || null}
            onDateSelect={handleDateSelect}
            error={errors.date?.message}
          />
          
          <DatePickerField
            id="end_date"
            label="End Date"
            date={endDate || null}
            onDateSelect={handleEndDateSelect}
            error={errors.end_date?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time">Start Time</Label>
            <TimeSelect
              id="start_time"
              value={watch('start_time')}
              onChange={handleSelectChange('start_time')}
              error={errors.start_time?.message as string}
              includeNextDay={false}
            />
          </div>
          <div>
            <Label htmlFor="end_time">End Time</Label>
            <TimeSelect
              id="end_time"
              value={watch('end_time')}
              onChange={handleSelectChange('end_time')}
              error={errors.end_time?.message as string}
              includeNextDay={false}
            />
          </div>
        </div>

        <Controller
          name="rate"
          control={control}
          render={({ field }) => (
            <FormField
              id="rate"
              type="number"
              label="Rate ($)"
              placeholder="Enter rate (e.g. 150.50)"
              step="0.01"
              min="0"
              {...field}
              error={errors.rate?.message}
            />
          )}
        />

        <TextAreaField
          id="notes"
          label="Notes (Optional)"
          placeholder="Additional notes"
          {...register('notes')}
          error={errors.notes?.message}
        />
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-museio-purple">Client Information</h3>
        </div>

        <Controller
          control={control}
          name="client"
          render={({ field, fieldState }) => (
            <ClientSelectionField
              value={field.value}
              onChange={field.onChange}
              onClientDataChange={handleClientDataChange}
              onClientIdChange={handleClientIdChange}
              onClientSelectionChange={handleClientSelectionChange}
              onSelectionMade={handleClientSelectionMade}
              onClearErrors={handleClearClientErrors}
              error={fieldState.error?.message}
              disabled={isSubmitting}
            />
          )}
        />

        {(hasClientSelection || isExistingClientSelected) && (
          <>
            <FormField
              id="contact_name"
              label="Contact Name"
              placeholder="Enter contact name"
              error={errors.contact_name?.message}
              {...register('contact_name')}
              disabled={isSubmitting || isExistingClientSelected}
              className={isExistingClientSelected ? 'bg-gray-50 text-gray-600' : ''}
            />

            <FormField
              id="contact_email"
              label="Email Address *"
              type="email"
              placeholder="client@example.com"
              error={errors.contact_email?.message}
              required
              {...register('contact_email')}
              disabled={isSubmitting || isExistingClientSelected}
              className={isExistingClientSelected ? 'bg-gray-50 text-gray-600' : ''}
            />

            <FormField
              id="location"
              label="Location"
              placeholder="Job Location"
              error={errors.location?.message}
              {...register('location')}
              disabled={isSubmitting || isExistingClientSelected}
              className={isExistingClientSelected ? 'bg-gray-50 text-gray-600' : ''}
            />

            <div className="space-y-1">
              <Label htmlFor="contact_phone" className="text-sm font-medium text-black">
                Client's Phone
              </Label>
              <PhoneInput
                value={watch('contact_phone') || ''}
                onChange={(value) => setValue('contact_phone', value)}
                placeholder="Client's phone number"
                disabled={isSubmitting || isExistingClientSelected}
                className={isExistingClientSelected ? 'bg-gray-50 text-gray-600' : ''}
              />
              {errors.contact_phone && (
                <div className="text-red-500 text-sm mt-1">{errors.contact_phone.message}</div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </div>
    </form>
  );
};

export default JobEditForm;
