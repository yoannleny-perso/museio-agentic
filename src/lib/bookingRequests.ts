
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import {
  BOOKING_REQUEST_STATUS,
  getBookingRequestEndDate,
  getCanonicalJobStatus,
  type BookingRequestStatus,
} from '@/contracts';

export type BookingRequest = Database['public']['Tables']['booking_requests']['Row'];
export type BookingRequestInsert = Database['public']['Tables']['booking_requests']['Insert'];
export type BookingRequestUpdate = Database['public']['Tables']['booking_requests']['Update'];

/**
 * Fetch all booking requests for the current user
 */
export const fetchBookingRequests = async (): Promise<BookingRequest[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return []; // Return empty array for non-authenticated users
  }

  const { data, error } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('portfolio_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching booking requests:', error);
    throw error;
  }

  return data || [];
};

/**
 * Update a booking request status
 */
export const updateBookingRequestStatus = async (
  id: string, 
  status: BookingRequestStatus
): Promise<BookingRequest> => {
  const { data, error } = await supabase
    .from('booking_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking request:', error);
    throw error;
  }

  return data;
};

/**
 * Delete a booking request
 */
export const deleteBookingRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('booking_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting booking request:', error);
    throw error;
  }
};

/**
 * Convert a booking request to a job
 */
export const convertBookingRequestToJob = async (request: BookingRequest) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use the dedicated time fields if available, otherwise use defaults
  const startTime = request.event_start_time || '09:00';
  const endTime = request.event_end_time || '17:00';
  const endDate = getBookingRequestEndDate(
    request.event_date,
    request.event_end_date
  );

  // Create job data from booking request with idempotency key to avoid duplicates
  const jobData = {
    user_id: user.id,
    title: request.event_name || `Event for ${request.requester_name}`,
    client: request.requester_name,
    contact_name: request.requester_name,
    contact_email: request.requester_email,
    contact_phone: request.phone || null,
    location: request.location || '',
    date: request.event_date,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    rate: request.budget || 0,
    status: getCanonicalJobStatus({
      date: request.event_date,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
    }),
    job_description: request.event_description,
    notes: request.special_requirements ? `Special requirements: ${request.special_requirements}` : 'Created from booking request',
    idempotency_key: `ui-convert:${request.id}`,
  };

  // Insert the new job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert(jobData)
    .select()
    .single();

  if (jobError) {
    console.error('Error creating job from booking request:', jobError);
    throw jobError;
  }

  // Update booking request status to accepted once it has become a job
  await updateBookingRequestStatus(request.id, BOOKING_REQUEST_STATUS.accepted);

  return job;
};
