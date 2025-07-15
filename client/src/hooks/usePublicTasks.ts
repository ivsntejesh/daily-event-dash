import { useState, useEffect } from 'react';
import { FormattedTask } from '@/types/taskTypes';

const apiBase = '';

export const usePublicTasks = () => {
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

  // Save new public task
  const saveTask = async (taskData: any) => {
    try {
      const response = await fetch(`${apiBase}/api/public-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        fetchPublicTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error saving public task:', error);
    }
  };

  // Update public task
  const updateTask = async (id: string, taskData: any) => {
    try {
      const response = await fetch(`${apiBase}/api/public-tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        fetchPublicTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error updating public task:', error);
    }
  };

  // Delete public task
  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`${apiBase}/api/public-tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchPublicTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error deleting public task:', error);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`${apiBase}/api/public-tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted }),
      });
      
      if (response.ok) {
        fetchPublicTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  useEffect(() => {
    fetchPublicTasks();
  }, []);

  return {
    tasks,
    loading,
    saveTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refetch: fetchPublicTasks,
  };
};