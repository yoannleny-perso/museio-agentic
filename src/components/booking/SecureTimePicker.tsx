import React, { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { CalendarClock, Clock3, MoonStar, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';

interface SecureTimePickerProps {
  startTime: string;
  endTime: string;
  onSelectTimeRange: (startTime: string, endTime: string, endDate?: Date) => void;
  selectedDate: Date | null;
  artistId?: string;
  variant?: 'standalone' | 'embedded';
}

interface AvailabilityWindow {
  id: string;
  start: number;
  end: number;
  crossesMidnight: boolean;
  title: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

const HALF_HOUR = 0.5;
const DEFAULT_DURATION = 1;

const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
};

const positionToTime = (position: number): string => {
  const normalized = ((position % 24) + 24) % 24;
  const hours = Math.floor(normalized);
  const minutes = Math.round((normalized - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatClockLabel = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  return format(new Date(2026, 0, 1, hours, minutes), 'h:mm a');
};

const formatPositionLabel = (position: number): string => {
  const label = formatClockLabel(positionToTime(position));
  return position >= 24 ? `${label} next day` : label;
};

const formatDurationLabel = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!wholeHours) {
    return `${minutes} min`;
  }

  if (!minutes) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
};

const buildMergedWindows = (
  currentDaySlots: TimeSlot[],
  nextDaySlots: TimeSlot[]
): AvailabilityWindow[] => {
  const rawRanges = [
    ...currentDaySlots.map((slot) => ({
      start: timeToPosition(slot.start),
      end: timeToPosition(slot.end),
    })),
    ...nextDaySlots.map((slot) => ({
      start: timeToPosition(slot.start) + 24,
      end: timeToPosition(slot.end) + 24,
    })),
  ]
    .filter((slot) => slot.end > slot.start)
    .sort((left, right) => left.start - right.start);

  const merged = rawRanges.reduce<Array<{ start: number; end: number }>>((acc, range) => {
    const lastRange = acc[acc.length - 1];
    if (!lastRange || range.start > lastRange.end) {
      acc.push({ ...range });
      return acc;
    }

    lastRange.end = Math.max(lastRange.end, range.end);
    return acc;
  }, []);

  return merged
    .filter((range) => range.start < 24 && range.end - range.start >= HALF_HOUR)
    .map((range, index) => ({
      id: `window-${index}`,
      start: range.start,
      end: range.end,
      crossesMidnight: range.end > 24,
      title:
        range.start < 12
          ? 'Morning availability'
          : range.start < 17
            ? 'Afternoon availability'
            : range.start < 22
              ? 'Evening availability'
              : 'Late-night availability',
    }));
};

const getSelectionRangePositions = (
  rangeStart: string,
  rangeEnd: string
): { start: number; end: number } | null => {
  if (!rangeStart || !rangeEnd) {
    return null;
  }

  const start = timeToPosition(rangeStart);
  let end = timeToPosition(rangeEnd);

  if (end <= start) {
    end += 24;
  }

  return { start, end };
};

const buildHalfHourPositions = (start: number, end: number): number[] => {
  const positions: number[] = [];

  for (let value = start; value <= end + 0.0001; value += HALF_HOUR) {
    positions.push(Number(value.toFixed(2)));
  }

  return positions;
};

const SecureTimePicker: React.FC<SecureTimePickerProps> = ({
  startTime,
  endTime,
  onSelectTimeRange,
  selectedDate,
  artistId,
  variant = 'standalone',
}) => {
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const { getAvailableSlots, fetchAvailability, loading } = useBookingAvailability(artistId);

  useEffect(() => {
    if (!selectedDate || !artistId) {
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const nextDayStr = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    void fetchAvailability(dateStr, nextDayStr);
  }, [artistId, fetchAvailability, selectedDate]);

  const availabilityWindows = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    const currentDate = format(selectedDate, 'yyyy-MM-dd');
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');

    return buildMergedWindows(getAvailableSlots(currentDate), getAvailableSlots(nextDate));
  }, [getAvailableSlots, selectedDate]);

  const selectedRange = useMemo(
    () => getSelectionRangePositions(startTime, endTime),
    [endTime, startTime]
  );

  useEffect(() => {
    if (!availabilityWindows.length) {
      setSelectedWindowId(null);
      return;
    }

    const matchingWindow = selectedRange
      ? availabilityWindows.find(
          (window) =>
            selectedRange.start >= window.start && selectedRange.end <= window.end
        )
      : null;

    if (matchingWindow) {
      setSelectedWindowId(matchingWindow.id);
      return;
    }

    setSelectedWindowId((currentValue) => {
      if (currentValue && availabilityWindows.some((window) => window.id === currentValue)) {
        return currentValue;
      }

      return availabilityWindows[0].id;
    });
  }, [availabilityWindows, selectedRange]);

  const selectedWindow =
    availabilityWindows.find((window) => window.id === selectedWindowId) || availabilityWindows[0];

  const selectedStartPosition =
    selectedWindow && selectedRange && selectedRange.start >= selectedWindow.start && selectedRange.start < selectedWindow.end
      ? selectedRange.start
      : null;

  const startOptions = useMemo(() => {
    if (!selectedWindow) {
      return [];
    }

    return buildHalfHourPositions(
      selectedWindow.start,
      selectedWindow.end - HALF_HOUR
    );
  }, [selectedWindow]);

  const endOptions = useMemo(() => {
    if (!selectedWindow || selectedStartPosition === null) {
      return [];
    }

    return buildHalfHourPositions(
      selectedStartPosition + HALF_HOUR,
      selectedWindow.end
    );
  }, [selectedStartPosition, selectedWindow]);

  const applySelection = (startPosition: number, endPosition: number) => {
    if (!selectedDate) {
      return;
    }

    onSelectTimeRange(
      positionToTime(startPosition),
      positionToTime(endPosition),
      endPosition >= 24 ? addDays(selectedDate, 1) : undefined
    );
  };

  const handleWindowSelection = (window: AvailabilityWindow) => {
    setSelectedWindowId(window.id);

    if (
      selectedRange &&
      (selectedRange.start < window.start || selectedRange.end > window.end)
    ) {
      onSelectTimeRange('', '');
    }
  };

  const handleStartSelection = (startPosition: number) => {
    if (!selectedWindow) {
      return;
    }

    const preservedEnd =
      selectedRange &&
      selectedRange.start >= selectedWindow.start &&
      selectedRange.end <= selectedWindow.end &&
      selectedRange.end > startPosition
        ? selectedRange.end
        : null;

    const fallbackEnd = Math.min(
      selectedWindow.end,
      startPosition + DEFAULT_DURATION <= selectedWindow.end
        ? startPosition + DEFAULT_DURATION
        : startPosition + HALF_HOUR
    );

    applySelection(startPosition, preservedEnd ?? fallbackEnd);
  };

  const emptyState = (
    <div className="rounded-[28px] border border-dashed border-[#D9D6EA] bg-white/75 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3EEFF] text-[#7A42E8]">
        <CalendarClock className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-[#1F2430]">No booking times on this date</h3>
      <p className="mt-2 text-sm text-[#6B7280]">
        Try another date to see the artist&apos;s available time windows.
      </p>
    </div>
  );

  const content = (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F3EEFF] px-4 py-2 text-sm font-medium text-[#7A42E8]">
          <Clock3 className="h-4 w-4" />
          {selectedDate ? format(selectedDate, 'PPPP') : 'Select a date'}
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[#1F2430]">Pick a time that works</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Choose an available window, then set when the booking should start and end.
        </p>
      </div>

      {!availabilityWindows.length ? (
        emptyState
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#8F94A3]">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
              Available windows
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {availabilityWindows.map((window) => {
                const isActive = selectedWindow?.id === window.id;
                const duration = formatDurationLabel(window.end - window.start);

                return (
                  <button
                    key={window.id}
                    type="button"
                    onClick={() => handleWindowSelection(window)}
                    className={`rounded-[24px] border p-4 text-left transition-all ${
                      isActive
                        ? 'border-[#8B5CF6] bg-[#F6F2FF] shadow-[0_20px_40px_rgba(123,66,232,0.12)]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#CBBEF8] hover:bg-[#FBFAFF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-[#1F2430]">{window.title}</div>
                        <div className="mt-1 text-sm text-[#6B7280]">
                          {formatPositionLabel(window.start)} to {formatPositionLabel(window.end)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-[#EEE8FF] px-3 py-1 text-xs font-semibold text-[#7A42E8]">
                          {duration}
                        </span>
                        {window.crossesMidnight && (
                          <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]">
                            Overnight
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedWindow && (
            <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8F94A3]">
                      Start time
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Choose when the booking should begin.
                    </p>
                  </div>
                  {selectedWindow.crossesMidnight ? (
                    <MoonStar className="h-5 w-5 text-[#7A42E8]" />
                  ) : selectedWindow.start < 12 ? (
                    <Sunrise className="h-5 w-5 text-[#F59E0B]" />
                  ) : (
                    <Sunset className="h-5 w-5 text-[#F97316]" />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {startOptions.map((position) => {
                    const isSelected = selectedStartPosition === position;
                    return (
                      <button
                        key={`start-${position}`}
                        type="button"
                        onClick={() => handleStartSelection(position)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-[#7A42E8] text-white shadow-lg'
                            : 'bg-[#F8F9FB] text-[#374151] hover:bg-[#EEE8FF] hover:text-[#7A42E8]'
                        }`}
                      >
                        {formatPositionLabel(position)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8F94A3]">
                  End time
                </div>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Pick when the set should wrap up.
                </p>

                {selectedStartPosition === null ? (
                  <div className="mt-6 rounded-2xl bg-[#F8F9FB] px-4 py-6 text-center text-sm text-[#6B7280]">
                    Select a start time first to unlock the valid end times.
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {endOptions.map((position) => {
                      const isSelected = selectedRange?.end === position;
                      return (
                        <button
                          key={`end-${position}`}
                          type="button"
                          onClick={() => applySelection(selectedStartPosition, position)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#1F2430] text-white shadow-lg'
                              : 'bg-[#F8F9FB] text-[#374151] hover:bg-[#EEF2FF] hover:text-[#4F46E5]'
                          }`}
                        >
                          {formatPositionLabel(position)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {selectedRange && (
            <section className="rounded-[28px] border border-[#D9D6EA] bg-[linear-gradient(135deg,rgba(246,242,255,0.95),rgba(255,255,255,0.95))] p-5 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8F94A3]">
                Selected booking
              </div>
              <div className="mt-3 flex flex-col gap-2 text-[#1F2430] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xl font-semibold">
                    {formatClockLabel(startTime)} to {formatClockLabel(endTime)}
                  </div>
                  <div className="mt-1 text-sm text-[#6B7280]">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : ''}
                    {selectedRange.end >= 24 && ' · ends next day'}
                  </div>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7A42E8] shadow-sm">
                  {formatDurationLabel(selectedRange.end - selectedRange.start)}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {loading && (
        <div className="text-center text-sm text-[#7A42E8]">Refreshing availability…</div>
      )}
    </div>
  );

  if (variant === 'embedded') {
    return content;
  }

  return (
    <Card className="rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(135deg,#FCFBFF,rgba(255,255,255,0.96))] p-5 shadow-xl">
      {content}
    </Card>
  );
};

export default SecureTimePicker;
