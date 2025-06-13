
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  is_online: boolean;
  meeting_link?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export const useSupabaseEvents = () => {
  const [events, setEvents] = useState<SupabaseEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive",
        });
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const addEvent = async (eventData: Omit<SupabaseEvent, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding event:', error);
        toast({
          title: "Error",
          description: "Failed to create event",
          variant: "destructive",
        });
        return;
      }

      setEvents(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const updateEvent = async (id: string, updates: Partial<SupabaseEvent>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive",
        });
        return;
      }

      setEvents(prev => prev.map(event => 
        event.id === id ? data : event
      ));
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
        return;
      }

      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
