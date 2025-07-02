import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Clock, MapPin, Video, Calendar, Globe, LogIn, UserPlus, ExternalLink, CheckSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicEventsAnonymous } from '@/hooks/usePublicEventsAnonymous';
import { usePublicTasksAnonymous } from '@/hooks/usePublicTasksAnonymous';
import { formatPublicEvent } from '@/utils/eventUtils';
import { formatPublicTask, getPriorityColor } from '@/utils/taskUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface PublicEventsViewProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const PublicEventsView = ({ onSignIn, onSignUp }: PublicEventsViewProps) => {
  const [viewMode, setViewMode] = useState<'today' | 'monthly'>('today');
  const { publicEvents, loading: eventsLoading } = usePublicEventsAnonymous();
  const { publicTasks, loading: tasksLoading } = usePublicTasksAnonymous();
  const now = new Date();

  if (eventsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading public content..." />;
  }

  const formattedEvents = publicEvents.map(formatPublicEvent);
  const formattedTasks = publicTasks.map(formatPublicTask);

  // Combine events and tasks for today
  const todayEvents = formattedEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isToday(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayTasks = formattedTasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isToday(taskDate);
  }).sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  // Combine events and tasks for tomorrow
  const tomorrowEvents = formattedEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isTomorrow(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tomorrowTasks = formattedTasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isTomorrow(taskDate);
  }).sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  // Monthly view
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const monthlyEvents = formattedEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
  }).sort((a, b) => {
    if (a.date === b.date) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.date.localeCompare(b.date);
  });

  const monthlyTasks = formattedTasks.filter(task => {
    const taskDate = parseISO(task.date);
    return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
  }).sort((a, b) => {
    if (a.date === b.date) {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
    }
    return a.date.localeCompare(b.date);
  });

  const formatTaskDeadline = (date: string, startTime?: string, endTime?: string, showDate = false) => {
    const taskDate = parseISO(date);
    let dateStr = '';
    
    if (showDate) {
      dateStr = format(taskDate, 'MMM d');
    } else if (isToday(taskDate)) {
      dateStr = 'Today';
    } else if (isTomorrow(taskDate)) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = format(taskDate, 'MMM d');
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

  const EventCard = ({ event, showDate = false }: { event: any; showDate?: boolean }) => (
    <Card className="mb-3 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showDate && (
                <span className="text-sm font-medium text-blue-700">
                  {format(parseISO(event.date), 'MMM d')} •
                </span>
              )}
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {event.startTime} - {event.endTime}
              </span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                <Globe className="h-3 w-3 mr-1" />
                Public Event
              </Badge>
            </div>
            <h3 className="font-semibold mb-1">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
            )}
            <div className="flex items-center gap-2 mb-2">
              {event.isOnline ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <Video className="h-4 w-4" />
                  <span className="text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">
                    {event.location || 'In-person'}
                  </span>
                </div>
              )}
            </div>
            {event.isOnline && event.meetingLink && (
              <Button
                variant="outline"
                size="sm"
                className="mb-2"
                onClick={() => window.open(event.meetingLink, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Join Meeting
              </Button>
            )}
            {event.notes && (
              <p className="text-xs text-muted-foreground">{event.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TaskCard = ({ task, showDate = false }: { task: any; showDate?: boolean }) => {
    const priorityColor = getPriorityColor(task.priority || 'medium');
    
    return (
      <Card className="mb-3 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1 text-orange-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {formatTaskDeadline(task.date, task.startTime, task.endTime, showDate)}
                  </span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <Globe className="h-3 w-3 mr-1" />
                  Public Task
                </Badge>
                {task.priority && (
                  <Badge 
                    variant="outline" 
                    className={`${priorityColor.bg} ${priorityColor.text} ${priorityColor.border}`}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              )}
              {task.notes && (
                <p className="text-xs text-muted-foreground">{task.notes}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ContentSection = ({ title, events, tasks, icon }: { 
    title: string; 
    events: any[]; 
    tasks: any[];
    icon: React.ReactNode;
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          ({events.length + tasks.length} items)
        </span>
      </div>
      
      {/* Render all items sorted by time */}
      {[...events, ...tasks]
        .sort((a, b) => {
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return 0;
        })
        .map((item, index) => {
          const isEvent = 'isOnline' in item;
          return isEvent ? (
            <EventCard key={`event-${item.id}-${index}`} event={item} showDate={title.includes('Monthly')} />
          ) : (
            <TaskCard key={`task-${item.id}-${index}`} task={item} showDate={title.includes('Monthly')} />
          );
        })}
      
      {events.length === 0 && tasks.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No public content scheduled for {title.toLowerCase()}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Login/Signup buttons */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">TaskHub</h1>
              <span className="text-sm text-muted-foreground">
                Discover Public Events & Tasks
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onSignIn}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button variant="default" size="sm" onClick={onSignUp}>
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Public Events & Tasks</h1>
          <p className="text-muted-foreground">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'today' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('today')}
              className="rounded-md"
            >
              Today's Schedule
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className="rounded-md"
            >
              Monthly View
            </Button>
          </div>
        </div>

        {viewMode === 'today' ? (
          <>
            <ContentSection
              title="Today"
              events={todayEvents}
              tasks={todayTasks}
              icon={<Calendar className="h-5 w-5" />}
            />

            <ContentSection
              title="Tomorrow"
              events={tomorrowEvents}
              tasks={tomorrowTasks}
              icon={<Calendar className="h-5 w-5" />}
            />
          </>
        ) : (
          <ContentSection
            title={`${format(now, 'MMMM yyyy')} Schedule`}
            events={monthlyEvents}
            tasks={monthlyTasks}
            icon={<Calendar className="h-5 w-5" />}
          />
        )}

        {/* Call to Action */}
        <div className="text-center py-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Want to create your own events and tasks?</h3>
              <p className="text-muted-foreground mb-4">
                Sign up to create and manage your personal and public events & tasks
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onSignUp}>
                  Get Started
                </Button>
                <Button variant="outline" onClick={onSignIn}>
                  Already have an account?
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
