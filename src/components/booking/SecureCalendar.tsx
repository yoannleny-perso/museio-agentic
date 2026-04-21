import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';

interface SecureCalendarProps {
  artistId?: string;
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
  selectedEndDate?: Date;
  multiDaySelection?: boolean;
  variant?: 'standalone' | 'embedded';
}

const SecureCalendar: React.FC<SecureCalendarProps> = ({
  artistId,
  onSelectDate,
  selectedDate,
  selectedEndDate,
  multiDaySelection = false,
  variant = 'standalone',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { availability, loading, fetchAvailability } = useBookingAvailability(artistId);

  useEffect(() => {
    if (artistId) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      fetchAvailability(format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd'));
    }
  }, [artistId, currentMonth, fetchAvailability]);

  useEffect(() => {
    if (selectedDate && !isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate, currentMonth]);

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const blanks = Array(startDay).fill(null);

  const dateAvailabilityMap = useMemo(() => {
    const map: Record<string, (typeof availability)[0]> = {};
    availability.forEach((item) => {
      map[item.date] = item;
    });
    return map;
  }, [availability]);

  const isPastDate = (date: Date): boolean => isBefore(date, today);

  const isUnavailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateAvailability = dateAvailabilityMap[dateStr];
    return (
      isPastDate(date) ||
      !dateAvailability?.available_slots ||
      dateAvailability.available_slots.length === 0
    );
  };

  const isDateInRange = (date: Date): boolean =>
    selectedDate && selectedEndDate ? date >= selectedDate && date <= selectedEndDate : false;

  const isDateSelected = (date: Date): boolean =>
    selectedDate ? (multiDaySelection && selectedEndDate ? isDateInRange(date) : isSameDay(date, selectedDate)) : false;

  const isRangeStart = (date: Date): boolean => selectedDate ? isSameDay(date, selectedDate) : false;
  const isRangeEnd = (date: Date): boolean => selectedEndDate ? isSameDay(date, selectedEndDate) : false;

  const handleDateClick = (date: Date) => {
    if (isUnavailable(date)) return;
    onSelectDate(date);
  };

  const getDateClasses = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isCurrentDay = isToday(date);
    const inRange = isDateInRange(date);
    const rangeStart = isRangeStart(date);
    const rangeEnd = isRangeEnd(date);
    const isSelected = isDateSelected(date);
    const isDisabled = isUnavailable(date);

    return cn(
      'relative w-10 h-10 flex items-center justify-center text-sm transition-all duration-200 cursor-pointer overflow-hidden',
      {
        'text-gray-300 cursor-not-allowed opacity-50': isDisabled,
        'text-gray-900': !isDisabled && isCurrentMonth,
        'text-gray-400': !isDisabled && !isCurrentMonth,
        'font-bold': isCurrentDay && !isDisabled,

        // Selection styling
        'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg': isSelected && !inRange,
        'bg-gradient-to-br from-purple-400 to-purple-500 text-white': inRange && !rangeStart && !rangeEnd,
        'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg': rangeStart || rangeEnd,

        'rounded-l-lg': multiDaySelection && rangeStart && selectedEndDate,
        'rounded-r-lg': multiDaySelection && rangeEnd && selectedDate,
        'rounded-lg': !multiDaySelection || (!rangeStart && !rangeEnd) || (rangeStart && !selectedEndDate),

        'hover:shadow-md hover:scale-105': !isDisabled,
      }
    );
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), today)) {
      setCurrentMonth(prev);
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-white/60 rounded-lg transition-colors" disabled={loading}>
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-white/60 rounded-lg transition-colors" disabled={loading}>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading availability...</p>
        </div>
      ) : (
        <>
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((_, index) => (
              <div key={`blank-${index}`} />
            ))}
            {days.map((day) => (
              <div
                key={day.toString()}
                className={getDateClasses(day)}
                onClick={() => handleDateClick(day)}
                aria-label={`Date ${format(day, 'MMMM d, yyyy')}`}
                role="button"
                tabIndex={0}
              >
                {format(day, 'd')}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  if (variant === 'embedded') {
    return content;
  }

  return (
    <div className="rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(135deg,#FCFBFF,rgba(255,255,255,0.96))] p-6 shadow-xl">
      {content}
    </div>
  );
};

export default SecureCalendar;
