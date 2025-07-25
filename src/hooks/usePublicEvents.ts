
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PublicEvent } from '@/types/eventTypes';

export const usePublicEvents = () => {
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPublicEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching public events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch public events",
          variant: "destructive",
        });
      } else {
        console.log('Fetched public events:', data);
        setPublicEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching public events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicEvents();
  }, [user]);

  const addPublicEvent = async (eventData: Omit<PublicEvent, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;

    try {
      console.log('Creating public event with user_id:', user.id);
      const { data, error } = await supabase
        .from('public_events')
        .insert([{ ...eventData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error adding public event:', error);
        toast({
          title: "Error",
          description: "Failed to create public event",
          variant: "destructive",
        });
        return;
      }

      console.log('Created public event:', data);
      setPublicEvents(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Public event created successfully",
      });
    } catch (error) {
      console.error('Error adding public event:', error);
    }
  };

  const updatePublicEvent = async (eventId: string, eventData: Partial<PublicEvent>) => {
    if (!user) return;

    try {
      // Allow update if user is the owner OR if user is admin (for sheet-synced events)
      const { data, error } = await supabase
        .from('public_events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating public event:', error);
        toast({
          title: "Error",
          description: "Failed to update public event",
          variant: "destructive",
        });
        return;
      }

      setPublicEvents(prev => 
        prev.map(event => event.id === eventId ? data : event)
      );
      toast({
        title: "Success",
        description: "Public event updated successfully",
      });
    } catch (error) {
      console.error('Error updating public event:', error);
    }
  };

  const deletePublicEvent = async (eventId: string) => {
    if (!user) return;

    try {
      // Allow delete if user is the owner OR if user is admin (for sheet-synced events)
      const { error } = await supabase
        .from('public_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting public event:', error);
        toast({
          title: "Error",
          description: "Failed to delete public event",
          variant: "destructive",
        });
        return;
      }

      setPublicEvents(prev => prev.filter(event => event.id !== eventId));
      toast({
        title: "Success",
        description: "Public event deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting public event:', error);
    }
  };

  return {
    publicEvents,
    loading,
    addPublicEvent,
    updatePublicEvent,
    deletePublicEvent,
    refetch: fetchPublicEvents,
  };
};
