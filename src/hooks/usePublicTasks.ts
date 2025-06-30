
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PublicTask } from '@/types/taskTypes';

export const usePublicTasks = () => {
  const [publicTasks, setPublicTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPublicTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_tasks')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching public tasks:', error);
        toast({
          title: "Error",
          description: "Failed to fetch public tasks",
          variant: "destructive",
        });
      } else {
        console.log('Fetched public tasks:', data);
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
  }, [user]);

  const addPublicTask = async (taskData: Omit<PublicTask, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;

    try {
      console.log('Creating public task with user_id:', user.id);
      const { data, error } = await supabase
        .from('public_tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error adding public task:', error);
        toast({
          title: "Error",
          description: "Failed to create public task",
          variant: "destructive",
        });
        return;
      }

      console.log('Created public task:', data);
      setPublicTasks(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Public task created successfully",
      });
    } catch (error) {
      console.error('Error adding public task:', error);
    }
  };

  const updatePublicTask = async (taskId: string, taskData: Partial<PublicTask>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('public_tasks')
        .update(taskData)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating public task:', error);
        toast({
          title: "Error",
          description: "Failed to update public task",
          variant: "destructive",
        });
        return;
      }

      setPublicTasks(prev => 
        prev.map(task => task.id === taskId ? data : task)
      );
      toast({
        title: "Success",
        description: "Public task updated successfully",
      });
    } catch (error) {
      console.error('Error updating public task:', error);
    }
  };

  const deletePublicTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('public_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting public task:', error);
        toast({
          title: "Error",
          description: "Failed to delete public task",
          variant: "destructive",
        });
        return;
      }

      setPublicTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Success",
        description: "Public task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting public task:', error);
    }
  };

  const togglePublicTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    await updatePublicTask(taskId, { is_completed: isCompleted });
  };

  return {
    publicTasks,
    loading,
    addPublicTask,
    updatePublicTask,
    deletePublicTask,
    togglePublicTaskCompletion,
    refetch: fetchPublicTasks,
  };
};
