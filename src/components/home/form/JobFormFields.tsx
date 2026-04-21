import React, { useState, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import TimeSelect from './TimeSelect';
import FormFieldError from './FormFieldError';
import { Controller } from 'react-hook-form';
import DatePickerField from './DatePickerField';
import FormField from './FormField';
import TextAreaField from './TextAreaField';
import ClientSelectionField from './ClientSelectionField';
import { Separator } from '@/components/ui/separator';
import PhoneInput from '@/components/shared/PhoneInput';
import JobItemsManager from './JobItemsManager';
import { Button } from '@/components/ui/button';
import MultiEmailInput from '@/components/shared/MultiEmailInput';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobFormFieldsProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  date: Date | null;
  setDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  control: any;
  clearErrors?: any;
}

const JobFormFields: React.FC<JobFormFieldsProps> = ({
  register,
  errors,
  watch,
  setValue,
  date,
  setDate,
  endDate,
  setEndDate,
  isSubmitting = false,
  serverError = null,
  control,
  clearErrors,
}) => {
  const [clientData, setClientData] = useState({
    contact_name: '',
    location: '',
    email_address: '',
    phone: '',
  });
  const [isExistingClientSelected, setIsExistingClientSelected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [hasClientSelection, setHasClientSelection] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  
  const { addClient } = useSupabaseClients();
  const { toast } = useToast();

  // Watch pricing mode to conditionally show job description
  const pricingMode = watch('pricing_mode');
  const shouldShowJobDescription = !pricingMode; // Only show for legacy jobs

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const previousDate = date;
      setDate(newDate);
      if (endDate && endDate < newDate) {
        setEndDate(newDate);
        setValue('end_date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });
      }
      setValue('date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });
      
      // Clear time validation errors when start date changes
      if (previousDate && newDate.toDateString() !== previousDate.toDateString()) {
        clearErrors(['end_time']);
        // Re-trigger validation for time fields
        setTimeout(() => {
          setValue('end_time', watch('end_time'), { shouldValidate: true });
        }, 0);
      }
    }
  };

  const handleEndDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      if (date && newDate < date) {
        newDate = new Date(date);
      }
      
      // Check if transitioning from single-day to multi-day job
      const wasSingleDay = date && endDate && date.toDateString() === endDate.toDateString();
      const willBeMultiDay = date && newDate.toDateString() !== date.toDateString();
      
      setEndDate(newDate);
      setValue('end_date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });
      
      // Clear time validation errors when transitioning to multi-day job
      // or when changing to any different end date (to re-trigger validation)
      if ((wasSingleDay && willBeMultiDay) || (endDate && newDate.toDateString() !== endDate.toDateString())) {
        clearErrors(['end_time']);
        // Re-trigger validation for end_time field
        setTimeout(() => {
          setValue('end_time', watch('end_time'), { shouldValidate: true });
        }, 0);
      }
    }
  };

  const handleTimeChange = (field: string) => (value: string) => {
    setValue(field, value, { shouldValidate: true });

    // Clear any existing time validation errors when changing times
    // This ensures validation is re-evaluated with new values
    if (field === 'end_time') {
      clearErrors(['end_time']);
    }

    if (field === 'end_time' && date && endDate && date.toDateString() === endDate.toDateString()) {
      const startTime = watch('start_time');
      if (value <= startTime) {
        // Invalid: Consider warning the user here
      }
    }

    if (field === 'start_time' && date && endDate && date.toDateString() === endDate.toDateString()) {
      const endTime = watch('end_time');
      if (endTime <= value) {
        const [hours, minutes] = value.split(':').map(Number);
        let newHours = hours + 1;
        if (newHours > 23) newHours = 23;
        const newEndTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setValue('end_time', newEndTime, { shouldValidate: true });
      }
    }
  };

  const handleClientDataChange = useCallback(
    (newClientData: typeof clientData) => {
      setClientData(newClientData);
      setValue('contact_name', newClientData.contact_name || '');
      setValue('location', newClientData.location || '');
      setValue('contact_email', newClientData.email_address || '');
      setValue('contact_phone', newClientData.phone || '');
    },
    [setValue]
  );

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
    if (clearErrors) {
      clearErrors(['client', 'contact_name', 'contact_email', 'location', 'contact_phone']);
    }
  }, [clearErrors]);

  const handleSaveClient = useCallback(async () => {
    const clientName = watch('client');
    const contactEmail = watch('contact_email');
    const contactName = watch('contact_name');
    const location = watch('location');
    const contactPhone = watch('contact_phone');

    // Validate required fields
    if (!clientName?.trim()) {
      toast({
        title: "Client name required",
        description: "Please enter a client name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!contactEmail?.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a client email before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingClient(true);
    try {
      const newClient = await addClient({
        venue_name: clientName,
        email_address: contactEmail,
        contact_name: contactName || '',
        location: location || '',
        phone: contactPhone || '',
      });

      if (newClient) {
        // Auto-select the newly created client
        setIsExistingClientSelected(true);
        setClientId(newClient.id);
        setHasClientSelection(true);
        
        toast({
          title: "Client saved",
          description: `${clientName} has been saved to your clients.`,
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error saving client",
        description: "There was an error saving the client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingClient(false);
    }
  }, [watch, addClient, toast]);

  // Check if we should show the save client button
  const shouldShowSaveClientButton = hasClientSelection && 
    !isExistingClientSelected && 
    watch('client')?.trim() && 
    watch('contact_email')?.trim();

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-museio-purple">Job Details</h3>
        </div>

        <FormField
          id="title"
          label="Job Title *"
          placeholder="Job Name"
          error={errors.title?.message}
          required
          {...register('title')}
          disabled={isSubmitting}
        />

        <FormField
          id="job_number"
          label="Job Number"
          placeholder="#123456"
          error={errors.job_number?.message}
          {...register('job_number')}
          disabled={isSubmitting}
        />

        {shouldShowJobDescription && (
          <TextAreaField
            id="job_description"
            label="Job Description"
            placeholder="Brief description of the job (e.g. DJ set at wedding, 3-hour session)"
            error={errors.job_description?.message}
            {...register('job_description')}
            disabled={isSubmitting}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="date"
            render={({ fieldState }) => (
              <DatePickerField
                id="date"
                label="Start Date"
                date={date}
                onDateSelect={handleDateSelect}
                error={fieldState.error?.message}
                required
              />
            )}
          />
          <Controller
            control={control}
            name="end_date"
            render={({ fieldState }) => (
              <DatePickerField
                id="end_date"
                label="End Date"
                date={endDate}
                onDateSelect={handleEndDateSelect}
                error={fieldState.error?.message}
                required
                minDate={date}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="start_time" className="text-sm font-medium text-black">
              Start Time <span className="text-black">*</span>
            </Label>
            <TimeSelect
              id="start_time"
              value={watch('start_time')}
              onChange={handleTimeChange('start_time')}
              disabled={isSubmitting}
              error={errors.start_time?.message}
              includeNextDay={false}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="end_time" className="text-sm font-medium text-black">
              End Time <span className="text-black">*</span>
            </Label>
            <TimeSelect
              id="end_time"
              value={watch('end_time')}
              onChange={handleTimeChange('end_time')}
              disabled={isSubmitting}
              error={errors.end_time?.message}
              includeNextDay={false}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <JobItemsManager
            control={control}
            watch={watch}
            errors={errors}
            disabled={isSubmitting}
          />
          {errors.job_items && (
            <div className="text-sm text-red-600">
              {errors.job_items.message}
            </div>
          )}
        </div>

        <TextAreaField
          id="notes"
          label="Notes"
          placeholder="Additional information about the job"
          error={errors.notes?.message}
          {...register('notes')}
          disabled={isSubmitting}
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
              onCreateClient={async () => {
                // Trigger client refresh and auto-selection
                setIsExistingClientSelected(true);
                setHasClientSelection(true);
              }}
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

          <div className="space-y-1">
            <Label htmlFor="contact_email">Email Address *</Label>
            <MultiEmailInput
              value={watch('contact_email') || ''}
              onChange={(value) => setValue('contact_email', value, { shouldValidate: true })}
              placeholder="Enter email addresses..."
              className={isExistingClientSelected ? 'opacity-60 pointer-events-none' : ''}
            />
            {errors.contact_email && (
              <p className="text-sm text-destructive">{errors.contact_email.message}</p>
            )}
          </div>

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
              {errors.contact_phone && <FormFieldError error={errors.contact_phone.message} />}
            </div>

            {shouldShowSaveClientButton && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveClient}
                  disabled={isSavingClient || isSubmitting}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingClient ? 'Saving Client...' : 'Save Client'}
                </Button>
              </div>
            )}
          </>
        )}

        {serverError && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">{serverError}</div>
        )}
      </div>
    </>
  );
};

export default JobFormFields;
