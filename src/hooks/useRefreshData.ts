import { useEvents } from './useEvents';
import { useTasks } from './useTasks';

export const useRefreshData = () => {
  const { 
    events, 
    loading: eventsLoading, 
    saveEvent, 
    updateEvent, 
    deleteEvent,
    isAdmin,
    refetch: refetchEvents
  } = useEvents();
  
  const { 
    tasks, 
    loading: tasksLoading, 
    saveTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion,
    refetch: refetchTasks
  } = useTasks();

  const refreshAll = async () => {
    // Refresh all data using React state management instead of page reload
    await Promise.all([
      refetchEvents(),
      refetchTasks()
    ]);
  };

  return {
    events,
    tasks,
    loading: eventsLoading || tasksLoading,
    saveEvent,
    updateEvent,
    deleteEvent,
    saveTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    isAdmin,
    refreshAll
  };
};