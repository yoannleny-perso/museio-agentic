import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  start: string;
  end: string;
}

interface DateAvailability {
  date: string;
  status: 'available' | 'booked' | 'partial' | 'unavailable';
  available_slots?: TimeSlot[];
}

interface BookingAvailabilityResponse {
  availability: DateAvailability[];
}

export const useBookingAvailability = (artistId?: string) => {
  const [availability, setAvailability] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async (startDate: string, endDate: string) => {
    if (!artistId) {
      setAvailability([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-booking-availability', {
        body: {
          artist_id: artistId,
          start_date: startDate,
          end_date: endDate
        }
      });

      if (error) {
        console.error('Error fetching availability:', error);
        setError('Failed to fetch availability');
        return;
      }

      const response = data as BookingAvailabilityResponse;
      setAvailability(response.availability || []);
    } catch (err) {
      console.error('Error calling availability function:', err);
      setError('Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  const getDateAvailability = useCallback((date: string): DateAvailability | null => {
    return availability.find(a => a.date === date) || null;
  }, [availability]);

  const isDateAvailable = useCallback((date: string): boolean => {
    const dateAvailability = getDateAvailability(date);
    return dateAvailability?.status === 'available' || dateAvailability?.status === 'partial';
  }, [getDateAvailability]);

  const getAvailableSlots = useCallback((date: string): TimeSlot[] => {
    const dateAvailability = getDateAvailability(date);
    return dateAvailability?.available_slots || [];
  }, [getDateAvailability]);

  return {
    availability,
    loading,
    error,
    fetchAvailability,
    getDateAvailability,
    isDateAvailable,
    getAvailableSlots
  };
};