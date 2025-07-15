import { useState, useEffect } from 'react';
import { FormattedEvent } from '@/types/eventTypes';

const apiBase = '';

export const usePublicEventsAnonymous = () => {
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

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  return {
    events,
    loading,
    refetch: fetchPublicEvents,
  };
};