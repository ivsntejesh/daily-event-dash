
import { useSupabaseEvents } from './useSupabaseEvents';
import { usePublicEvents } from './usePublicEvents';
import { combineAndSortEvents } from '@/utils/eventUtils';
import { FormattedEvent } from '@/types/eventTypes';

export const useEvents = () => {
  const { 
    events: privateEvents, 
    addEvent: addPrivateEvent, 
    loading: privateLoading 
  } = useSupabaseEvents();
  
  const { 
    publicEvents, 
    addPublicEvent, 
    loading: publicLoading 
  } = usePublicEvents();

  const allEvents: FormattedEvent[] = combineAndSortEvents(privateEvents, publicEvents);
  
  const handleSaveEvent = (eventData: any, isPublic: boolean) => {
    const supabaseEventData = {
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      is_online: eventData.isOnline,
      meeting_link: eventData.meetingLink,
      location: eventData.location,
      notes: eventData.notes,
    };

    if (isPublic) {
      addPublicEvent(supabaseEventData);
    } else {
      addPrivateEvent(supabaseEventData);
    }
  };

  return {
    events: allEvents,
    loading: privateLoading || publicLoading,
    saveEvent: handleSaveEvent,
  };
};
