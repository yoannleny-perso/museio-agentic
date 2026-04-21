import React, { useEffect, useRef, useState } from 'react';
import { Job } from '@/types';
import { format, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAvailabilityForCalendar } from '@/hooks/useAvailabilityForCalendar';

interface ScrollableTimePickerProps {
  startTime: string;
  endTime: string;
  onSelectTimeRange: (startTime: string, endTime: string, endDate?: Date) => void;
  onSelectDate?: (date: Date) => void;
  selectedDate: Date | null;
  artistJobs: Job[];
  variant?: 'standalone' | 'embedded';
  artistId?: string; // For checking availability constraints
}

const ScrollableTimePicker: React.FC<ScrollableTimePickerProps> = ({
  startTime,
  endTime,
  onSelectTimeRange,
  onSelectDate,
  selectedDate,
  artistJobs,
  variant = 'standalone',
  artistId
}) => {
  const timeGridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isDraggingStartHandle, setIsDraggingStartHandle] = useState(false);
  const [isDraggingEndHandle, setIsDraggingEndHandle] = useState(false);
  const [dragType, setDragType] = useState<'grid' | 'start-handle' | 'end-handle' | null>(null);
  const [inputStartTime, setInputStartTime] = useState(startTime);
  const [inputEndTime, setInputEndTime] = useState(endTime);
  const [isOvernightBooking, setIsOvernightBooking] = useState(false);
  
  // Get availability data for the artist
  const { getAvailableTimeSlots } = useAvailabilityForCalendar(artistId);

  useEffect(() => {
    console.log('[ScrollableTimePicker] Selected date changed:', selectedDate);
    console.log('[ScrollableTimePicker] Current start/end time:', startTime, endTime);
  }, [selectedDate, startTime, endTime]);

  // Sync input values with props and detect overnight booking
  useEffect(() => {
    setInputStartTime(startTime);
    setInputEndTime(endTime);
    
    if (startTime && endTime) {
      const isOvernight = endTime < startTime;
      setIsOvernightBooking(isOvernight);
    }
  }, [startTime, endTime]);

  const generateTimeSlots = () => {
    const slots = [];
    // Today's hours (0-23)
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        day: 'today',
        position: hour
      });
    }
    // Tomorrow's hours (0-6) for overnight bookings
    for (let hour = 0; hour < 7; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        day: 'tomorrow',
        position: 24 + hour
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getWeekDays = () => {
    if (!selectedDate) return [];
    
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const weekDays = getWeekDays();
  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const handleDateClick = (date: Date) => {
    console.log('[ScrollableTimePicker] Date clicked:', date);
    console.log('[ScrollableTimePicker] onSelectDate callback exists:', !!onSelectDate);
    
    if (onSelectDate) {
      onSelectDate(date);
      // Clear time selection when switching dates
      console.log('[ScrollableTimePicker] Clearing time selection for new date');
      onSelectTimeRange('', '');
    }
  };

  const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + (minutes / 60);
  };

  const positionToTime = (position: number): string => {
    // Handle overnight positions (24+ means next day)
    const actualHours = position >= 24 ? position - 24 : position;
    const hours = Math.floor(actualHours);
    const fractionalHour = actualHours - hours;
    
    // If very close to exact hour (within 0.05 = 3 minutes), snap to exact hour
    if (fractionalHour < 0.05 || fractionalHour > 0.95) {
      const snapHour = fractionalHour > 0.95 ? hours + 1 : hours;
      return `${snapHour.toString().padStart(2, '0')}:00`;
    }
    
    // Otherwise snap to 15-minute intervals: 0, 15, 30, 45
    const minutes = Math.round(fractionalHour * 4) * 15;
    // Handle case where minutes rounds to 60
    if (minutes === 60) {
      return `${(hours + 1).toString().padStart(2, '0')}:00`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getBookedRanges = () => {
    if (!selectedDate) {
      console.log('[ScrollableTimePicker] No selected date for booked ranges');
      return [];
    }
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    console.log('[ScrollableTimePicker] Getting booked ranges for date:', selectedDateStr);
    
    const jobsOnDate = artistJobs.filter(job => {
      if (job.date === selectedDateStr) return true;
      
      if (job.end_date) {
        const jobStartDate = new Date(job.date);
        const jobEndDate = new Date(job.end_date);
        const currentDate = new Date(selectedDateStr);
        return currentDate >= jobStartDate && currentDate <= jobEndDate;
      }
      
      return false;
    });

    console.log('[ScrollableTimePicker] Jobs found for date:', jobsOnDate.length);

    const ranges = jobsOnDate.map(job => ({
      start: timeToPosition(job.start_time),
      end: timeToPosition(job.end_time)
    }));

    ranges.sort((a, b) => a.start - b.start);

    const mergedRanges = [];
    for (const range of ranges) {
      const lastRange = mergedRanges[mergedRanges.length - 1];
      if (lastRange && range.start <= lastRange.end) {
        lastRange.end = Math.max(lastRange.end, range.end);
      } else {
        mergedRanges.push({ ...range });
      }
    }

    console.log('[ScrollableTimePicker] Final booked ranges:', mergedRanges);
    return mergedRanges;
  };

  const bookedRanges = getBookedRanges();

  // Get available time constraints from availability settings
  const getAvailabilityConstraints = () => {
    if (!selectedDate || !artistId) return null;
    
    return getAvailableTimeSlots(selectedDate);
  };

  const availabilityConstraints = getAvailabilityConstraints();
  const availabilityRanges = availabilityConstraints
    ? availabilityConstraints
        .map((slot) => ({
          start: timeToPosition(slot.start),
          end: timeToPosition(slot.end),
        }))
        .sort((left, right) => left.start - right.start)
    : null;

  // Check if a position is outside available hours
  const isPositionOutsideAvailability = (position: number): boolean => {
    if (!availabilityRanges) return false;
    if (availabilityRanges.length === 0) return true;

    return !availabilityRanges.some((range) => position >= range.start && position <= range.end);
  };

  // Combined collision detection - checks both bookings and availability
  const isPositionUnavailable = (position: number): boolean => {
    return bookedRanges.some(range => position >= range.start && position < range.end) ||
           isPositionOutsideAvailability(position);
  };

  // Calculate continuous unavailable time ranges for solid gray blocks
  const getUnavailableRanges = () => {
    if (!availabilityRanges) return [];
    if (availabilityRanges.length === 0) return [{ start: 0, end: 24 }];

    const ranges = [];
    let cursor = 0;

    for (const range of availabilityRanges) {
      if (range.start > cursor) {
        ranges.push({ start: cursor, end: range.start });
      }

      cursor = Math.max(cursor, range.end);
    }

    if (cursor < 24) {
      ranges.push({ start: cursor, end: 24 });
    }

    return ranges;
  };

  const unavailableRanges = getUnavailableRanges();

  // Simple collision detection helper functions (keeping for backward compatibility)
  const isPositionBooked = (position: number): boolean => {
    return bookedRanges.some(range => position >= range.start && position < range.end);
  };

  const findBoundaryBeforeUnavailableArea = (start: number, end: number): number => {
    // Check availability constraints first
    if (availabilityRanges && availabilityRanges.length > 0) {
      const containingRange = availabilityRanges.find(
        (range) => start >= range.start && start <= range.end
      );

      if (containingRange) {
        if (end > start && end > containingRange.end) {
          return containingRange.end;
        }

        if (end < start && end < containingRange.start) {
          return containingRange.start;
        }
      }
    }
    
    // Sort booked ranges by start time for easier processing
    const sortedRanges = [...bookedRanges].sort((a, b) => a.start - b.start);
    
    // If dragging forward (down), find the first booked range that would be hit
    if (end > start) {
      for (const range of sortedRanges) {
        if (range.start > start && range.start < end) {
          return range.start; // Stop just before the booked area
        }
      }
    } 
    // If dragging backward (up), find the last booked range that would be hit
    else {
      for (let i = sortedRanges.length - 1; i >= 0; i--) {
        const range = sortedRanges[i];
        if (range.end < start && range.end > end) {
          return range.end; // Stop just after the booked area
        }
      }
    }
    
    // No collision, but ensure the end position itself isn't unavailable
    if (isPositionUnavailable(end)) {
      // Find the nearest safe boundary
      if (end > start) {
        // Moving forward, find the start of the unavailable range we're hitting
        for (const range of sortedRanges) {
          if (end >= range.start && end <= range.end) {
            return range.start;
          }
        }
        // Check availability boundaries
        if (availabilityRanges && availabilityRanges.length > 0) {
          const containingRange = availabilityRanges.find(
            (range) => start >= range.start && start <= range.end
          );

          if (containingRange && end > containingRange.end) {
            return containingRange.end;
          }
        }
      } else {
        // Moving backward, find the end of the unavailable range we're hitting
        for (const range of sortedRanges) {
          if (end >= range.start && end <= range.end) {
            return range.end;
          }
        }
        // Check availability boundaries
        if (availabilityRanges && availabilityRanges.length > 0) {
          const containingRange = availabilityRanges.find(
            (range) => start >= range.start && start <= range.end
          );

          if (containingRange && end < containingRange.start) {
            return containingRange.start;
          }
        }
      }
    }
    
    return end;
  };

  const isTimeConflicted = (hour: number): boolean => {
    return isPositionUnavailable(hour);
  };

  const handleManualStartTimeChange = (value: string) => {
    setInputStartTime(value);
    if (value && inputEndTime && selectedDate) {
      const isOvernight = inputEndTime < value;
      setIsOvernightBooking(isOvernight);
      
      if (isOvernight) {
        // Overnight booking - end date is next day
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        onSelectTimeRange(value, inputEndTime, nextDay);
      } else {
        // Same day booking
        onSelectTimeRange(value, inputEndTime);
      }
    }
  };

  const handleManualEndTimeChange = (value: string) => {
    setInputEndTime(value);
    if (inputStartTime && value && selectedDate) {
      const isOvernight = value < inputStartTime;
      setIsOvernightBooking(isOvernight);
      
      if (isOvernight) {
        // Overnight booking - end date is next day
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        onSelectTimeRange(inputStartTime, value, nextDay);
      } else {
        // Same day booking
        onSelectTimeRange(inputStartTime, value);
      }
    }
  };

  const getMousePosition = (event: React.MouseEvent): number => {
    if (!timeGridRef.current) return 0;
    
    const rect = timeGridRef.current.getBoundingClientRect();
    const scrollTop = timeGridRef.current.scrollTop;
    const y = event.clientY - rect.top + scrollTop;
    const totalHeight = timeGridRef.current.scrollHeight;
    // Extended to 31 hours (24 + 7 next day hours)
    return Math.max(0, Math.min(31, (y / totalHeight) * 31));
  };

  const handleStartHandleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!startTime) return;
    
    console.log('[ScrollableTimePicker] Start handle mouse down');
    setIsDraggingStartHandle(true);
    setDragType('start-handle');
    setDragStart(timeToPosition(startTime));
    setDragEnd(timeToPosition(endTime));
  };

  const handleEndHandleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!endTime) return;
    
    console.log('[ScrollableTimePicker] End handle mouse down');
    setIsDraggingEndHandle(true);
    setDragType('end-handle');
    setDragStart(timeToPosition(startTime));
    setDragEnd(timeToPosition(endTime));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!timeGridRef.current) return;
    
    const position = getMousePosition(event);
    
    console.log('[ScrollableTimePicker] Grid mouse down at position:', position);
    
    // Check if the initial position is unavailable - completely prevent starting selection
    if (isPositionUnavailable(position)) {
      console.log('[ScrollableTimePicker] Cannot start selection in unavailable time');
      return; // Don't start dragging if clicking on unavailable time
    }
    
    setIsDragging(true);
    setDragType('grid');
    setDragStart(position);
    setDragEnd(position);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if ((!isDragging && !isDraggingStartHandle && !isDraggingEndHandle) || 
        !timeGridRef.current || dragStart === null) return;
    
    const rawPosition = getMousePosition(event);
    let finalPosition = rawPosition;
    
    if (dragType === 'start-handle') {
      // Dragging start handle - ensure it doesn't go past end time or into booked areas
      const currentEndPos = timeToPosition(endTime);
      const maxPosition = Math.min(currentEndPos - 0.25, rawPosition); // Keep minimum 15 min duration
      
      if (isPositionUnavailable(maxPosition)) {
        finalPosition = findBoundaryBeforeUnavailableArea(dragStart!, maxPosition);
      } else {
        finalPosition = maxPosition;
      }
      
      setDragStart(finalPosition);
    } else if (dragType === 'end-handle') {
      // Dragging end handle - ensure it doesn't go before start time or into booked areas
      const currentStartPos = timeToPosition(startTime);
      const minPosition = Math.max(currentStartPos + 0.25, rawPosition); // Keep minimum 15 min duration
      
      if (isPositionUnavailable(minPosition)) {
        finalPosition = findBoundaryBeforeUnavailableArea(dragEnd!, minPosition);
      } else {
        finalPosition = minPosition;
      }
      
      setDragEnd(finalPosition);
    } else {
      // Grid drag - original logic
      if (isPositionUnavailable(rawPosition)) {
        finalPosition = findBoundaryBeforeUnavailableArea(dragStart, rawPosition);
        console.log('[ScrollableTimePicker] Hit unavailable area, stopping at boundary:', finalPosition);
      }
      
      setDragEnd(finalPosition);
    }
  };

  const handleMouseUp = () => {
    if ((!isDragging && !isDraggingStartHandle && !isDraggingEndHandle) || 
        dragStart === null || dragEnd === null) return;
    
    if (dragType === 'start-handle') {
      // Handle dragging - update only start time
      const newStartTime = positionToTime(dragStart);
      const isOvernight = endTime < newStartTime;
      
      if (isOvernight && selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        console.log('[ScrollableTimePicker] Start handle drag complete (overnight):', newStartTime, endTime);
        onSelectTimeRange(newStartTime, endTime, nextDay);
      } else {
        console.log('[ScrollableTimePicker] Start handle drag complete:', newStartTime, endTime);
        onSelectTimeRange(newStartTime, endTime);
      }
    } else if (dragType === 'end-handle') {
      // Handle dragging - update only end time
      const newEndTime = positionToTime(dragEnd);
      const isOvernight = newEndTime < startTime;
      
      if (isOvernight && selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        console.log('[ScrollableTimePicker] End handle drag complete (overnight):', startTime, newEndTime);
        onSelectTimeRange(startTime, newEndTime, nextDay);
      } else {
        console.log('[ScrollableTimePicker] End handle drag complete:', startTime, newEndTime);
        onSelectTimeRange(startTime, newEndTime);
      }
    } else {
      // Grid dragging - improved logic for overnight detection
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      
      // Detect overnight based on raw positions (end >= 24 means next day)
      const isOvernightDrag = end >= 24;
      
      // Use positionToTime for consistent snapping
      const startTimeStr = positionToTime(start);
      const endTimeStr = positionToTime(end);
      
      // For minimum duration check, use position arithmetic
      const finalStart = start;
      let finalEnd = end;
      
      // Ensure minimum 15-minute selection (0.25 hours)
      if (finalEnd - finalStart < 0.25) {
        finalEnd = finalStart + 0.25;
      }
      
      // Convert final positions to time strings
      const finalStartTimeStr = positionToTime(finalStart);
      const finalEndTimeStr = positionToTime(finalEnd);
      
      // Final check - if our selection would overlap with unavailable time, cancel
      if (isPositionUnavailable(finalStart) || isPositionUnavailable(finalEnd - 0.01)) {
        console.log('[ScrollableTimePicker] Selection would conflict with unavailable time, cancelling');
        setIsDragging(false);
        setIsDraggingStartHandle(false);
        setIsDraggingEndHandle(false);
        setDragType(null);
        setDragStart(null);
        setDragEnd(null);
        return;
      }
      
      if (isOvernightDrag && selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        console.log('[ScrollableTimePicker] Overnight time selection:', finalStartTimeStr, '-', finalEndTimeStr, 'ending on', nextDay);
        onSelectTimeRange(finalStartTimeStr, finalEndTimeStr, nextDay);
      } else {
        console.log('[ScrollableTimePicker] Same-day time selection:', finalStartTimeStr, '-', finalEndTimeStr);
        onSelectTimeRange(finalStartTimeStr, finalEndTimeStr);
      }
    }
    
    // Reset all drag states
    setIsDragging(false);
    setIsDraggingStartHandle(false);
    setIsDraggingEndHandle(false);
    setDragType(null);
    setDragStart(null);
    setDragEnd(null);
  };

  const getSelectionStyle = () => {
    // Handle dragging states with real-time feedback
    if (isDraggingStartHandle && dragStart !== null && endTime) {
      const start = dragStart;
      let end = timeToPosition(endTime);
      
      // Handle overnight display during start handle drag
      if (endTime < positionToTime(dragStart)) {
        end = end + 24;
      }
      
      return {
        top: `${(start / 31) * 100}%`,
        height: `${((end - start) / 31) * 100}%`,
      };
    }
    
    if (isDraggingEndHandle && startTime && dragEnd !== null) {
      const start = timeToPosition(startTime);
      const end = dragEnd;
      
      return {
        top: `${(start / 31) * 100}%`,
        height: `${((end - start) / 31) * 100}%`,
      };
    }
    
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      return {
        top: `${(start / 31) * 100}%`,
        height: `${((end - start) / 31) * 100}%`,
      };
    }
    
    if (startTime && endTime) {
      const start = timeToPosition(startTime);
      let end = timeToPosition(endTime);
      
      // Handle overnight booking display
      if (isOvernightBooking) {
        end = end + 24; // Show end time in next day section
      }
      
      console.log('[ScrollableTimePicker] Rendering selection from props:', startTime, endTime, 'positions:', start, end, 'overnight:', isOvernightBooking);
      return {
        top: `${(start / 31) * 100}%`,
        height: `${((end - start) / 31) * 100}%`,
      };
    }
    
    return { top: '0%', height: '0%' };
  };

  const getBookedRangeStyle = (range: { start: number; end: number }) => {
    return {
      top: `${(range.start / 31) * 100}%`,
      height: `${((range.end - range.start) / 31) * 100}%`,
    };
  };

  const getUnavailableRangeStyle = (range: { start: number; end: number }) => {
    return {
      top: `${(range.start / 31) * 100}%`,
      height: `${((range.end - range.start) / 31) * 100}%`,
    };
  };

  const componentKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'no-date';

  const content = (
    <div key={componentKey} className="w-full">
      {/* Selected Date Display */}
      <div className="text-center mb-4">
        <div className="text-base font-normal whitespace-nowrap">
          {selectedDate ? format(selectedDate, 'PPPP') : 'Select a date first'}
        </div>
      </div>
      
      {/* Header */}
      <div className="text-sm text-gray-500 text-center mb-6">
        Select a time?
      </div>
      
      {/* Time Grid Container */}
      <div className="relative">
        <div
          ref={timeGridRef}
          className="relative h-80 border border-purple-200 rounded-lg bg-white cursor-crosshair select-none overflow-y-auto scroll-smooth"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#e5e7eb #f3f4f6'
          }}
        >
          {/* Inner container with extended height for overnight bookings */}
          <div className="relative h-[62rem]">
            {/* Time Labels and Grid Lines */}
            {timeSlots.map((slot, index) => {
              const hour = parseInt(slot.time.split(':')[0]);
              const isConflicted = isTimeConflicted(slot.position);
              const isDayBoundary = slot.day === 'tomorrow' && hour === 0;
              const isWithinUnavailableRange = unavailableRanges.some(range => 
                slot.position >= range.start && slot.position < range.end
              );
              
              // Calculate next day's date for display
              const nextDayText = selectedDate ? format(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), 'MMM d') : 'Next Day';
              
              return (
                <div key={`${slot.day}-${slot.time}`}>
                  {/* Day boundary separator */}
                  {isDayBoundary && (
                    <div
                      className="absolute left-0 right-0 bg-gradient-to-r from-gray-200 to-gray-300 h-8 flex items-center justify-center z-5"
                      style={{ top: `${(slot.position / 31) * 100}%` }}
                    >
                      <span className="text-gray-700 text-xs font-medium">
                        {nextDayText}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className="absolute left-0 right-0 flex items-start"
                    style={{ top: `${(slot.position / 31) * 100}%` }}
                  >
                    <div className={`w-12 text-xs pr-4 leading-none ${slot.day === 'tomorrow' ? 'text-gray-600' : 'text-gray-500'}`}>
                      {slot.time}
                    </div>
                    {/* Grid line - very light in unavailable areas */}
                    <div className={`flex-1 h-px mt-2 z-10 relative ${isWithinUnavailableRange ? 'bg-gray-100/20' : 'bg-gray-200/30'}`} />
                  </div>
                </div>
              );
            })}

            {/* Unavailable Time Ranges (solid gray blocks) */}
            {unavailableRanges.map((range, index) => (
              <div
                key={`unavailable-${index}`}
                className="absolute left-12 right-0 bg-muted opacity-80 pointer-events-none z-5"
                style={getUnavailableRangeStyle(range)}
              />
            ))}
            
            {/* Booked Time Ranges */}
            {bookedRanges.map((range, index) => (
              <div
                key={`booked-${index}`}
                className="absolute left-12 right-0 bg-gradient-to-r from-rose-200 to-rose-300 opacity-70 rounded-r-lg pointer-events-none flex items-center justify-center z-10"
                style={getBookedRangeStyle(range)}
              >
                <span className="text-rose-700 text-sm font-medium">
                  Booked
                </span>
              </div>
            ))}
            
            {/* Selection Range */}
            {(isDragging || (startTime && endTime)) && (
              <div
                className="absolute left-12 right-0 bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] opacity-80 rounded-r-lg pointer-events-none flex items-center justify-center z-20"
                style={getSelectionStyle()}
              >
                <span className="text-white text-sm font-medium">
                  Select times
                </span>
                
                {/* Drag Handles */}
                <div 
                  className="absolute -top-2 right-2 w-4 h-4 bg-white rounded-full border-2 border-[#8B5CF6] cursor-ns-resize pointer-events-auto hover:scale-110 transition-transform z-30" 
                  onMouseDown={handleStartHandleMouseDown}
                />
                <div 
                  className="absolute -bottom-2 right-2 w-4 h-4 bg-white rounded-full border-2 border-[#8B5CF6] cursor-ns-resize pointer-events-auto hover:scale-110 transition-transform z-30"
                  onMouseDown={handleEndHandleMouseDown}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Selection Display */}
        {startTime && endTime && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
              Selected: 
              <Input
                type="time"
                value={inputStartTime}
                onChange={(e) => handleManualStartTimeChange(e.target.value)}
                className="w-20 h-8 text-sm text-center text-[#8B5CF6] font-medium bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#8B5CF6] [&::-webkit-calendar-picker-indicator]:hidden px-2 flex items-center justify-center"
                style={{ textAlign: 'center', textAlignLast: 'center' }}
              />
              -
              <Input
                type="time"
                value={inputEndTime}
                onChange={(e) => handleManualEndTimeChange(e.target.value)}
                className="w-20 h-8 text-sm text-center text-[#8B5CF6] font-medium bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#8B5CF6] [&::-webkit-calendar-picker-indicator]:hidden px-2 flex items-center justify-center"
                style={{ textAlign: 'center', textAlignLast: 'center' }}
              />
            </div>
            {isOvernightBooking && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
                Overnight booking (ends next day)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'embedded') {
    return content;
  }

  return (
    <Card className="w-full bg-gradient-to-br from-[#F8F7FF] to-[rgba(255,255,255,0.85)] backdrop-blur-sm rounded-3xl px-3 pt-4 pb-3 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)]">
      {content}
    </Card>
  );
};

export default ScrollableTimePicker;
