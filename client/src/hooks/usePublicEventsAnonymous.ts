
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicEvent } from '@/types/eventTypes';

export const usePublicEventsAnonymous = () => {
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
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
