import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { normalizeDateOnlyString } from '@/contracts';

interface PortfolioEvent {
  id: string;
  event_name: string;
  event_date: string;
  venue: string;
  location: string | null;
  ticket_url: string | null;
  flyer_image_url: string | null;
  is_enabled: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface CreateEventData {
  event_name: string;
  event_date: string;
  venue: string;
  location?: string;
  ticket_url?: string;
  flyer_image_url?: string;
  is_enabled?: boolean;
  display_order?: number;
}

type UpdateEventData = Partial<CreateEventData>;

export const usePortfolioEvents = (sectionId?: string) => {
  const { user } = useAuth();
  const { mode } = usePortfolioMode();
  const { events: contextEvents, loading: contextLoading } = useModedPortfolioData();
  const { profile } = useUserProfile();
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    // In live mode, use events from context instead of making separate query
    if (mode === 'live') {
      if (!contextLoading && contextEvents) {
        let filteredEvents = contextEvents;
        
        // Filter by section_id if provided
        if (sectionId) {
          filteredEvents = contextEvents.filter(event => event.section_id === sectionId);
        }
        
        setEvents(filteredEvents);
      }
      setLoading(contextLoading);
      return;
    }

    // Edit mode - use direct database query
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('portfolio_events')
        .select('*')
        .eq('user_id', user.id);

      // Filter by section_id if provided
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      const { data, error } = await query
        .order('event_date', { ascending: true })
        .limit(40);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [contextEvents, contextLoading, mode, sectionId, user?.id]);

  const createEvent = async (eventData: CreateEventData): Promise<PortfolioEvent | null> => {
    if (mode !== 'edit' || !user) return null;
    
    try {
      const normalizedEventDate = normalizeDateOnlyString(eventData.event_date);

      const { data, error } = await supabase
        .from('portfolio_events')
        .insert({
          ...eventData,
          event_date: normalizedEventDate,
          user_id: user.id,
          section_id: sectionId || null,
          is_enabled: eventData.is_enabled ?? true,
          username: profile?.username || null
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Event created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (id: string, eventData: UpdateEventData): Promise<boolean> => {
    if (mode !== 'edit') return false;
    
    try {
      const normalizedEventDate = eventData.event_date
        ? normalizeDateOnlyString(eventData.event_date)
        : undefined;
      const normalizedEventData = {
        ...eventData,
        ...(normalizedEventDate ? { event_date: normalizedEventDate } : {}),
      };
      const { error } = await supabase
        .from('portfolio_events')
        .update(normalizedEventData)
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...normalizedEventData } : event
      ));

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};
