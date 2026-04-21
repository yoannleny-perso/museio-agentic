
import React from 'react';
import { formatCurrency, formatTimeWithoutSeconds } from '@/lib/utils';
import { Job } from '@/types';
import { User, Clock, MapPin } from 'lucide-react';

interface JobInfoDetailsProps {
  job: Job;
  className?: string;
}

const JobInfoDetails: React.FC<JobInfoDetailsProps> = ({ job, className = '' }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-gray-400 flex-shrink-0" />
        <div className="text-xs truncate text-gray-500">
          {formatTimeWithoutSeconds(job.start_time)} - {formatTimeWithoutSeconds(job.end_time)}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
        <div className="text-xs truncate text-gray-500">{job.location}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <User size={14} className="text-gray-400 flex-shrink-0" />
        <div className="text-xs truncate text-gray-500">
          {job.client}
        </div>
      </div>
    </div>
  );
};

export default JobInfoDetails;
