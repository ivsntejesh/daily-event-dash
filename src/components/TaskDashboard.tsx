
import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { CheckSquare, Calendar, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormattedTask } from '@/types/taskTypes';
import { TaskCard } from '@/components/TaskCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

interface TaskDashboardProps {
  tasks: FormattedTask[];
  onEditTask?: (task: FormattedTask) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => Promise<void>;
}

export const TaskDashboard = ({ tasks, onEditTask, onDeleteTask, onToggleComplete }: TaskDashboardProps) => {
  const now = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; taskId: string; taskTitle: string }>({
    open: false,
    taskId: '',
    taskTitle: ''
  });

  const { toast } = useToast();

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'completed' && task.isCompleted) ||
                         (statusFilter === 'pending' && !task.isCompleted);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const todayTasks = filteredTasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isToday(taskDate);
  }).sort((a, b) => {
    // Sort by completion status, then by start time
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  const tomorrowTasks = filteredTasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isTomorrow(taskDate);
  }).sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    setDeleteConfirm({
      open: true,
      taskId,
      taskTitle
    });
  };

  const confirmDelete = async () => {
    try {
      if (onDeleteTask) {
        await onDeleteTask(deleteConfirm.taskId);
      }
      setDeleteConfirm({ open: false, taskId: '', taskTitle: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const TaskSection = ({ title, tasks, icon }: { title: string; tasks: FormattedTask[]; icon: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </div>
      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={onEditTask}
            onDelete={(taskId) => handleDeleteTask(taskId, task.title)}
            onToggleComplete={onToggleComplete}
            showActions={true}
          />
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No tasks found matching your criteria
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Task Dashboard</h1>
        <p className="text-muted-foreground">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TaskSection
        title="Today"
        tasks={todayTasks}
        icon={<CheckSquare className="h-5 w-5" />}
      />

      <TaskSection
        title="Tomorrow"
        tasks={tomorrowTasks}
        icon={<Calendar className="h-5 w-5" />}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteConfirm.taskTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};
