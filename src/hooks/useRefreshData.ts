import { useEvents } from './useEvents';
import { useTasks } from './useTasks';

export const useRefreshData = () => {
  const { 
    events, 
    loading: eventsLoading, 
    saveEvent, 
    updateEvent, 
    deleteEvent,
    isAdmin 
  } = useEvents();
  
  const { 
    tasks, 
    loading: tasksLoading, 
    saveTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion 
  } = useTasks();

  const refreshAll = () => {
    // Force a complete refresh of all data
    window.location.reload();
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