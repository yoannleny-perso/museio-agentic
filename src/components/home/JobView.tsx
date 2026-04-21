
import React from 'react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Job } from '@/types';
import { formatTimeWithoutSeconds } from '@/lib/utils';
import { getJobDisplayPrice } from '@/utils/jobPricing';

interface JobViewProps {
  job: Job;
}

const JobView: React.FC<JobViewProps> = ({ job }) => {
  // Check if it's a multi-day job
  const isMultiDay = job.end_date && job.date !== job.end_date;

  // Use client data from relationship if available, fallback to text field
  const clientName = job.client_data?.venue_name || job.client;
  const contactName = job.contact_name || job.client_data?.contact_name;
  const contactEmail = job.contact_email || job.client_data?.email_address;
  const contactPhone = job.contact_phone || job.client_data?.phone;
  const jobLocation = job.location || job.client_data?.location;

  return (
    <div className="space-y-3">
      <div>
        <span className="font-semibold">Title:</span> {job.title}
      </div>
      <div>
        <span className="font-semibold">Client:</span> {clientName}
      </div>
      {contactName && (
        <div>
          <span className="font-semibold">Contact:</span> {contactName}
        </div>
      )}
      <div>
        <span className="font-semibold">Date:</span> {isMultiDay 
          ? `${format(new Date(job.date), 'PPP')} to ${format(new Date(job.end_date || job.date), 'PPP')}`
          : format(new Date(job.date), 'PPP')
        }
      </div>
      <div>
        <span className="font-semibold">Time:</span> {formatTimeWithoutSeconds(job.start_time)} - {formatTimeWithoutSeconds(job.end_time)}
      </div>
      <div>
        <span className="font-semibold">Location:</span> {jobLocation}
      </div>
      <div>
        <span className="font-semibold">Rate:</span> ${getJobDisplayPrice(job)}
      </div>

      {job.pricing_mode === 'itemized' && job.job_items && job.job_items.length > 0 && (
        <div className="mt-2">
          <span className="font-semibold">Line items:</span>
          <div className="mt-2 space-y-1">
            {job.job_items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.item_name} × {item.quantity}</span>
                <span>${(item.unit_cost * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <span className="font-semibold">Notes:</span> {job.notes || 'N/A'}
      </div>
      {contactEmail && (
        <div>
          <span className="font-semibold">Email:</span> {contactEmail}
        </div>
      )}
      {contactPhone && (
        <div>
          <span className="font-semibold">Phone:</span> {contactPhone}
        </div>
      )}
    </div>
  );
};

export default JobView;
