import { useState, useEffect } from 'react';
import { FormattedTask } from '@/types/taskTypes';

const apiBase = '';

export const useTasks = () => {
  const [tasks, setTasks] = useState<FormattedTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/tasks`);
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
          isPublic: false,
          userId: task.userId
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save new task
  const saveTask = async (taskData: any, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-tasks' : '/api/tasks';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Update task
  const updateTask = async (id: string, taskData: any, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-tasks' : '/api/tasks';
      const response = await fetch(`${apiBase}${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete task
  const deleteTask = async (id: string, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-tasks' : '/api/tasks';
      const response = await fetch(`${apiBase}${endpoint}/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (id: string, isCompleted: boolean, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-tasks' : '/api/tasks';
      const response = await fetch(`${apiBase}${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted }),
      });
      
      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    saveTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refetch: fetchTasks,
  };
};