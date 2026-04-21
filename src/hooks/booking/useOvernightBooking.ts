import { useState, useEffect } from 'react';

export interface OvernightBookingState {
  isOvernightBooking: boolean;
  setIsOvernightBooking: (isOvernight: boolean) => void;
  getEndDate: (selectedDate: Date | null, startTime: string, endTime: string) => Date | undefined;
  detectOvernight: (startTime: string, endTime: string) => boolean;
}

export const useOvernightBooking = (
  startTime: string,
  endTime: string,
  selectedDate: Date | null
): OvernightBookingState => {
  const [isOvernightBooking, setIsOvernightBooking] = useState(false);

  const detectOvernight = (start: string, end: string): boolean => {
    return start && end && end < start;
  };

  const getEndDate = (date: Date | null, start: string, end: string): Date | undefined => {
    if (!date || !detectOvernight(start, end)) return undefined;
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  };

  // Auto-detect overnight booking when times change
  useEffect(() => {
    if (startTime && endTime) {
      const isOvernight = detectOvernight(startTime, endTime);
      setIsOvernightBooking(isOvernight);
    }
  }, [startTime, endTime]);

  return {
    isOvernightBooking,
    setIsOvernightBooking,
    getEndDate,
    detectOvernight
  };
};