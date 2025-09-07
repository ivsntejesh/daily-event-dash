import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PublicEvent } from '@/types/eventTypes';

export const usePublicEventsAnonymous = () => {
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      // Use the secure authenticated function if user is logged in
      const { data, error } = user 
        ? await supabase.rpc('get_public_events_authenticated_safe')
        : await supabase.rpc('get_public_events_safe');

      if (error) {
        console.error('Error fetching public events:', error);
      } else {
        // Sort the data by date and start_time
        const sortedData = (data || []).sort((a: any, b: any) => {
          if (a.date === b.date) {
            return a.start_time?.localeCompare(b.start_time || '') || 0;
          }
          return a.date.localeCompare(b.date);
        });
        setPublicEvents(sortedData);
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