
// Define interfaces for request and response data
export interface Artist {
  name: string;
  email: string;
  phone?: string;
  artistName?: string;
}

export interface job {
  id: string;
  title: string;
  client: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  formattedDate: string;
  contact_email: string;
  total: string; // Changed from number to string since it's formatted with toFixed(2)
}

export interface JobConfirmationRequest {
  job: job;
  artist: Artist;
  action: 'created' | 'updated' | 'cancelled';
  userId?: string;
  receiveEmailCopy?: boolean;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// Keep backward compatibility
export type jobConfirmationRequest = JobConfirmationRequest;
