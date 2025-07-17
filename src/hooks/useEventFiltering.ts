
import { useMemo } from 'react';
import { FormattedEvent } from '@/types/eventTypes';
import { EventFilters } from '@/components/SearchAndFilter';
import { isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const useEventFiltering = (events: FormattedEvent[], searchQuery: string, filters: EventFilters) => {
  return useMemo(() => {
    let filteredEvents = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.notes?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        if (filters.type === 'online') return event.isOnline;
        if (filters.type === 'in-person') return !event.isOnline;
        return true;
      });
    }

    // Apply visibility filter
    if (filters.visibility !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        if (filters.visibility === 'public') return event.isPublic;
        if (filters.visibility === 'private') return !event.isPublic;
        return true;
      });
    }

    // Apply timeframe filter
    if (filters.timeframe !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = parseISO(event.date);
        
        switch (filters.timeframe) {
          case 'today':
            return isToday(eventDate);
          case 'tomorrow':
            return isTomorrow(eventDate);
          case 'this-week':
            const now = new Date();
            return isWithinInterval(eventDate, {
              start: startOfWeek(now),
              end: endOfWeek(now)
            });
          default:
            return true;
        }
      });
    }

    return filteredEvents;
  }, [events, searchQuery, filters]);
};
