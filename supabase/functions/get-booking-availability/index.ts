import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  BOOKING_AVAILABILITY_BLOCKING_REQUEST_STATUSES,
} from "../../../src/contracts/booking.ts";
import {
  calculateAvailableSlotsForRanges,
  doesDateOverlapAvailabilityRange,
  filterSlotsByMinimumNotice,
  getBlockedTimesForDate,
  mergeAvailabilitySlots,
} from "../../../src/contracts/availability.ts";
import { BOOKING_AVAILABILITY_BLOCKING_JOB_STATUSES } from "../../../src/contracts/jobs.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  artist_id: string;
  start_date: string;
  end_date: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DateAvailability {
  date: string;
  status: 'available' | 'booked' | 'partial' | 'unavailable';
  available_slots?: TimeSlot[];
}

interface UserAvailabilitySettings {
  buffer_time_minutes: number;
  min_notice_hours: number;
  enable_breaks: boolean;
  break_duration_minutes: number;
}

interface VacationPeriod {
  start_date: string;
  end_date: string;
}

interface UserAvailabilityRow {
  day_of_week: number;
  end_time: string;
  is_available: boolean;
  is_pattern: boolean | null;
  slot_order?: number | null;
  specific_date: string | null;
  start_time: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { artist_id, start_date, end_date }: AvailabilityRequest = await req.json();

    if (!artist_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all required data in parallel
    const [
      { data: availability, error: availabilityError },
      { data: availabilitySettings, error: settingsError },
      { data: vacationPeriods, error: vacationError },
    ] = await Promise.all([
      supabase.from('user_availability').select('*').eq('user_id', artist_id),
      supabase.from('user_availability_settings').select('*').eq('user_id', artist_id).single(),
      supabase.from('user_vacation_periods').select('*').eq('user_id', artist_id)
    ]);

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use default settings if none found
    const settings: UserAvailabilitySettings = availabilitySettings || {
      buffer_time_minutes: 15,
      min_notice_hours: 24,
      enable_breaks: false,
      break_duration_minutes: 60
    };

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching availability settings:', settingsError);
    }

    if (vacationError) {
      console.error('Error fetching vacation periods:', vacationError);
    }

    console.log('Availability settings:', settings);
    console.log('Vacation periods:', vacationPeriods?.length || 0);

    // Get existing bookings for the date range (only status and time info, NO sensitive data)
    const { data: bookings, error: bookingsError } = await supabase
      .from('jobs')
      .select('date, end_date, start_time, end_time, status')
      .eq('user_id', artist_id)
      .lte('date', end_date)
      .or(`end_date.gte.${start_date},and(end_date.is.null,date.gte.${start_date})`)
      .in('status', [...BOOKING_AVAILABILITY_BLOCKING_JOB_STATUSES]);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get booking requests for pending bookings
    const { data: bookingRequests, error: requestsError } = await supabase
      .from('booking_requests')
      .select('event_date, event_end_date, event_start_time, event_end_time, status')
      .eq('portfolio_user_id', artist_id)
      .lte('event_date', end_date)
      .or(`event_end_date.gte.${start_date},and(event_end_date.is.null,event_date.gte.${start_date})`)
      .in('status', [...BOOKING_AVAILABILITY_BLOCKING_REQUEST_STATUSES]);

    if (requestsError) {
      console.error('Error fetching booking requests:', requestsError);
    }

    // Helper function to check if date is in vacation
    const isDateInVacation = (dateStr: string): boolean => {
      if (!vacationPeriods) return false;
      return vacationPeriods.some(period => 
        dateStr >= period.start_date && dateStr <= period.end_date
      );
    };

    // Calculate availability for each date
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const dateAvailability: DateAvailability[] = [];
    const now = new Date();

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Convert to our system (0 = Monday, 6 = Sunday)
      const ourDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Check if date is in vacation period
      if (isDateInVacation(dateString)) {
        console.log(`Date ${dateString} is in vacation period`);
        dateAvailability.push({
          date: dateString,
          status: 'unavailable'
        });
        continue;
      }

      const sortAvailabilityRows = (rows: UserAvailabilityRow[]) =>
        [...rows].sort((left, right) => {
          const leftOrder = left.slot_order ?? 0;
          const rightOrder = right.slot_order ?? 0;

          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }

          return left.start_time.localeCompare(right.start_time);
        });

      const dateSpecificRows = sortAvailabilityRows(
        (availability || []).filter((row) => row.specific_date === dateString && row.is_pattern === false)
      );

      const dayAvailabilityRows = dateSpecificRows.length > 0
        ? dateSpecificRows
        : sortAvailabilityRows(
            (availability || []).filter(
              (row) => row.day_of_week === ourDayOfWeek && (row.is_pattern === true || row.is_pattern === null)
            )
          );

      const availableRanges = dayAvailabilityRows
        .filter((row) => row.is_available)
        .map((row) => ({
          start: row.start_time,
          end: row.end_time,
        }));

      if (availableRanges.length === 0) {
        dateAvailability.push({
          date: dateString,
          status: 'unavailable'
        });
        continue;
      }

      // Check for existing bookings on this date
      const dayBookings = bookings?.filter((booking) =>
        doesDateOverlapAvailabilityRange(dateString, booking)
      ) || [];

      // Check for pending booking requests on this date
      const dayRequests = bookingRequests?.filter((request) =>
        doesDateOverlapAvailabilityRange(dateString, {
          date: request.event_date,
          end_date: request.event_end_date,
        })
      ) || [];

      // Combine all blocked times
      const blockedTimes = [
        ...dayBookings.flatMap((booking) =>
          getBlockedTimesForDate(dateString, {
            date: booking.date,
            end_date: booking.end_date,
            start: booking.start_time,
            end: booking.end_time,
          })
        ),
        ...dayRequests.flatMap((request) =>
          request.event_start_time && request.event_end_time
            ? getBlockedTimesForDate(dateString, {
                date: request.event_date,
                end_date: request.event_end_date,
                start: request.event_start_time,
                end: request.event_end_time,
              })
            : []
        ),
      ];

      // Calculate available time slots with settings
      const rawAvailableSlots = calculateAvailableSlotsForRanges(
        availableRanges,
        blockedTimes,
        settings
      );
      const availableSlots = filterSlotsByMinimumNotice(
        dateString,
        rawAvailableSlots,
        settings.min_notice_hours,
        now
      );

      if (availableSlots.length === 0) {
        dateAvailability.push({
          date: dateString,
          status: rawAvailableSlots.length === 0 ? 'booked' : 'unavailable'
        });
      } else {
        const mergedSourceRanges = mergeAvailabilitySlots(availableRanges);
        const hasFullAvailability =
          availableSlots.length === mergedSourceRanges.length &&
          availableSlots.every(
            (slot, slotIndex) =>
              slot.start === mergedSourceRanges[slotIndex]?.start &&
              slot.end === mergedSourceRanges[slotIndex]?.end
          );

        if (hasFullAvailability) {
        dateAvailability.push({
          date: dateString,
          status: 'available',
          available_slots: availableSlots
        });
        } else {
          dateAvailability.push({
            date: dateString,
            status: 'partial',
            available_slots: availableSlots
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ availability: dateAvailability }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-booking-availability:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
