
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicEvent } from '@/types/eventTypes';

export const usePublicEventsAnonymous = () => {
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      // Use the secure function to fetch events without sensitive data for anonymous users
      const { data, error } = await supabase
        .rpc('get_public_events_safe')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching public events:', error);
      } else {
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
  }, []);

  return {
    publicEvents,
    loading,
    refetch: fetchPublicEvents,
  };
};
