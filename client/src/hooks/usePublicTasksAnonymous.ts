import { useState, useEffect } from 'react';
import { FormattedTask } from '@/types/taskTypes';

const apiBase = '';

export const usePublicTasksAnonymous = () => {
  const [tasks, setTasks] = useState<FormattedTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch public tasks from API
  const fetchPublicTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/public-tasks`);
      if (response.ok) {
        const data = await response.json();
        const formattedTasks: FormattedTask[] = data.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          date: task.date,
          startTime: task.startTime,
          endTime: task.endTime,
          isCompleted: task.isCompleted,
          priority: task.priority,
          notes: task.notes,
          createdAt: task.createdAt,
          isPublic: true,
          userId: task.userId
        }));
        setTasks(formattedTasks);
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
    tasks,
    loading,
    refetch: fetchPublicTasks,
  };
};