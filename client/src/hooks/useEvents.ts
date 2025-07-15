import { useState, useEffect } from 'react';
import { FormattedEvent } from '@/types/eventTypes';

const apiBase = '';

export const useEvents = () => {
  const [events, setEvents] = useState<FormattedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/events`);
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
          isPublic: false,
          userId: event.userId
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save new event
  const saveEvent = async (eventData: any, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-events' : '/api/events';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        fetchEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // Update event
  const updateEvent = async (id: string, eventData: any, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-events' : '/api/events';
      const response = await fetch(`${apiBase}${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        fetchEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Delete event
  const deleteEvent = async (id: string, isPublic: boolean) => {
    try {
      const endpoint = isPublic ? '/api/public-events' : '/api/events';
      const response = await fetch(`${apiBase}${endpoint}/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchEvents(); // Refresh events
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    saveEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};