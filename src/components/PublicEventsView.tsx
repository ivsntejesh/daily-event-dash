
import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Clock, MapPin, Video, Calendar, Globe, LogIn, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicEventsAnonymous } from '@/hooks/usePublicEventsAnonymous';
import { formatPublicEvent } from '@/utils/eventUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface PublicEventsViewProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const PublicEventsView = ({ onSignIn, onSignUp }: PublicEventsViewProps) => {
  const [viewMode, setViewMode] = useState<'today' | 'monthly'>('today');
  const { publicEvents, loading } = usePublicEventsAnonymous();
  const now = new Date();

  if (loading) {
    return <LoadingSpinner message="Loading public events..." />;
  }

  const formattedEvents = publicEvents.map(formatPublicEvent);

  const todayEvents = formattedEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isToday(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tomorrowEvents = formattedEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isTomorrow(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

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

  const EventCard = ({ event }: { event: any }) => (
    <Card className="mb-3 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {event.startTime} - {event.endTime}
              </span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            </div>
            <h3 className="font-semibold mb-1">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
            )}
            <div className="flex items-center gap-2">
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
            {event.notes && (
              <p className="text-xs text-muted-foreground mt-2">{event.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Login/Signup buttons */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">EventHub</h1>
              <span className="text-sm text-muted-foreground">
                Discover Public Events
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
          <h1 className="text-2xl font-bold mb-2">Public Events</h1>
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
              Today's Events
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className="rounded-md"
            >
              Monthly Events
            </Button>
          </div>
        </div>

        {viewMode === 'today' ? (
          <>
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
                    No public events scheduled for today
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
                    No public events scheduled for tomorrow
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                {format(now, 'MMMM yyyy')} Events
              </h2>
            </div>
            {monthlyEvents.length > 0 ? (
              monthlyEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No public events scheduled for this month
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center py-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Want to create your own events?</h3>
              <p className="text-muted-foreground mb-4">
                Sign up to create and manage your personal and public events
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
