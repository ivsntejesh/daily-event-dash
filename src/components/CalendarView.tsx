
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/event';

interface CalendarViewProps {
  events: Event[];
}

export const CalendarView = ({ events }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    setSelectedDate(null);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

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
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 rounded truncate
                        ${event.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                      `}
                      title={`${event.startTime} - ${event.endTime}: ${event.title}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 2} more
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
              Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-3">
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
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No events scheduled for this date
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
