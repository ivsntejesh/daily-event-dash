
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
        bg: 'bg-priority-high/10',
        text: 'text-priority-high',
        border: 'border-priority-high/30'
      };
    case 'medium':
      return {
        bg: 'bg-priority-medium/10',
        text: 'text-priority-medium',
        border: 'border-priority-medium/30'
      };
    case 'low':
      return {
        bg: 'bg-priority-low/10',
        text: 'text-priority-low',
        border: 'border-priority-low/30'
      };
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-muted'
      };
  }
};
