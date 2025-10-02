
import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { CheckSquare, Calendar, Filter, Plus, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  onNewTask?: () => void;
}

export const TaskDashboard = ({ tasks, onEditTask, onDeleteTask, onToggleComplete, onNewTask }: TaskDashboardProps) => {
  const now = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchive, setShowArchive] = useState(false);
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

  // Separate active and completed tasks
  const activeTasks = filteredTasks.filter(task => !task.isCompleted);
  const completedTasks = filteredTasks.filter(task => task.isCompleted);

  const todayTasks = activeTasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isToday(taskDate);
  }).sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  const tomorrowTasks = activeTasks.filter(task => {
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
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        <h2 className="text-xl font-display font-semibold">{title}</h2>
        <span className="px-2.5 py-0.5 bg-muted rounded-full text-sm font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onDelete={(taskId) => handleDeleteTask(taskId, task.title)}
              onToggleComplete={onToggleComplete}
              showActions={true}
            />
          ))}
        </div>
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-gradient">Task Dashboard</h1>
            <p className="text-base text-muted-foreground">
              {format(now, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {onNewTask && (
            <Button onClick={onNewTask} className="flex items-center gap-2 shadow-md hover-lift">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
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
        
        <div className="flex gap-2 flex-wrap">
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

          <Button
            variant={showArchive ? "default" : "outline"}
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2 transition-all duration-200"
          >
            <Archive className="h-4 w-4" />
            {showArchive ? 'Hide Archive' : 'Show Archive'}
          </Button>
        </div>
      </div>

      {!showArchive ? (
        <>
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
        </>
      ) : (
        <TaskSection
          title="Completed Tasks (Archive)"
          tasks={completedTasks}
          icon={<Archive className="h-5 w-5" />}
        />
      )}

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
