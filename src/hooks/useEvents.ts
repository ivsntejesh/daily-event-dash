
import { useState, useEffect } from 'react';
import { Event } from '@/types/event';

const STORAGE_KEY = 'student-events';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedEvents = JSON.parse(stored);
        // Migration: convert old events with 'time' to new format with 'startTime' and 'endTime'
        const migratedEvents = parsedEvents.map((event: any) => {
          if (event.time && !event.startTime) {
            return {
              ...event,
              startTime: event.time,
              endTime: event.time, // Default end time same as start time for old events
            };
          }
          return event;
        });
        setEvents(migratedEvents);
        
        // Save migrated events back to storage
        if (migratedEvents.some((event: any, index: number) => event !== parsedEvents[index])) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedEvents));
        }
      } catch (error) {
        console.error('Error parsing stored events:', error);
      }
    }
  }, []);

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
  };

  const addEvent = (event: Omit<Event, 'id' | 'createdAt'>) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveEvents([...events, newEvent]);
  };

  const deleteEvent = (id: string) => {
    saveEvents(events.filter(event => event.id !== id));
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    saveEvents(events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
  };

  return {
    events,
    addEvent,
    deleteEvent,
    updateEvent,
  };
};
