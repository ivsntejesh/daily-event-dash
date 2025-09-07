
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PublicTask } from '@/types/taskTypes';

export const usePublicTasksAnonymous = () => {
  const [publicTasks, setPublicTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPublicTasks = async () => {
    setLoading(true);
    try {
      // Use enhanced secure function that provides more protection
      const { data, error } = user
        ? await supabase.rpc('get_public_tasks_enhanced_safe')
        : await supabase.rpc('get_public_tasks_safe');

      if (error) {
        console.error('Error fetching public tasks:', error);
      } else {
        const sortedData = (data || []).sort((a: any, b: any) => a.date.localeCompare(b.date));
        setPublicTasks(sortedData);
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
