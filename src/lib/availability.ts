import { supabase } from '@/integrations/supabase/client';
import { format, getDay } from 'date-fns';

export interface UserAvailability {
  id: string;
  user_id: string;
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
  slot_order?: number | null;
  specific_date?: string | null;
  is_pattern: boolean;
  username?: string | null;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  day: string;
  enabled: boolean;
  timeSlots: AvailabilitySlot[];
}

export interface UserAvailabilitySettings {
  id?: string;
  user_id: string;
  buffer_time_minutes: number;
  min_notice_hours: number;
  enable_breaks: boolean;
  break_duration_minutes: number;
}

export interface UserVacationPeriod {
  id?: string;
  user_id: string;
  start_date: string;
  end_date: string;
}

/**
 * Convert JavaScript Date.getDay() to our database format
 * JS: Sunday=0, Monday=1, ... Saturday=6
 * DB: Same format, but we clarify here for consistency
 */
export const getAvailabilityDayOfWeek = (date: Date): number => {
  return getDay(date); // 0=Sunday, 1=Monday, etc.
};

/**
 * Convert day name to day_of_week number
 */
export const dayNameToDayOfWeek = (dayName: string): number => {
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  return dayMap[dayName] ?? 1; // Default to Monday
};

const DEFAULT_TIME_SLOT: AvailabilitySlot = {
  start: '09:00',
  end: '17:00',
};

const sortAvailabilityRows = (rows: UserAvailability[]) =>
  [...rows].sort((left, right) => {
    const leftOrder = left.slot_order ?? 0;
    const rightOrder = right.slot_order ?? 0;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.start_time.localeCompare(right.start_time);
  });

const getAvailabilityRowsForDate = (
  date: Date,
  userAvailability: UserAvailability[]
) => {
  const dayOfWeek = getAvailabilityDayOfWeek(date);
  const dateString = format(date, 'yyyy-MM-dd');

  const dateSpecificRows = userAvailability.filter(
    (availability) => availability.specific_date === dateString && !availability.is_pattern
  );

  if (dateSpecificRows.length > 0) {
    return sortAvailabilityRows(dateSpecificRows);
  }

  const patternRows = userAvailability.filter(
    (availability) => availability.day_of_week === dayOfWeek && availability.is_pattern
  );

  return sortAvailabilityRows(patternRows);
};

const rowsToTimeSlots = (rows: UserAvailability[]): AvailabilitySlot[] =>
  rows
    .filter((row) => row.is_available)
    .map((row) => ({
      start: row.start_time?.includes(':') ? row.start_time.substring(0, 5) : row.start_time,
      end: row.end_time?.includes(':') ? row.end_time.substring(0, 5) : row.end_time,
    }));

const buildFallbackDayAvailability = (day: string): DayAvailability => ({
  day,
  enabled: false,
  timeSlots: [{ ...DEFAULT_TIME_SLOT }],
});

/**
 * Fetch user's availability settings from database
 */
