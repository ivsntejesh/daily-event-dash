
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicTask } from '@/types/taskTypes';

export const usePublicTasksAnonymous = () => {
  const [publicTasks, setPublicTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublicTasks = async () => {
    setLoading(true);
    try {
      // Use the secure function to fetch tasks without sensitive data for anonymous users
      const { data, error } = await supabase
        .rpc('get_public_tasks_safe')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching public tasks:', error);
      } else {
        setPublicTasks(data || []);
      }
    } catch (error) {
      console.error('Error fetching public tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicTasks();
  }, []);

  return {
    publicTasks,
    loading,
    refetch: fetchPublicTasks,
  };
};
