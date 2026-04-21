import { useState, useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { BookingRequest, fetchBookingRequests, deleteBookingRequest } from '@/lib/bookingRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BOOKING_REQUEST_STATUS } from '@/contracts';

export const useBookingRequests = () => {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated before loading
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBookingRequests([]);
        return;
      }
      
      const requests = await fetchBookingRequests();
      setBookingRequests(requests);
    } catch (err) {
      console.error('Error loading booking requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const sendQuote = async (request: BookingRequest): Promise<boolean> => {
    try {
      toast.success('Quote sent successfully');
      
      // Update local state
      setBookingRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: BOOKING_REQUEST_STATUS.quoted } : r)
      );
      return true;
    } catch (err) {
      console.error('Error sending quote:', err);
      toast.error('Failed to send quote');
      return false;
    }
  };

  const declineRequest = async (requestId: string): Promise<boolean> => {
    try {
      toast.success('Booking request declined');
      
      // Update local state
      setBookingRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: BOOKING_REQUEST_STATUS.declined } : r)
      );
      return true;
    } catch (err) {
      console.error('Error declining booking request:', err);
      toast.error('Failed to decline booking request');
      return false;
    }
  };

  const removeRequest = async (requestId: string): Promise<boolean> => {
    try {
      await deleteBookingRequest(requestId);
      toast.success('Booking request removed');
      
      // Remove from local state
      setBookingRequests(prev => prev.filter(r => r.id !== requestId));
      return true;
    } catch (err) {
      console.error('Error removing booking request:', err);
      toast.error('Failed to remove booking request');
      return false;
    }
  };

useEffect(() => {
  loadBookingRequests();
}, []);

// Realtime updates: keep booking requests in sync when status changes (e.g., accepted)
useEffect(() => {
  let channel: RealtimeChannel | null = null;
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return; // Skip realtime for non-authenticated users
    channel = supabase
      .channel('booking-requests')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'booking_requests',
          filter: `portfolio_user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as BookingRequest;
          setBookingRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        }
      )
      .subscribe();
  });

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}, []);

  return {
    bookingRequests,
    loading,
    error,
    sendQuote,
    declineRequest,
    removeRequest,
    refetch: loadBookingRequests
  };
};
