
import { useState } from 'react';
import { DailyDashboard } from '@/components/DailyDashboard';
import { EventForm } from '@/components/EventForm';
import { useEvents } from '@/hooks/useEvents';
import { FormattedEvent } from '@/types/eventTypes';

export const EventsPage = () => {
  const { events, deleteEvent, updateEvent } = useEvents();
  const [editingEvent, setEditingEvent] = useState<FormattedEvent | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event && deleteEvent) {
      await deleteEvent(eventId, event.isPublic || false);
    }
  };

  const handleEditEvent = (event: FormattedEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleSaveEvent = async (eventData: any, isPublic: boolean) => {
    if (editingEvent && updateEvent) {
      await updateEvent(editingEvent.id, eventData, editingEvent.isPublic || false);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <EventForm
          onSave={handleSaveEvent}
          onCancel={handleCancelEdit}
          editingEvent={editingEvent}
        />
      </div>
    );
  }

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
        onEditEvent={handleEditEvent} 
        onDeleteEvent={handleDeleteEvent}
        showDates={true}
      />
    </div>
  );
};
