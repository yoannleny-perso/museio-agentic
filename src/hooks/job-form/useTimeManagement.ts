
import { UseFormWatch } from 'react-hook-form';
import { FormData } from '@/components/home/form/FormTypes';

export function useTimeManagement(watch: UseFormWatch<FormData>) {
  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    // This function is used in components but doesn't directly modify state
    // It's kept for API compatibility
    console.log(`[useTimeManagement] Time changed: ${field} to ${value}`);
    return { field, value };
  };

  const validateTimeRange = (): boolean => {
    const watchedValues = watch();
    const startTime = watchedValues.start_time;
    const endTime = watchedValues.end_time;
    const startDate = watchedValues.date;
    const endingDate = watchedValues.end_date;
    
    // If we don't have all the values yet, skip validation
    if (!startTime || !endTime || !startDate || !endingDate) {
      return true;
    }
    
    // Create date objects with the time values for comparison
    const startDateTime = new Date(`${startDate.toISOString().split('T')[0]}T${startTime}:00`);
    const endDateTime = new Date(`${endingDate.toISOString().split('T')[0]}T${endTime}:00`);
    
    // Compare the full date-time values
    return endDateTime > startDateTime;
  };

  return {
    handleTimeChange,
    validateTimeRange
  };
}
