
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateDisplayProps {
  selectedDate: Date;
  jobsCount: number;
  className?: string;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ selectedDate, jobsCount, className }) => {
  const formattedDate = format(selectedDate, 'EEEE, MMMM d');
  
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200">{formattedDate}</h2>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {jobsCount} {jobsCount === 1 ? 'job' : 'jobs'}
      </span>
    </div>
  );
};

export default DateDisplay;
