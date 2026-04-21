import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobFormSchema } from '@/lib/validations/job';
import { format, isEqual, isAfter } from 'date-fns';
import { Job, JobStatus } from '@/types';
import { getCanonicalJobStatus } from '@/contracts';

type JobFormValues = {
  title?: string;
  job_number?: string;
  job_description?: string;
  location?: string;
  client?: string;
  contact_name?: string;
  date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  rate?: string | number;
  notes?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: string;
  pricing_mode?: string | null;
  job_items?: Job['job_items'];
};

type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';

interface UseJobFormOptions {
  mode?: ValidationMode;
}

export const useJobForm = (initialJob?: Job, options?: UseJobFormOptions) => {
  // Initialize the form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    formState,
    control,
    clearErrors
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    mode: options?.mode || 'onChange',
    defaultValues: initialJob ? {
      title: initialJob.title || '',
      job_number: initialJob.job_number || '',
      job_description: initialJob.job_description || '',
      location: initialJob.location || '',
      client: initialJob.client || '',
      contact_name: initialJob.contact_name || '',
      date: initialJob.date || format(new Date(), 'yyyy-MM-dd'),
      end_date: initialJob.end_date || initialJob.date || format(new Date(), 'yyyy-MM-dd'),
      start_time: initialJob.start_time || '09:00',
      end_time: initialJob.end_time || '17:00',
      rate: String(initialJob.rate) || '',
      notes: initialJob.notes || '',
      contact_email: initialJob.contact_email || '',
      contact_phone: initialJob.contact_phone || '',
      status: initialJob.status || 'upcoming',
      pricing_mode: initialJob.pricing_mode || (initialJob.job_items?.length > 0 ? 'itemized' : 'simple'),
      job_items: initialJob.job_items || []
    } : {
      // Complete default values for all form fields to ensure proper reset
      title: '',
      job_number: '',
      job_description: '',
      location: '',
      client: '',
      contact_name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      rate: '',
      notes: '',
      contact_email: '',
      contact_phone: '',
      status: 'upcoming',
      pricing_mode: 'itemized',
      job_items: []
    }
  });

  // State for date selection
  const [date, setDate] = useState<Date | null>(initialJob?.date 
    ? new Date(initialJob.date) 
    : new Date()
  );
  
  const [endDate, setEndDate] = useState<Date | null>(initialJob?.end_date 
    ? new Date(initialJob.end_date) 
    : initialJob?.date 
      ? new Date(initialJob.date) 
      : new Date()
  );

  // Validate time range: ensure end date/time is after start date/time
  const validateTimeRange = () => {
    // Get the current start and end time values from the form
    const startTime = watch('start_time');
    const endTime = watch('end_time');
    
    if (!date || !endDate || !startTime || !endTime) {
      return false;
    }
    
    // Create complete date-time objects for comparison
    const startDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      parseInt(startTime.split(':')[0], 10),
      parseInt(startTime.split(':')[1], 10)
    );
    
    const endDateTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      parseInt(endTime.split(':')[0], 10),
      parseInt(endTime.split(':')[1], 10)
    );
    
    // Compare full date-time objects
    return isAfter(endDateTime, startDateTime) || isEqual(endDateTime, startDateTime);
  };

  // Determine job status based on date and isDraft flag
  const determineJobStatus = (jobDate: Date, isDraft: boolean): JobStatus => {
    return getCanonicalJobStatus(
      {
        date: format(jobDate, 'yyyy-MM-dd'),
        end_date: format(endDate || jobDate, 'yyyy-MM-dd'),
        start_time: watch('start_time') || '09:00',
        end_time: watch('end_time') || '17:00',
      },
      undefined,
      { isDraft }
    );
  };

  // Format job data for submission
  const formatJobData = (
    data: JobFormValues,
    isDraft: boolean = false
  ): Omit<Job, 'id'> => {
    const jobDate = date || new Date();
    const jobEndDate = endDate || jobDate;
    
    const status = determineJobStatus(jobDate, isDraft);
    
    // Format the final data object
    return {
      title: data.title || '',
      job_number: data.job_number || '',
      job_description: data.job_description || '',
      location: data.location || '',
      client: data.client || '',
      contact_name: data.contact_name || '',
      date: format(jobDate, 'yyyy-MM-dd'),
      end_date: format(jobEndDate, 'yyyy-MM-dd'),
      start_time: data.start_time || '09:00',
      end_time: data.end_time || '17:00',
      rate: parseFloat(String(data.rate ?? '0')),
      status: status,
      notes: data.notes || '',
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      pricing_mode: data.pricing_mode === 'itemized' ? 'itemized' : 'simple',
      job_items: data.job_items || []
    };
  };

  return {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    reset,
    formState,
    date,
    setDate,
    endDate, 
    setEndDate,
    validateTimeRange,
    formatJobData,
    control,
    clearErrors
  };
};
