
import { format, isToday, isTomorrow, parseISO, isAfter, isBefore } from 'date-fns';
import { Clock, MapPin, Video, Calendar, Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormattedEvent } from '@/types/eventTypes';

interface DailyDashboardProps {
  events: FormattedEvent[];
}

export const DailyDashboard = ({ events }: DailyDashboardProps) => {
  const now = new Date();
  
  const todayEvents = events.filter(event => {
    const eventDate = parseISO(event.date);
    return isToday(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tomorrowEvents = events.filter(event => {
    const eventDate = parseISO(event.date);
    return isTomorrow(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const isEventOngoing = (event: FormattedEvent) => {
    const eventDate = parseISO(event.date);
    if (!isToday(eventDate)) return false;
    
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    
    const eventStart = new Date(eventDate);
    eventStart.setHours(startHours, startMinutes, 0, 0);
    
    const eventEnd = new Date(eventDate);
    eventEnd.setHours(endHours, endMinutes, 0, 0);
    
    return isAfter(now, eventStart) && isBefore(now, eventEnd);
  };

  const EventCard = ({ event }: { event: FormattedEvent }) => {
    const ongoing = isEventOngoing(event);
    const isPublic = event.isPublic;
    
    return (
      <Card className={`mb-3 ${ongoing ? 'border-green-500 bg-green-50' : ''} ${isPublic ? 'border-blue-200 bg-blue-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {event.startTime} - {event.endTime}
                </span>
                {ongoing && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ongoing
                  </Badge>
                )}
                {isPublic && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
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
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Daily Dashboard</h1>
        <p className="text-muted-foreground">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Today</h2>
        </div>
        {todayEvents.length > 0 ? (
          todayEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No events scheduled for today
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Tomorrow</h2>
        </div>
        {tomorrowEvents.length > 0 ? (
          tomorrowEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No events scheduled for tomorrow
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
