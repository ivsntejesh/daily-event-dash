
import { usePublicEventsAnonymous } from '@/hooks/usePublicEventsAnonymous';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const PublicEventsPage = () => {
  const { publicEvents, loading } = usePublicEventsAnonymous();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Public Events</h1>
        <p className="text-muted-foreground">
          View all public events and activities
        </p>
      </div>
      
      <div className="space-y-4">
        {publicEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="text-lg">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {event.description && (
                <p className="text-muted-foreground mb-2">{event.description}</p>
              )}
              <div className="text-sm text-gray-500">
                <div>Date: {format(new Date(event.date), 'MMM d, yyyy')}</div>
                <div>Time: {event.start_time} - {event.end_time}</div>
                {event.location && <div>Location: {event.location}</div>}
                {event.is_online && <Badge variant="outline">Online</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
