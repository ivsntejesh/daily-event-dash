
import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FormattedEvent } from '@/types/eventTypes';
import { EventCard } from '@/components/EventCard';
import { SearchAndFilter, EventFilters } from '@/components/SearchAndFilter';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useEventFiltering } from '@/hooks/useEventFiltering';
import { useToast } from '@/hooks/use-toast';

interface DailyDashboardProps {
  events: FormattedEvent[];
  onEditEvent?: (event: FormattedEvent) => void;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

export const DailyDashboard = ({ events, onEditEvent, onDeleteEvent }: DailyDashboardProps) => {
  const now = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>({
    type: 'all',
    visibility: 'all',
    timeframe: 'all'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; eventId: string; eventTitle: string }>({
    open: false,
    eventId: '',
    eventTitle: ''
  });

  const { toast } = useToast();

  const filteredEvents = useEventFiltering(events, searchQuery, filters);
  
  const todayEvents = filteredEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isToday(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tomorrowEvents = filteredEvents.filter(event => {
    const eventDate = parseISO(event.date);
    return isTomorrow(eventDate);
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setDeleteConfirm({
      open: true,
      eventId,
      eventTitle
    });
  };

  const confirmDelete = async () => {
    try {
      if (onDeleteEvent) {
        await onDeleteEvent(deleteConfirm.eventId);
      }
      setDeleteConfirm({ open: false, eventId: '', eventTitle: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const EventSection = ({ title, events, icon }: { title: string; events: FormattedEvent[]; icon: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">({events.length})</span>
      </div>
      {events.length > 0 ? (
        events.map(event => (
          <EventCard 
            key={event.id} 
            event={event} 
            onEdit={onEditEvent}
            onDelete={(eventId) => handleDeleteEvent(eventId, event.title)}
            showActions={true}
          />
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No events found matching your criteria
          </CardContent>
        </Card>
      )}
    </div>
  );

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

      <EventSection
        title="Today"
        events={todayEvents}
        icon={<Calendar className="h-5 w-5" />}
      />

      <EventSection
        title="Tomorrow"
        events={tomorrowEvents}
        icon={<Calendar className="h-5 w-5" />}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteConfirm.eventTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};
