
import { useSupabaseTasks } from './useSupabaseTasks';
import { usePublicTasks } from './usePublicTasks';
import { useUserRole } from './useUserRole';
import { combineAndSortTasks } from '@/utils/taskUtils';
import { FormattedTask } from '@/types/taskTypes';

export const useTasks = () => {
  const { 
    tasks: privateTasks, 
    addTask: addPrivateTask, 
    loading: privateLoading,
    updateTask: updatePrivateTask,
    deleteTask: deletePrivateTask,
    toggleTaskCompletion: togglePrivateTaskCompletion
  } = useSupabaseTasks();
  
  const { 
    publicTasks, 
    addPublicTask,
    updatePublicTask,
    deletePublicTask,
    togglePublicTaskCompletion,
    loading: publicLoading 
  } = usePublicTasks();

  const { isAdmin } = useUserRole();

  const allTasks: FormattedTask[] = combineAndSortTasks(privateTasks, publicTasks);
  
  const handleSaveTask = (taskData: any, isPublic: boolean) => {
    const supabaseTaskData = {
      title: taskData.title,
      description: taskData.description,
      date: taskData.date,
      start_time: taskData.startTime || null, // Convert empty string to null
      end_time: taskData.endTime || null, // Convert empty string to null
      is_completed: taskData.isCompleted || false,
      priority: taskData.priority || 'medium',
      notes: taskData.notes,
    };

    if (isPublic) {
      addPublicTask(supabaseTaskData);
    } else {
      addPrivateTask(supabaseTaskData);
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: any, isPublic: boolean) => {
    const supabaseTaskData = {
      title: taskData.title,
      description: taskData.description,
      date: taskData.date,
      start_time: taskData.startTime || null, // Convert empty string to null
      end_time: taskData.endTime || null, // Convert empty string to null
      is_completed: taskData.isCompleted || false,
      priority: taskData.priority || 'medium',
      notes: taskData.notes,
    };

    if (isPublic) {
      // Extract the actual task ID for public tasks (remove 'public-' prefix)
      const actualId = taskId.startsWith('public-') ? taskId.replace('public-', '') : taskId;
      await updatePublicTask(actualId, supabaseTaskData);
    } else {
      await updatePrivateTask(taskId, supabaseTaskData);
    }
  };

  const handleDeleteTask = async (taskId: string, isPublic: boolean) => {
    if (isPublic) {
      // Extract the actual task ID for public tasks (remove 'public-' prefix)
      const actualId = taskId.startsWith('public-') ? taskId.replace('public-', '') : taskId;
      await deletePublicTask(actualId);
    } else {
      await deletePrivateTask(taskId);
    }
  };

  const handleToggleTaskCompletion = async (taskId: string, isCompleted: boolean, isPublic: boolean) => {
    if (isPublic) {
      // Extract the actual task ID for public tasks (remove 'public-' prefix)
      const actualId = taskId.startsWith('public-') ? taskId.replace('public-', '') : taskId;
      await togglePublicTaskCompletion(actualId, isCompleted);
    } else {
      await togglePrivateTaskCompletion(taskId, isCompleted);
    }
  };

  return {
    tasks: allTasks,
    loading: privateLoading || publicLoading,
    saveTask: handleSaveTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    toggleTaskCompletion: handleToggleTaskCompletion,
    isAdmin,
  };
};
