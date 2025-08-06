
import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Calendar, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FormattedEvent } from '@/types/eventTypes';
import { FormattedTask } from '@/types/taskTypes';
import { EventCard } from '@/components/EventCard';
import { TaskCard } from '@/components/TaskCard';
import { SearchAndFilter, EventFilters } from '@/components/SearchAndFilter';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useEventFiltering } from '@/hooks/useEventFiltering';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

interface DailyDashboardProps {
  events: FormattedEvent[];
  onEditEvent?: (event: FormattedEvent) => void;
  onDeleteEvent?: (eventId: string) => Promise<void>;
  onEditTask?: (task: FormattedTask) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  showDates?: boolean;
}

export const DailyDashboard = ({ events: propsEvents, onEditEvent, onDeleteEvent, onEditTask, onDeleteTask, showDates = true }: DailyDashboardProps) => {
  const { events: hookEvents } = useEvents();
  const events = propsEvents || hookEvents;
  const now = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>({
    type: 'all',
    visibility: 'all',
    timeframe: 'all'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; itemId: string; itemTitle: string; itemType: 'event' | 'task' }>({
    open: false,
    itemId: '',
    itemTitle: '',
    itemType: 'event'
  });

  const { toast } = useToast();
  const { tasks, toggleTaskCompletion, deleteTask: handleTaskDelete } = useTasks();

  const filteredEvents = useEventFiltering(events, searchQuery, filters);
  
  const todayEvents = filteredEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isToday(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tomorrowEvents = filteredEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isTomorrow(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayTasks = tasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isToday(taskDate);
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const tomorrowTasks = tasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isTomorrow(taskDate);
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setDeleteConfirm({
      open: true,
      itemId: eventId,
      itemTitle: eventTitle,
      itemType: 'event'
    });
  };

  const handleDeleteTaskItem = (taskId: string, taskTitle: string) => {
    setDeleteConfirm({
      open: true,
      itemId: taskId,
      itemTitle: taskTitle,
      itemType: 'task'
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.itemType === 'event' && onDeleteEvent) {
        await onDeleteEvent(deleteConfirm.itemId);
      } else if (deleteConfirm.itemType === 'task') {
        const task = tasks.find(t => t.id === deleteConfirm.itemId);
        if (task) {
          await handleTaskDelete(deleteConfirm.itemId, task.isPublic || false);
        }
      }
      setDeleteConfirm({ open: false, itemId: '', itemTitle: '', itemType: 'event' });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${deleteConfirm.itemType}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await toggleTaskCompletion(taskId, isCompleted, task.isPublic || false);
    }
  };

  const EventTaskSection = ({ title, events, tasks, icon }: { title: string; events: FormattedEvent[]; tasks: FormattedTask[]; icon: React.ReactNode }) => {
    const totalItems = events.length + tasks.length;
    
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-muted-foreground">({totalItems})</span>
        </div>
        {totalItems > 0 ? (
          <div className="space-y-2">
            {events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEdit={onEditEvent}
                onDelete={(eventId) => handleDeleteEvent(eventId, event.title)}
                showActions={true}
                showDate={showDates}
              />
            ))}
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask}
                onDelete={(taskId) => handleDeleteTaskItem(taskId, task.title)}
                onToggleComplete={handleToggleTask}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No events or tasks found
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Daily Dashboard</h1>
        <p className="text-muted-foreground">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <SearchAndFilter
        onSearch={setSearchQuery}
        onFilterChange={setFilters}
        filters={filters}
      />

      <EventTaskSection
        title="Today"
        events={todayEvents}
        tasks={todayTasks}
        icon={<Calendar className="h-5 w-5" />}
      />

      <EventTaskSection
        title="Tomorrow"
        events={tomorrowEvents}
        tasks={tomorrowTasks}
        icon={<Calendar className="h-5 w-5" />}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title={`Delete ${deleteConfirm.itemType === 'event' ? 'Event' : 'Task'}`}
        description={`Are you sure you want to delete "${deleteConfirm.itemTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};
