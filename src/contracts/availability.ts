export interface AvailabilityTimeSlot {
  start: string;
  end: string;
}

export interface AvailabilityBlockingRange extends AvailabilityTimeSlot {
  date: string;
  end_date?: string | null;
}

export interface AvailabilitySettingsConfig {
  buffer_time_minutes: number;
  min_notice_hours: number;
  enable_breaks: boolean;
  break_duration_minutes: number;
}

const DAY_START_TIME = '00:00:00';
const DAY_END_TIME = '24:00:00';

export const normalizeAvailabilityTime = (timeStr: string) => {
  const [hours = '00', minutes = '00', seconds = '00'] = timeStr.split(':');
  return `${String(Number(hours)).padStart(2, '0')}:${String(
    Number(minutes)
  ).padStart(2, '0')}:${String(Number(seconds)).padStart(2, '0')}`;
};

export const doesDateOverlapAvailabilityRange = (
  dateString: string,
  booking: Pick<AvailabilityBlockingRange, 'date' | 'end_date'>
) => {
  if (booking.date === dateString) {
    return true;
  }

  if (!booking.end_date) {
    return false;
  }

  return dateString >= booking.date && dateString <= booking.end_date;
};

export const getTimeDifferenceMinutes = (
  startTime: string,
  endTime: string
): number => {
  const [startHours, startMinutes] = normalizeAvailabilityTime(startTime)
    .split(':')
    .map(Number);
  const [endHours, endMinutes] = normalizeAvailabilityTime(endTime)
    .split(':')
    .map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return endTotalMinutes - startTotalMinutes;
};

const normalizeTime = (totalMinutes: number) => {
  const normalizedTotal = Math.max(totalMinutes, 0);
  const hours = Math.floor(normalizedTotal / 60);
  const minutes = normalizedTotal % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

export const addMinutesToTime = (timeStr: string, minutes: number) => {
  const [hours, mins] = normalizeAvailabilityTime(timeStr).split(':').map(Number);
  return normalizeTime(hours * 60 + mins + minutes);
};

export const subtractMinutesFromTime = (timeStr: string, minutes: number) => {
  const [hours, mins] = normalizeAvailabilityTime(timeStr).split(':').map(Number);
  return normalizeTime(hours * 60 + mins - minutes);
};

export const getBlockedTimesForDate = (
  dateString: string,
  blockingRange: AvailabilityBlockingRange
): AvailabilityTimeSlot[] => {
  if (!doesDateOverlapAvailabilityRange(dateString, blockingRange)) {
    return [];
  }

  const startDate = blockingRange.date;
  const endDate = blockingRange.end_date || blockingRange.date;
  const startTime = normalizeAvailabilityTime(blockingRange.start);
  const endTime = normalizeAvailabilityTime(blockingRange.end);

  if (startDate === endDate) {
    return [{ start: startTime, end: endTime }];
  }

  if (dateString === startDate) {
    return [{ start: startTime, end: DAY_END_TIME }];
  }

  if (dateString === endDate) {
    return [{ start: DAY_START_TIME, end: endTime }];
  }

  return [{ start: DAY_START_TIME, end: DAY_END_TIME }];
};

const buildDateTime = (dateString: string, timeString: string) =>
  new Date(`${dateString}T${normalizeAvailabilityTime(timeString)}`);

export const filterSlotsByMinimumNotice = (
  dateString: string,
  slots: AvailabilityTimeSlot[],
  minNoticeHours: number,
  now: Date = new Date()
) => {
  const minNoticeThreshold = new Date(
    now.getTime() + minNoticeHours * 60 * 60 * 1000
  );

  return slots.filter((slot) => buildDateTime(dateString, slot.start) >= minNoticeThreshold);
};

export const calculateAvailableSlots = (
  availableStart: string,
  availableEnd: string,
  blockedTimes: AvailabilityTimeSlot[],
  settings: AvailabilitySettingsConfig
): AvailabilityTimeSlot[] => {
  const slots: AvailabilityTimeSlot[] = [];

  const bufferedBlockedTimes = blockedTimes
    .filter((blocked) => blocked.start && blocked.end)
    .map((blocked) => ({
      start: subtractMinutesFromTime(blocked.start, settings.buffer_time_minutes),
      end: addMinutesToTime(blocked.end, settings.buffer_time_minutes),
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  let currentStart = availableStart;

  for (const blocked of bufferedBlockedTimes) {
    if (currentStart < blocked.start) {
      let slotEnd = blocked.start;

      if (settings.enable_breaks) {
        const slotDurationMinutes = getTimeDifferenceMinutes(currentStart, slotEnd);
        if (slotDurationMinutes > settings.break_duration_minutes) {
          slotEnd = subtractMinutesFromTime(
            slotEnd,
            settings.break_duration_minutes
          );
        }
      }

      if (currentStart < slotEnd) {
        slots.push({
          start: currentStart,
          end: slotEnd,
        });
      }
    }

    currentStart = blocked.end > currentStart ? blocked.end : currentStart;
  }

  if (currentStart < availableEnd) {
    let slotEnd = availableEnd;

    if (settings.enable_breaks) {
      const slotDurationMinutes = getTimeDifferenceMinutes(currentStart, slotEnd);
      if (slotDurationMinutes > settings.break_duration_minutes) {
        slotEnd = subtractMinutesFromTime(
          slotEnd,
          settings.break_duration_minutes
        );
      }
    }

    if (currentStart < slotEnd) {
      slots.push({
        start: currentStart,
        end: slotEnd,
      });
    }
  }

  return slots;
};

export const mergeAvailabilitySlots = (slots: AvailabilityTimeSlot[]) => {
  const sortedSlots = [...slots].sort((left, right) => left.start.localeCompare(right.start));

  return sortedSlots.reduce<AvailabilityTimeSlot[]>((mergedSlots, slot) => {
    const previousSlot = mergedSlots[mergedSlots.length - 1];

    if (!previousSlot) {
      mergedSlots.push({ ...slot });
      return mergedSlots;
    }

    if (slot.start <= previousSlot.end) {
      previousSlot.end = previousSlot.end > slot.end ? previousSlot.end : slot.end;
      return mergedSlots;
    }

    mergedSlots.push({ ...slot });
    return mergedSlots;
  }, []);
};

export const calculateAvailableSlotsForRanges = (
  availableRanges: AvailabilityTimeSlot[],
  blockedTimes: AvailabilityTimeSlot[],
  settings: AvailabilitySettingsConfig
) =>
  mergeAvailabilitySlots(
    availableRanges.flatMap((range) =>
      calculateAvailableSlots(range.start, range.end, blockedTimes, settings)
    )
  );
