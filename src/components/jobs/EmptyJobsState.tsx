
import React from 'react';
import { Calendar } from 'lucide-react';

interface EmptyJobsStateProps {
  title?: string;
  description?: string;
}

const EmptyJobsState: React.FC<EmptyJobsStateProps> = ({ 
  title = "No jobs found",
  description = "Jobs you create will appear here"
}) => {
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center mb-4">
        <Calendar className="h-12 w-12 text-gray-300" />
      </div>
      <p className="text-gray-500 mb-2">{title}</p>
      <p className="text-sm text-gray-400">
        {description}
      </p>
    </div>
  );
};

export default EmptyJobsState;
