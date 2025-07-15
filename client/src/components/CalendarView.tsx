
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormattedEvent } from '@/types/eventTypes';
import { FormattedTask } from '@/types/taskTypes';
import { useTasks } from '@/hooks/useTasks';

interface CalendarViewProps {
  events: FormattedEvent[];
}

export const CalendarView = ({ events }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { tasks } = useTasks();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = parseISO(task.date);
      return isSameDay(taskDate, date);
    }).sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    setSelectedDate(null);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[150px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dayEvents = getEventsForDate(day);
            const dayTasks = getTasksForDate(day);
            const totalItems = dayEvents.length + dayTasks.length;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[80px] p-1 border cursor-pointer transition-colors
                  ${isSelected ? 'bg-primary/10 border-primary' : 'border-border'}
                  ${!isCurrentMonth ? 'text-muted-foreground bg-muted/30' : ''}
                  hover:bg-accent
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 1).map(event => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 rounded truncate
                        ${event.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                      `}
                      title={`${format(day, 'MMM d')} ${event.startTime} - ${event.endTime}: ${event.title}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, totalItems > 1 ? 1 : 2).map(task => (
                    <div
                      key={task.id}
                      className={`
                        text-xs p-1 rounded truncate
                        ${task.isPublic ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}
                        ${task.isCompleted ? 'opacity-60 line-through' : ''}
                      `}
                      title={`${format(day, 'MMM d')} Task: ${task.title}`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {totalItems > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{totalItems - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Events & Tasks for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(selectedDateEvents.length > 0 || selectedDateTasks.length > 0) ? (
              <div className="space-y-3">
                {/* Events */}
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {event.startTime} - {event.endTime}
                          </span>
                          <Badge variant={event.isOnline ? 'secondary' : 'default'}>
                            {event.isOnline ? 'Online' : 'In-person'}
                          </Badge>
                          {event.isPublic && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-700">
                              Public Event
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                        )}
                        {event.isOnline && event.meetingLink && (
                          <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Join Meeting
                          </a>
                        )}
                        {!event.isOnline && event.location && (
                          <p className="text-sm text-muted-foreground">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tasks */}
                {selectedDateTasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-3 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          {task.startTime && task.endTime && (
                            <>
                              <span className="text-sm font-medium">
                                {task.startTime} - {task.endTime}
                              </span>
                            </>
                          )}
                          <Badge variant="outline" className="bg-orange-100 text-orange-700">
                            Task
                          </Badge>
                          {task.isPublic && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-700">
                              Public Task
                            </Badge>
                          )}
                          {task.isCompleted && (
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <h3 className={`font-semibold mb-1 ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        {task.priority && (
                          <Badge variant="outline" className="text-xs">
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No events or tasks scheduled for this date
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
