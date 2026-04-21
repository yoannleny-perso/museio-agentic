
import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, getDay, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Job, JobStatus } from '@/types';
import { isJobLive } from '@/utils/jobStatusUpdater';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
  jobs?: Job[];
}

const Calendar: React.FC<CalendarProps> = ({ onSelectDate, selectedDate = new Date(), jobs = [] }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  
  // Generate weekday labels
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Check if a date is in the past (before today)
  const isPastDate = (date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, today);
  };
  
  // Get job status for a specific date with priority logic
  const getJobStatusForDate = (date: Date): JobStatus | 'live' | null => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());
    const isDateInPast = isBefore(date, today);
    
    // Find all jobs for this date (including multi-day events)
    const jobsForDate = jobs.filter(job => {
      // Check for exact date match
      if (job.date === formattedDate) {
        return true;
      }
      
      // Check multi-day events
      if (job.end_date) {
        const jobStartDate = new Date(job.date);
        const jobEndDate = new Date(job.end_date);
        const currentDate = new Date(formattedDate);
        
        return currentDate >= jobStartDate && currentDate <= jobEndDate;
      }
      
      return false;
    });
    
    if (jobsForDate.length === 0) return null;
    
    // Check for live jobs first, but only for today and future dates
    if (!isDateInPast) {
      // Priority 1: Check if any job is currently live (ongoing)
      if (jobsForDate.some(job => isJobLive(job))) {
        return 'live';
      }
    }
    
    // Apply priority logic based on whether the date is in the past or future
    if (isDateInPast) {
      // Past date priority: past > invoice-sent > paid > drafted
      if (jobsForDate.some(job => job.status === 'past')) {
        return 'past';
      } else if (jobsForDate.some(job => job.status === 'invoice-sent')) {
        return 'invoice-sent';
      } else if (jobsForDate.some(job => job.status === 'paid')) {
        return 'paid';
      } else if (jobsForDate.some(job => job.status === 'drafted')) {
        return 'drafted';
      }
    } else {
      // Future date priority: upcoming > drafted
      if (jobsForDate.some(job => job.status === 'upcoming')) {
        return 'upcoming';
      } else if (jobsForDate.some(job => job.status === 'drafted')) {
        return 'drafted';
      }
    }
    
    // Fallback: return the status of the first job
    return jobsForDate[0].status;
  };
  
  // Get color class for dot based on job status - Updated with more vibrant colors
  const getDotColorClass = (status: JobStatus | 'live' | null, isPast: boolean): string => {
    if (!status) return '';
    
    switch (status) {
      case 'live':
        return 'bg-[#ea384c]'; // Red for live jobs
      case 'past':
        return 'bg-amber-400'; // More vibrant yellow (#FBBF24)
      case 'invoice-sent':
        return 'bg-[#9b87f5]'; // Purple
      case 'paid':
        return 'bg-[#047857]'; // Darker green (#047857) - previously emerald-400 (#34D399)
      case 'drafted':
        return 'bg-[#8E9196]'; // Gray
      case 'upcoming':
        return 'bg-[#0070BA]'; // Darker blue (previously #33C3F0)
      default:
        return isPast ? 'bg-gray-400' : 'bg-[#8E9196]';
    }
  };
  
  // Fill in blank spaces at the beginning of the month
  const startDay = startOfMonth(currentMonth).getDay();
  const blanks = Array(startDay).fill(null);
  
  return (
    <div className="bg-gradient-to-br from-[#F8F7FF] to-[rgba(255,255,255,0.85)] backdrop-blur-sm rounded-3xl px-6 pt-6 pb-3 mb-6 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="p-1 bg-transparent">
          <ChevronLeft className="h-5 w-5 " />
        </button>
        <h2 className="text-xl font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={nextMonth} className="p-1 bg-transparent">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {blanks.map((_, index) => (
          <div key={`blank-${index}`}></div>
        ))}
        
        {days.map((day) => {
          const formatted = format(day, 'yyyy-MM-dd');
          const jobStatus = getJobStatusForDate(day);
          const dayToday = isToday(day);
          const isPast = isPastDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <button
              key={formatted}
              onClick={() => onSelectDate(day)}
              className="flex flex-col items-center h-12 justify-center bg-transparent"
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full w-10 h-10 text-sm transition-all duration-200',
                  isSelected && 'bg-gradient-to-br from-[#8B5CF6] to-[#6E59A5] text-white shadow-md transform scale-105',
                  !isSelected && dayToday && 'border-2 border-[#9b87f5]', // Purple border instead of background
                  !isSelected && !dayToday && 'hover:bg-gray-100',
                  !isSameMonth(day, currentMonth) && 'text-gray-300',
                  isPast && !isSelected && !dayToday && 'text-gray-400' // Dim past dates with light grey
                )}
              >
                {format(day, 'd')}
              </div>
              
              {/* Status indicator dot - using a fixed height container */}
              <div className="h-1.5 mt-1">
                {jobStatus && (
                  <div className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    getDotColorClass(jobStatus, isPast),
                    jobStatus === 'live' && 'animate-pulse' // Add animate-pulse class for live jobs
                  )}></div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
