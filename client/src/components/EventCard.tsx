import { format, isToday, isTomorrow, parseISO, isAfter, isBefore } from 'date-fns';
import { Clock, MapPin, Video, Calendar, Globe, ExternalLink, Edit, Trash2, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormattedEvent } from '@/types/eventTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface EventCardProps {
  event: FormattedEvent;
  onEdit?: (event: FormattedEvent) => void;
  onDelete?: (eventId: string) => void;
  showActions?: boolean;
  showDate?: boolean;
}

export const EventCard = ({ event, onEdit, onDelete, showActions = false, showDate = false }: EventCardProps) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const now = new Date();
  
  const isEventOngoing = () => {
    const eventDate = parseISO(event.date);
    if (!isToday(eventDate)) return false;
    
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    
    const eventStart = new Date(eventDate);
    eventStart.setHours(startHours, startMinutes, 0, 0);
    
    const eventEnd = new Date(eventDate);
    eventEnd.setHours(endHours, endMinutes, 0, 0);
    
    return isAfter(now, eventStart) && isBefore(now, eventEnd);
  };

  const formatEventDate = (date: string) => {
    const eventDate = parseISO(date);
    if (isToday(eventDate)) {
      return 'Today';
    } else if (isTomorrow(eventDate)) {
      return 'Tomorrow';
    } else {
      return format(eventDate, 'MMM d, yyyy');
    }
  };

  const ongoing = isEventOngoing();
  const isPublic = event.isPublic;
  
  // Check if the current user can edit this event
  const canEdit = user && (
    (!isPublic) || // Private events can be edited by owner (handled by RLS)
    (isPublic && event.userId === user.id) || // Public events can be edited by creator
    (isPublic && event.userId === null && isAdmin) || // Admins can edit sheet-synced events (user_id is null)
    (isPublic && isAdmin) // Admins can edit any public event
  );

  console.log('EventCard debug:', {
    eventId: event.id,
    eventTitle: event.title,
    isPublic,
    eventUserId: event.userId,
    currentUserId: user?.id,
    isAdmin: isAdmin(),
    canEdit,
    showActions
  });

  return (
    <Card className={`mb-3 ${ongoing ? 'border-green-500 bg-green-50' : ''} ${isPublic ? 'border-blue-200 bg-blue-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {showDate && (
                <>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-primary">
                    {formatEventDate(event.date)} •
                  </span>
                </>
              )}
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {event.startTime} - {event.endTime}
              </span>
              {ongoing && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Ongoing
                </Badge>
              )}
              {isPublic && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
              {isPublic && isAdmin() && event.userId !== user?.id && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin Access
                </Badge>
              )}
            </div>
            <h3 className="font-semibold mb-1">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
            )}
            <div className="flex items-center gap-2 mb-2">
              {event.isOnline ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <Video className="h-4 w-4" />
                  <span className="text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">
                    {event.location || 'In-person'}
                  </span>
                </div>
              )}
            </div>
            {event.isOnline && event.meetingLink && (
              <Button
                variant="outline"
                size="sm"
                className="mb-2"
                onClick={() => window.open(event.meetingLink, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Join Meeting
              </Button>
            )}
            {event.notes && (
              <p className="text-xs text-muted-foreground">{event.notes}</p>
            )}
          </div>
          {showActions && canEdit && (
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(event)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(event.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
