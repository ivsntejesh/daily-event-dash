
import { PrivateEvent, PublicEvent, FormattedEvent } from '@/types/eventTypes';

export const formatPrivateEvent = (event: PrivateEvent): FormattedEvent => ({
  id: event.id,
  title: event.title,
  description: event.description,
  date: event.date,
  startTime: event.start_time,
  endTime: event.end_time,
  isOnline: event.is_online,
  meetingLink: event.meeting_link,
  location: event.location,
  notes: event.notes,
  createdAt: event.created_at,
  isPublic: false,
});

export const formatPublicEvent = (event: PublicEvent): FormattedEvent => ({
  id: `public-${event.id}`,
  title: `🌐 ${event.title}`,
  description: event.description,
  date: event.date,
  startTime: event.start_time,
  endTime: event.end_time,
  isOnline: event.is_online,
  meetingLink: event.meeting_link,
  location: event.location,
  notes: event.notes,
  createdAt: event.created_at,
  isPublic: true,
});

export const sortEventsByDateTime = (events: FormattedEvent[]): FormattedEvent[] => {
  return events.sort((a, b) => {
    if (a.date === b.date) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.date.localeCompare(b.date);
  });
};

export const combineAndSortEvents = (
  privateEvents: PrivateEvent[],
  publicEvents: PublicEvent[]
): FormattedEvent[] => {
  const formattedPrivateEvents = privateEvents.map(formatPrivateEvent);
  const formattedPublicEvents = publicEvents.map(formatPublicEvent);
  
  return sortEventsByDateTime([...formattedPrivateEvents, ...formattedPublicEvents]);
};
