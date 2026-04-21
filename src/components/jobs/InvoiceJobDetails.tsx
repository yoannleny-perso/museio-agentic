
import React from 'react';
import { format } from 'date-fns';
import { Job } from '@/types';
import { formatCurrency, formatTimeWithoutSeconds } from '@/lib/utils';
import { User, Clock, MapPin, Calendar, DollarSign, Hash, FileText, Mail } from 'lucide-react';

interface InvoiceJobDetailsProps {
  job: Job;
}

const InvoiceJobDetails: React.FC<InvoiceJobDetailsProps> = ({ job }) => {
  return (
    <div className="space-y-2 py-2">
      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <FileText size={14} className="text-gray-400" />
          Job:
        </span>
        <span className="text-right max-w-[65%] break-words">{job.title}</span>
      </div>
      
      {job.job_number && (
        <div className="flex justify-between">
          <span className="font-medium flex items-center gap-1.5">
            <Hash size={14} className="text-gray-400" />
            Job Number:
          </span>
          <span className="text-right max-w-[65%] break-words">{job.job_number}</span>
        </div>
      )}
      
      {job.job_description && (
        <div className="flex justify-between">
          <span className="font-medium flex items-center gap-1.5">
            <FileText size={14} className="text-gray-400" />
            Description:
          </span>
          <span className="text-right max-w-[65%] break-words">{job.job_description}</span>
        </div>
      )}
      
      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <Calendar size={14} className="text-gray-400" />
          Date:
        </span>
        <span>{format(new Date(job.date), 'MMM d, yyyy')}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <Clock size={14} className="text-gray-400" />
          Time:
        </span>
        <span className="text-gray-500">{formatTimeWithoutSeconds(job.start_time)} - {formatTimeWithoutSeconds(job.end_time)}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <MapPin size={14} className="text-gray-400" />
          Location:
        </span>
        <span className="text-right max-w-[65%] break-words">{job.location}</span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <User size={14} className="text-gray-400" />
          Client:
        </span>
        <span className="text-right max-w-[65%] break-words">{job.client}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <Mail size={14} className="text-gray-400" />
          Client Email:
        </span>
        <span className={`text-right max-w-[65%] break-words ${job.contact_email ? "" : "text-red-500"}`}>
          {job.contact_email || "Missing (required)"}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span className="font-medium flex items-center gap-1.5">
          <DollarSign size={14} className="text-gray-400" />
          Amount:
        </span>
        <span className="font-medium text-museio-purple">{formatCurrency(job.rate)}</span>
      </div>
    </div>
  );
};

export default InvoiceJobDetails;
