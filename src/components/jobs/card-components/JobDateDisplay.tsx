
import React from 'react';
import { format } from 'date-fns';

interface JobDateDisplayProps {
  date: string;
}

const JobDateDisplay: React.FC<JobDateDisplayProps> = ({ date }) => {
  const jobDate = new Date(date);
  const dayOfWeek = format(jobDate, 'EEE');
  const dayOfMonth = format(jobDate, 'd');
  const month = format(jobDate, 'MMM');
  
  return (
    <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-center">
      <div className="text-xs font-medium text-gray-600">{dayOfWeek}</div>
      <div className="text-lg font-bold leading-none mt-1">{dayOfMonth}</div>
      <div className="text-xs font-medium text-gray-600">{month}</div>
    </div>
  );
};

export default JobDateDisplay;
