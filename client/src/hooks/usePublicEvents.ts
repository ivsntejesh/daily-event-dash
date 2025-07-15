import { useState, useEffect } from 'react';
import { FormattedEvent } from '@/types/eventTypes';

const apiBase = '';

export const usePublicEvents = () => {
  const [events, setEvents] = useState<FormattedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch public events from API
  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/public-events`);
      if (response.ok) {
        const data = await response.json();
        const formattedEvents: FormattedEvent[] = data.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          isOnline: event.isOnline,
          meetingLink: event.meetingLink,
          location: event.location,
          notes: event.notes,
          createdAt: event.createdAt,
          isPublic: true,
          userId: event.userId
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching public events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save new public event
  const saveEvent = async (eventData: any) => {
    try {
      const response = await fetch(`${apiBase}/api/public-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        fetchPublicEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Error saving public event:', error);
    }
  };

  // Update public event
  const updateEvent = async (id: string, eventData: any) => {
    try {
      const response = await fetch(`${apiBase}/api/public-events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        fetchPublicEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Error updating public event:', error);
    }
  };

  // Delete public event
  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`${apiBase}/api/public-events/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchPublicEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Error deleting public event:', error);
    }
  };

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  return {
    events,
    loading,
    saveEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchPublicEvents,
  };
};