export const fetchUserAvailability = async (userId: string): Promise<UserAvailability[]> => {
  const { data, error } = await supabase
    .from('user_availability')
    .select('*')
    .eq('user_id', userId)
    .order('specific_date', { ascending: true })
    .order('day_of_week', { ascending: true })
    .order('slot_order', { ascending: true });

  if (error) {
    console.error('Error fetching user availability:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch user's availability for a specific date range
 */
export const fetchUserAvailabilityForDateRange = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<UserAvailability[]> => {
  const { data, error } = await supabase
    .from('user_availability')
    .select('*')
    .eq('user_id', userId)
    .or(`is_pattern.eq.true,and(specific_date.gte.${format(startDate, 'yyyy-MM-dd')},specific_date.lte.${format(endDate, 'yyyy-MM-dd')})`)
    .order('specific_date', { ascending: true })
    .order('day_of_week', { ascending: true })
    .order('slot_order', { ascending: true });

  if (error) {
    console.error('Error fetching user availability for date range:', error);
    return [];
  }

  return data || [];
};

/**
 * Save user's availability settings to database as patterns (recurring weekly)
 */
export const saveUserAvailability = async (
  userId: string, 
  availability: DayAvailability[],
  username?: string
): Promise<boolean> => {
  try {
    // Delete existing pattern-based availability settings
    await supabase
      .from('user_availability')
      .delete()
      .eq('user_id', userId)
      .eq('is_pattern', true);

    // Insert new pattern settings
    const availabilityData = availability.flatMap((day) => {
      const fallbackSlot = day.timeSlots[0] || DEFAULT_TIME_SLOT;

      if (!day.enabled || day.timeSlots.length === 0) {
        return {
          user_id: userId,
          day_of_week: dayNameToDayOfWeek(day.day),
          is_available: false,
          start_time: fallbackSlot.start,
          end_time: fallbackSlot.end,
          slot_order: 0,
          is_pattern: true,
          specific_date: null,
          username: username || null,
        };
      }

      return day.timeSlots.map((slot, slotIndex) => ({
        user_id: userId,
        day_of_week: dayNameToDayOfWeek(day.day),
        is_available: true,
        start_time: slot.start,
        end_time: slot.end,
        slot_order: slotIndex,
        is_pattern: true,
        specific_date: null,
        username: username || null,
      }));
    });

    const { error } = await supabase
      .from('user_availability')
      .insert(availabilityData);

    if (error) {
      console.error('Error saving user availability patterns:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveUserAvailability:', error);
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
};

/**
 * Save availability for specific dates (non-recurring)
 */
export const saveWeekSpecificAvailability = async (
  userId: string,
  availability: DayAvailability[],
  weekDates: Date[],
  username?: string
): Promise<boolean> => {
  try {
    // Delete existing date-specific settings for this week
    const weekDateStrings = weekDates.map(date => format(date, 'yyyy-MM-dd'));
    
    await supabase
      .from('user_availability')
      .delete()
      .eq('user_id', userId)
      .in('specific_date', weekDateStrings);

    // Insert new date-specific settings
    const availabilityData = availability.flatMap((dayAvail, index) => {
      const specificDate = weekDates[index];
      if (!specificDate) return [];

      const fallbackSlot = dayAvail.timeSlots[0] || DEFAULT_TIME_SLOT;

      if (!dayAvail.enabled || dayAvail.timeSlots.length === 0) {
        return {
          user_id: userId,
          day_of_week: dayNameToDayOfWeek(dayAvail.day),
          is_available: false,
          start_time: fallbackSlot.start,
          end_time: fallbackSlot.end,
          slot_order: 0,
          is_pattern: false,
          specific_date: format(specificDate, 'yyyy-MM-dd'),
          username: username || null,
        };
      }

      return dayAvail.timeSlots.map((slot, slotIndex) => ({
        user_id: userId,
        day_of_week: dayNameToDayOfWeek(dayAvail.day),
        is_available: true,
        start_time: slot.start,
        end_time: slot.end,
        slot_order: slotIndex,
        is_pattern: false,
        specific_date: format(specificDate, 'yyyy-MM-dd'),
        username: username || null,
      }));
    });

    const { error } = await supabase
      .from('user_availability')
      .insert(availabilityData);

    if (error) {
      console.error('Error saving week-specific availability:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveWeekSpecificAvailability:', error);
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
};

/**
 * Check if a user is available on a specific date (prioritizes date-specific over patterns)
 */
export const isUserAvailableOnDate = (
  date: Date, 
  userAvailability: UserAvailability[]
): boolean => {
  const dayAvailabilityRows = getAvailabilityRowsForDate(date, userAvailability);

  if (dayAvailabilityRows.length === 0) {
    return false;
  }

  return dayAvailabilityRows.some((row) => row.is_available);
};

/**
 * Check if a user is available during a specific time range on a date (prioritizes date-specific over patterns)
 */
export const isUserAvailableAtTime = (
  date: Date,
  startTime: string,
  endTime: string,
  userAvailability: UserAvailability[]
): boolean => {
  const dayAvailabilityRows = getAvailabilityRowsForDate(date, userAvailability).filter(
    (row) => row.is_available
  );

  if (dayAvailabilityRows.length === 0) {
    return false;
  }

  // Convert times to minutes for proper comparison (handles next-day times)
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const requestStart = parseTime(startTime);
  let requestEnd = parseTime(endTime);

  if (requestEnd <= requestStart) {
    requestEnd += 24 * 60;
  }

  return dayAvailabilityRows.some((row) => {
    const availStart = parseTime(row.start_time);
    let availEnd = parseTime(row.end_time);

    if (availEnd <= availStart) {
      availEnd += 24 * 60;
    }

    return requestStart >= availStart && requestEnd <= availEnd;
  });
};

/**
 * Get available time slots for a specific date (prioritizes date-specific over patterns)
 */
export const getAvailableTimeSlotsForDate = (
  date: Date,
  userAvailability: UserAvailability[]
): AvailabilitySlot[] => {
  return getAvailabilityRowsForDate(date, userAvailability)
    .filter((row) => row.is_available)
    .map((row) => ({
      start: row.start_time,
      end: row.end_time,
    }));
};

/**
 * Convert availability from database format to UI format for a specific week
 */
// Get Monday date for a given date (start of week)
function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Copy availability from one week to another
export const copyWeekAvailability = async (
  userId: string,
  sourceWeekDates: Date[],
  targetWeekDates: Date[],
  username?: string
): Promise<boolean> => {
  try {
    // Fetch source week availability
    const sourceAvailability = await fetchUserAvailabilityForDateRange(
      userId,
      sourceWeekDates[0],
      sourceWeekDates[6]
    );

    // Filter for date-specific availability only
    const sourceWeekAvailability = sourceAvailability.filter(
      (avail) => avail.specific_date && !avail.is_pattern
    );

    if (sourceWeekAvailability.length === 0) {
      return false;
    }

    // Convert to UI format for the source week
    const sourceUIAvailability = convertDbAvailabilityToUI(sourceWeekAvailability, sourceWeekDates);

    // Save the availability to the target week
    return await saveWeekSpecificAvailability(userId, sourceUIAvailability, targetWeekDates, username);
  } catch (error) {
    console.error('Error copying week availability:', error);
    return false;
  }
};

// Copy availability to multiple target weeks
export const copyToMultipleWeeks = async (
  userId: string,
  sourceWeekDates: Date[],
  targetWeeksList: Date[][],
  username?: string
): Promise<boolean> => {
  try {
    const results = await Promise.all(
      targetWeeksList.map(targetWeekDates => 
        copyWeekAvailability(userId, sourceWeekDates, targetWeekDates, username)
      )
    );

    return results.every(result => result);
  } catch (error) {
    console.error('Error copying to multiple weeks:', error);
    return false;
  }
};

// Generate week dates for a given Monday date
export const generateWeekDates = (mondayDate: Date): Date[] => {
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(mondayDate);
    date.setDate(mondayDate.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
};

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();
  
  if (startMonth === endMonth) {
    return `Week of ${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `Week of ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

export const convertDbAvailabilityToUI = (
  dbAvailability: UserAvailability[], 
  weekDates?: Date[]
) => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return dayNames.map((dayName, index) => {
    const dayRows = weekDates && weekDates[index]
      ? getAvailabilityRowsForDate(weekDates[index], dbAvailability)
      : sortAvailabilityRows(
          dbAvailability.filter(
            (availability) =>
              availability.day_of_week === dayNameToDayOfWeek(dayName) && availability.is_pattern
          )
        );

    if (dayRows.length === 0) {
      return buildFallbackDayAvailability(dayName);
    }

    const timeSlots = rowsToTimeSlots(dayRows);

    if (timeSlots.length === 0) {
      const firstRow = dayRows[0];
      return {
        day: dayName,
        enabled: false,
        timeSlots: [
          {
            start: firstRow?.start_time?.includes(':')
              ? firstRow.start_time.substring(0, 5)
              : firstRow?.start_time ?? DEFAULT_TIME_SLOT.start,
            end: firstRow?.end_time?.includes(':')
              ? firstRow.end_time.substring(0, 5)
              : firstRow?.end_time ?? DEFAULT_TIME_SLOT.end,
          },
        ],
      };
    }

    return {
      day: dayName,
      enabled: true,
      timeSlots,
    };
  });
};

/**
 * Load user's availability settings from database
 */
export const loadUserAvailabilitySettings = async (userId: string): Promise<UserAvailabilitySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_availability_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user availability settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in loadUserAvailabilitySettings:', error);
    return null;
  }
};

/**
 * Save user's availability settings to database
 */
export const saveUserAvailabilitySettings = async (
  userId: string,
  settings: Omit<UserAvailabilitySettings, 'id' | 'user_id'>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_availability_settings')
      .upsert({
        user_id: userId,
        ...settings,
      });

    if (error) {
      console.error('Error saving user availability settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveUserAvailabilitySettings:', error);
    return false;
  }
};

/**
 * Load user's vacation periods from database
 */
export const loadUserVacationPeriods = async (userId: string): Promise<UserVacationPeriod[]> => {
  try {
    const { data, error } = await supabase
      .from('user_vacation_periods')
      .select('*')
      .eq('user_id', userId)
      .order('start_date');

    if (error) {
      console.error('Error loading user vacation periods:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in loadUserVacationPeriods:', error);
    return [];
  }
};

/**
 * Save user's vacation periods to database
 */
export const saveUserVacationPeriods = async (
  userId: string,
  periods: UserVacationPeriod[]
): Promise<boolean> => {
  try {
    // Delete existing vacation periods for this user
    await supabase
      .from('user_vacation_periods')
      .delete()
      .eq('user_id', userId);

    // Insert new vacation periods
    if (periods.length > 0) {
      const vacationData = periods.map(period => ({
        user_id: userId,
        start_date: period.start_date,
        end_date: period.end_date,
      }));

      const { error } = await supabase
        .from('user_vacation_periods')
        .insert(vacationData);

      if (error) {
        console.error('Error saving user vacation periods:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveUserVacationPeriods:', error);
    return false;
  }
};

/**
 * Add a single vacation period for a user
 */
export const addUserVacationPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_vacation_periods')
      .insert({
        user_id: userId,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

    if (error) {
      console.error('Error adding user vacation period:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addUserVacationPeriod:', error);
    return false;
  }
};

/**
 * Remove a vacation period for a user
 */
export const removeUserVacationPeriod = async (
  userId: string,
  periodId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_vacation_periods')
      .delete()
      .eq('user_id', userId)
      .eq('id', periodId);

    if (error) {
      console.error('Error removing user vacation period:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeUserVacationPeriod:', error);
    return false;
  }
};
