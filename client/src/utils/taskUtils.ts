
import { format, parseISO } from 'date-fns';
import { FormattedTask, PrivateTask, PublicTask } from '@/types/taskTypes';

export const formatPrivateTask = (task: PrivateTask): FormattedTask => ({
  id: task.id,
  title: task.title,
  description: task.description,
  date: task.date,
  startTime: task.start_time,
  endTime: task.end_time,
  isCompleted: task.is_completed,
  priority: task.priority,
  notes: task.notes,
  createdAt: task.created_at,
  isPublic: false,
  userId: task.user_id,
});

export const formatPublicTask = (task: PublicTask): FormattedTask => ({
  id: `public-${task.id}`,
  title: task.title,
  description: task.description,
  date: task.date,
  startTime: task.start_time,
  endTime: task.end_time,
  isCompleted: task.is_completed,
  priority: task.priority,
  notes: task.notes,
  createdAt: task.created_at,
  isPublic: true,
  userId: task.user_id,
});

export const combineAndSortTasks = (privateTasks: PrivateTask[], publicTasks: PublicTask[]): FormattedTask[] => {
  const formattedPrivateTasks = privateTasks.map(formatPrivateTask);
  const formattedPublicTasks = publicTasks.map(formatPublicTask);
  
  const allTasks = [...formattedPrivateTasks, ...formattedPublicTasks];
  
  return allTasks.sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    
    return 0;
  });
};

export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300'
      };
    case 'low':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300'
      };
  }
};
