
import { useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { format } from 'date-fns';
import { Job } from '@/types';

interface UseFormInitializationProps {
  setValue: UseFormSetValue<Job>;
  defaultValues?: Job;
}

export const useFormInitialization = ({ setValue, defaultValues }: UseFormInitializationProps) => {
  useEffect(() => {
    if (defaultValues) {
      // Populate the form with default values when available
      setValue('title', defaultValues.title || '');
      setValue('client', defaultValues.client || '');
      setValue('location', defaultValues.location || '');
      setValue('date', format(new Date(defaultValues.date), 'yyyy-MM-dd'));
      setValue('end_date', defaultValues.end_date ? format(new Date(defaultValues.end_date), 'yyyy-MM-dd') : format(new Date(defaultValues.date), 'yyyy-MM-dd'));
      setValue('start_time', defaultValues.start_time || '09:00');
      setValue('end_time', defaultValues.end_time || '17:00');
      setValue('rate', defaultValues.rate);
      setValue('notes', defaultValues.notes || '');
      setValue('contact_email', defaultValues.contact_email || '');
      setValue('contact_phone', defaultValues.contact_phone || '');
      setValue('job_number', defaultValues.job_number || '');
      setValue('job_description', defaultValues.job_description || '');
      setValue('status', defaultValues.status || 'upcoming');
    }
  }, [setValue, defaultValues]);
};
