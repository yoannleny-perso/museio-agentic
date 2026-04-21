import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { compareAsc } from 'date-fns';
import { Job } from '@/types';

interface UseJobStatusProps {
  date: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}

export const useJobStatus = () => {
  const [isMultiDay, setIsMultiDay] = useState(false);

  const checkMultiDay = (date: Date | null, endDate: Date | null): boolean => {
    if (!date || !endDate) {
      return false;
    }

    try {
      const dateA = new Date(date);
      const dateB = new Date(endDate);
      const comparison = compareAsc(dateA, dateB);
      return comparison !== 0;
    } catch (error) {
      console.error("Error comparing dates:", error);
      return false;
    }
  };

  return {
    isMultiDay,
    setIsMultiDay,
    checkMultiDay,
  };
};
