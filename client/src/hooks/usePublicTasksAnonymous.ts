
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicTask } from '@/types/taskTypes';

export const usePublicTasksAnonymous = () => {
  const [publicTasks, setPublicTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublicTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_tasks')
        .select('*')
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
