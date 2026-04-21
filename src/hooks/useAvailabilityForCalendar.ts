import { useState, useEffect, useCallback } from 'react';
import { 
  fetchUserAvailability, 
  isUserAvailableOnDate, 
  getAvailableTimeSlotsForDate, 
  UserAvailability 
} from '@/lib/availability';

/**
 * Hook for checking availability in calendar components
 */
export const useAvailabilityForCalendar = (userId?: string) => {
  const [userAvailability, setUserAvailability] = useState<UserAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!userId) {
      setUserAvailability([]);
      return;
    }

    setLoading(true);
    try {
      const availability = await fetchUserAvailability(userId);
      setUserAvailability(availability);
    } catch (error) {
      console.error('Error loading availability for calendar:', error);
      setUserAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const isDateAvailable = (date: Date): boolean => {
    return isUserAvailableOnDate(date, userAvailability);
  };

  const getAvailableTimeSlots = (date: Date) => {
    return getAvailableTimeSlotsForDate(date, userAvailability);
  };

  return {
    userAvailability,
    loading,
    isDateAvailable,
    getAvailableTimeSlots,
    refetchAvailability: loadAvailability,
  };
};
