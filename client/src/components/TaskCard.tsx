
import { format, isToday, isTomorrow, parseISO, isAfter, isBefore } from 'date-fns';
import { Clock, CheckCircle, Circle, Calendar, Globe, Edit, Trash2, AlertCircle, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormattedTask } from '@/types/taskTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { getPriorityColor } from '@/utils/taskUtils';

interface TaskCardProps {
  task: FormattedTask;
  onEdit?: (task: FormattedTask) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
  showActions?: boolean;
}

export const TaskCard = ({ task, onEdit, onDelete, onToggleComplete, showActions = false }: TaskCardProps) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const now = new Date();
  
  const isTaskActive = () => {
    const taskDate = parseISO(task.date);
    if (!isToday(taskDate) || !task.startTime || !task.endTime) return false;
    
    const [startHours, startMinutes] = task.startTime.split(':').map(Number);
    const [endHours, endMinutes] = task.endTime.split(':').map(Number);
    
    const taskStart = new Date(taskDate);
    taskStart.setHours(startHours, startMinutes, 0, 0);
    
    const taskEnd = new Date(taskDate);
    taskEnd.setHours(endHours, endMinutes, 0, 0);
    
    return isAfter(now, taskStart) && isBefore(now, taskEnd);
  };

  const active = isTaskActive();
  const isPublic = task.isPublic;
  const priorityColor = getPriorityColor(task.priority || 'medium');
  
  // Check if the current user can edit this task
  const canEdit = user && (
    (!isPublic) || // Private tasks can be edited by owner (handled by RLS)
    (isPublic && task.userId === user.id) || // Public tasks can be edited by creator
    (isPublic && task.userId === null && isAdmin) || // Admins can edit sheet-synced tasks (user_id is null)
    (isPublic && isAdmin) // Admins can edit any public task
  );

  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete(task.id, !task.isCompleted);
    }
  };

  const formatDeadline = (date: string, startTime?: string, endTime?: string) => {
    const taskDate = parseISO(date);
    let dateStr = '';
    
    if (isToday(taskDate)) {
      dateStr = 'Today';
    } else if (isTomorrow(taskDate)) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = format(taskDate, 'MMM d, yyyy');
    }

    // Add time information if available
    if (startTime && endTime) {
      return `${dateStr} (${startTime} - ${endTime})`;
    } else if (startTime) {
      return `${dateStr} at ${startTime}`;
    } else if (endTime) {
      return `${dateStr} by ${endTime}`;
    }
    
    return dateStr;
  };

  return (
    <Card className={`mb-3 ${active ? 'border-blue-500 bg-blue-50' : ''} ${isPublic ? 'border-purple-200 bg-purple-50' : ''} ${task.isCompleted ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {showActions && (
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={handleToggleComplete}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1 text-orange-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {formatDeadline(task.date, task.startTime, task.endTime)}
                  </span>
                </div>
                {active && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Active
                  </Badge>
                )}
                {isPublic && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
                {isPublic && isAdmin() && task.userId !== user?.id && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin Access
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={`${priorityColor.bg} ${priorityColor.text} ${priorityColor.border}`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {task.priority || 'medium'}
                </Badge>
              </div>
              <h3 className={`font-semibold mb-1 ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              )}
              {task.notes && (
                <p className="text-xs text-muted-foreground">{task.notes}</p>
              )}
            </div>
          </div>
          {showActions && canEdit && (
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(task)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
