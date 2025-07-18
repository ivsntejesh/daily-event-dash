
import { useSupabaseEvents } from './useSupabaseEvents';
import { usePublicEvents } from './usePublicEvents';
import { useUserRole } from './useUserRole';
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
    updatePublicEvent,
    deletePublicEvent,
    loading: publicLoading 
  } = usePublicEvents();

  const { isAdmin } = useUserRole();

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

  const handleUpdateEvent = async (eventId: string, eventData: any, isPublic: boolean) => {
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
      // Extract the actual event ID for public events (remove 'public-' prefix)
      const actualId = eventId.startsWith('public-') ? eventId.replace('public-', '') : eventId;
      await updatePublicEvent(actualId, supabaseEventData);
    }
  };

  const handleDeleteEvent = async (eventId: string, isPublic: boolean) => {
    if (isPublic) {
      // Extract the actual event ID for public events (remove 'public-' prefix)
      const actualId = eventId.startsWith('public-') ? eventId.replace('public-', '') : eventId;
      await deletePublicEvent(actualId);
    }
  };

  return {
    events: allEvents,
    loading: privateLoading || publicLoading,
    saveEvent: handleSaveEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    isAdmin,
  };
};
