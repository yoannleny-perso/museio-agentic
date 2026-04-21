
import React from 'react';
import { Job } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { getJobDisplayPrice } from '@/utils/jobPricing';

interface PastJobDetailsContentProps {
  job: Job;
}

const PastJobDetailsContent: React.FC<PastJobDetailsContentProps> = ({ job }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="border-0">
      <CardContent className="p-0 space-y-4">
        {/* Job Details Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-museio-purple">Job Details</h2>
          
          <div className="space-y-3">
        {/* Title */}
            <div>
          <h3 className="font-medium mb-0.5">Title</h3>
          <p className="text-sm text-muted-foreground">{job.title}</p>
        </div>
        
        {/* Job Number - Only render if exists */}
        {job.job_number && (
              <div>
            <h3 className="font-medium mb-0.5">Job Number</h3>
            <p className="text-sm text-muted-foreground">{job.job_number}</p>
          </div>
        )}
        
        {/* Job Description - Only render if exists */}
        {job.job_description && (
              <div>
            <h3 className="font-medium mb-0.5">Job Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.job_description}</p>
          </div>
        )}
        
        {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h3 className="font-medium mb-0.5">Date</h3>
            <p className="text-sm text-muted-foreground">{formatDate(job.date)}</p>
            {job.end_date && job.end_date !== job.date && (
              <div className="mt-1">
                <span className="text-xs text-muted-foreground">to</span>
                <p className="text-sm text-muted-foreground">{formatDate(job.end_date)}</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-0.5">Time</h3>
            <p className="text-sm text-muted-foreground">
              {job.start_time} - {job.end_time}
            </p>
          </div>
        </div>
        
        {/* Rate */}
            <div>
          <h3 className="font-medium mb-0.5">Rate</h3>
          <p className="text-sm text-muted-foreground">{formatCurrency(getJobDisplayPrice(job))}</p>
        </div>
        
            {/* Notes - Only render if exists */}
            {job.notes && (
              <div>
                <h3 className="font-medium mb-0.5">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Separator between sections */}
        <Separator />

        {/* Client Information Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-museio-purple">Client Information</h2>
          
          <div className="space-y-3">
            {/* Client Name */}
            <div>
              <h3 className="font-medium mb-0.5">Client</h3>
              <p className="text-sm text-muted-foreground">{job.client}</p>
            </div>
            
            {/* Contact Name - Only render if exists */}
            {job.contact_name && (
              <div>
                <h3 className="font-medium mb-0.5">Contact Name</h3>
                <p className="text-sm text-muted-foreground">{job.contact_name}</p>
              </div>
            )}
            
            {/* Email - Only render if exists */}
            {job.contact_email && (
              <div>
                <h3 className="font-medium mb-0.5">Email</h3>
                <p className="text-sm text-muted-foreground">{job.contact_email}</p>
              </div>
            )}
            
            {/* Location */}
            <div>
              <h3 className="font-medium mb-0.5">Location</h3>
              <p className="text-sm text-muted-foreground">{job.location}</p>
            </div>
            
            {/* Phone - Only render if exists */}
            {job.contact_phone && (
              <div>
                <h3 className="font-medium mb-0.5">Phone</h3>
                <p className="text-sm text-muted-foreground">{job.contact_phone}</p>
              </div>
            )}
          </div>
          </div>
      </CardContent>
    </Card>
  );
};

export default PastJobDetailsContent;
