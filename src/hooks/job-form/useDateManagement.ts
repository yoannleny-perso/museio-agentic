
import { useState, useCallback } from 'react';
import { format, parse, isValid, parseISO } from 'date-fns';
import { Control, FieldValues, UseFormSetValue } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { Job } from '@/types';

interface UseDateManagementProps {
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
}

export const useDateManagement = ({ control, setValue }: UseDateManagementProps) => {
  const [date, setDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Watch the 'date' and 'end_date' fields
  const watchedDate = useWatch({ control, name: 'date' });
  const watchedEndDate = useWatch({ control, name: 'end_date' });
  const watchedStartTime = useWatch({ control, name: 'start_time' });
  const watchedEndTime = useWatch({ control, name: 'end_time' });

  // Function to validate time range
  const validateTimeRange = useCallback(() => {
    if (!date || !endDate) return true;
    
    // If it's a multi-day job, time validation is not needed
    if (format(date, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd')) {
      return true;
    }

    const startTime = parse(watchedStartTime || '00:00', 'HH:mm', new Date());
    const endTime = parse(watchedEndTime || '00:00', 'HH:mm', new Date());

    return startTime < endTime;
  }, [date, endDate, watchedEndTime, watchedStartTime]);

  // Function to format job data
  const formatjobData = useCallback((data: any, isDraft: boolean): Omit<Job, 'id'> => {
    const formattedDate = date ? format(date, 'yyyy-MM-dd') : null;
    const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : null;
    
    if (!formattedDate) {
      throw new Error("Date is required");
    }

    return {
      title: data.title,
      client: data.client,
      date: formattedDate,
      end_date: formattedEndDate || formattedDate,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location,
      rate: parseFloat(data.rate),
      notes: data.notes || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      job_number: data.job_number || null,
      job_description: data.job_description || null,
      status: isDraft ? 'drafted' : 'upcoming'
    };
  }, [date, endDate]);

  return {
    date,
    endDate,
    setDate,
    setEndDate,
    formatjobData,
    validateTimeRange
  };
};
