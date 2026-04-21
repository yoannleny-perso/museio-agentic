
import { Job } from '@/types';
import { getCanonicalJobStatus } from '@/contracts/jobLifecycle';

/**
 * Transforms raw job data from Supabase to application Job model
 */
export const mapToJob = (jobData: any): Job => {
  // Use client data from join if available, fallback to direct job fields for backward compatibility
  const clientData = jobData.client_data;
  
  return {
    id: jobData.id,
    title: jobData.title,
    location: jobData.location,
    date: jobData.date,
    end_date: jobData.end_date || jobData.date, // Add end_date with fallback to date
    start_time: jobData.start_time,
    end_time: jobData.end_time,
    rate: jobData.rate,
    status: getCanonicalJobStatus(
      {
        date: jobData.date,
        end_date: jobData.end_date || jobData.date,
        start_time: jobData.start_time,
        end_time: jobData.end_time,
      },
      jobData.status,
      {
        isDraft: jobData.status === 'drafted',
      }
    ),
    // Use client reference if available, fallback to direct client field
    client: clientData?.venue_name || jobData.client,
    client_id: jobData.client_id,
    client_data: clientData, // Include the full client data object
    // Use client data if available, fallback to job fields for backward compatibility
    contact_name: clientData?.contact_name || jobData.contact_name,
    contact_email: clientData?.email_address || jobData.contact_email,
    contact_phone: clientData?.phone || jobData.contact_phone,
    notes: jobData.notes || '',
    job_number: jobData.job_number || '',
    job_description: jobData.job_description || '',
    // Include job items if present
    job_items: jobData.job_items ? jobData.job_items.sort((a: any, b: any) => a.sort_order - b.sort_order) : undefined,
    // Add pricing_mode with backward compatibility fallback
    pricing_mode: jobData.pricing_mode || (jobData.job_items?.length > 0 ? 'itemized' : 'simple')
  };
};

/**
 * Transforms multiple job records from Supabase to application Job models
 */
export const mapToJobs = (jobsData: any[]): Job[] => {
  return jobsData.map(mapToJob);
};
