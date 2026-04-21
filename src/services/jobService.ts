import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types';
import { getCanonicalJobStatus, JOB_STATUS } from '@/contracts';

const JOB_WITH_RELATIONS_SELECT = `
  *,
  client_data:clients(
    id,
    venue_name,
    contact_name,
    email_address,
    phone,
    location
  ),
  job_items(
    id,
    item_name,
    unit_cost,
    quantity,
    discount_percent,
    is_taxable,
    sort_order
  )
`;

const fetchJobWithRelations = async (jobId: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_WITH_RELATIONS_SELECT)
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('[jobService] Error fetching job with relations:', error);
    throw error;
  }

  return data;
};

// Fetch all jobs for the logged-in user with client information
export const fetchJobsFromSupabase = async () => {
  
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_WITH_RELATIONS_SELECT)
    .neq('status', 'deleted')  // Exclude soft deleted jobs
    .order('date', { ascending: true });
  
  if (error) {
    console.error('[jobService] Error fetching jobs:', error);
    throw error;
  }
  
  return data || [];
};

// Add a new job
export const addJobToSupabase = async (jobData: Omit<Job, 'id'>, userId: string) => {
  const finalStatus = getCanonicalJobStatus(
    {
      date: jobData.date,
      end_date: jobData.end_date,
      start_time: jobData.start_time,
      end_time: jobData.end_time,
    },
    jobData.status === JOB_STATUS.requested ? JOB_STATUS.requested : undefined,
    { isDraft: jobData.status === JOB_STATUS.drafted }
  );
  
  // Separate job items from job data
  const { job_items, ...jobDataWithoutItems } = jobData;
  
  // Prepare data with both old and new client fields for backward compatibility
  const jobDataWithClient = {
    ...jobDataWithoutItems,
    status: finalStatus,
    user_id: userId,
    // Ensure backward compatibility by keeping both client fields
    client: jobData.client, // Keep existing client name field
    client_id: jobData.client_id || null // Use client_id if provided
  };
  
  const { data: createdJobId, error } = await (supabase as any)
    .rpc('create_job_with_items', {
      p_job: jobDataWithClient,
      p_items: job_items ?? [],
    });

  if (error) {
    console.error('[jobService] Error adding job:', error);
    throw error;
  }

  if (!createdJobId) {
    throw new Error('Job was created without a returned id');
  }

  return await fetchJobWithRelations(createdJobId as string);
};

// Update an existing job
export const updateJobInSupabase = async (id: string, jobData: Partial<Job>) => {
  
  // Separate job items from job data
  const { job_items, ...jobDataWithoutItems } = jobData;
  
  const { data: updatedJobId, error } = await (supabase as any)
    .rpc('update_job_with_items', {
      p_job_id: id,
      p_job_patch: jobDataWithoutItems,
      p_items: job_items === undefined ? null : job_items,
    });
  
  if (error) {
    console.error(`[jobService] Error updating job ${id}:`, error);
    throw error;
  }

  if (!updatedJobId) {
    throw new Error(`Job update for ${id} did not return an id`);
  }
  
  return await fetchJobWithRelations(updatedJobId as string);
};

// Soft delete a job by updating its status to 'deleted'
export const deleteJobFromSupabase = async (id: string) => {
  
  try {
    // Soft delete the job by updating its status to 'deleted'
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'deleted' })
      .eq('id', id);
    
    if (updateError) {
      console.error(`[jobService] Error soft deleting job ${id}:`, updateError);
      throw updateError;
    }
    
    console.log(`[jobService] Successfully soft deleted job ${id}`);
    return true;
  } catch (error) {
    console.error(`[jobService] Exception occurred while soft deleting job ${id}:`, error);
    throw error;
  }
};

/**
 * Update multiple jobs at once with new status values
 * @param jobsToUpdate Array of jobs with updated status values
 * @returns Array of updated job objects or empty array if error
 */
export const batchUpdateJobStatus = async (jobsToUpdate: Job[]): Promise<Job[]> => {
  if (!jobsToUpdate.length) {
    console.log('[jobService] No jobs to update in batch');
    return [];
  }
    
  try {
    // Update each job in the batch
    const updatePromises = jobsToUpdate.map(job => {
      // Create update object with all relevant fields that might have changed
      const updateData: Partial<Job> = {
        status: job.status
      };
      
      // Include end_date if it exists
      if (job.end_date !== undefined) {
        updateData.end_date = job.end_date;
      }
      
      // Include pricing_mode if it exists
      if (job.pricing_mode !== undefined) {
        updateData.pricing_mode = job.pricing_mode;
      }
      
      return supabase
        .from('jobs')
        .update(updateData)
        .eq('id', job.id)
        .select();
    });
    
    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error).map(result => result.error);
    if (errors.length > 0) {
      console.error('[jobService] Errors in batch update:', errors);
      throw new Error(`${errors.length} errors occurred during batch update`);
    }
    
    // Extract updated jobs from results
    const updatedJobs = results
      .map(result => result.data?.[0])
      .filter(Boolean) as Job[];
    
    return updatedJobs;
  } catch (error) {
    console.error('[jobService] Error in batch update:', error);
    throw error;
  }
};
