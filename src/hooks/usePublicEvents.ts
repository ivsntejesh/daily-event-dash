
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PublicEvent {
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

  return {
    publicEvents,
    loading,
    refetch: fetchPublicEvents,
  };
};
