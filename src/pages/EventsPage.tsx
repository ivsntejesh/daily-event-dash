
import { DailyDashboard } from '@/components/DailyDashboard';
import { useEvents } from '@/hooks/useEvents';

export const EventsPage = () => {
  const { events } = useEvents();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Events</h1>
        <p className="text-muted-foreground">
          View and manage your events
        </p>
      </div>
      <DailyDashboard 
        events={events} 
        onEditEvent={() => {}} 
        onDeleteEvent={() => {}} 
      />
    </div>
  );
};
