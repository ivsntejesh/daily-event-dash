
import { PrivateTask, PublicTask, FormattedTask } from '@/types/taskTypes';

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

export const sortTasksByDateTime = (tasks: FormattedTask[]): FormattedTask[] => {
  return tasks.sort((a, b) => {
    // Sort by date first
    if (a.date === b.date) {
      // If times exist, sort by start time
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      // Tasks without time come after tasks with time
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      // If neither has time, sort by creation date
      return a.createdAt.localeCompare(b.createdAt);
    }
    return a.date.localeCompare(b.date);
  });
};

export const combineAndSortTasks = (
  privateTasks: PrivateTask[],
  publicTasks: PublicTask[]
): FormattedTask[] => {
  const formattedPrivateTasks = privateTasks.map(formatPrivateTask);
  const formattedPublicTasks = publicTasks.map(formatPublicTask);
  
  return sortTasksByDateTime([...formattedPrivateTasks, ...formattedPublicTasks]);
};

export const getPriorityColor = (priority?: string): string => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
