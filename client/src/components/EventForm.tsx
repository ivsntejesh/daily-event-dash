
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormattedEvent } from '@/types/eventTypes';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EventVisibilitySelector } from './EventVisibilitySelector';
import { EventFormFields } from './EventFormFields';
import { EventLocationFields } from './EventLocationFields';

interface EventFormProps {
  onSave: (event: any, isPublic: boolean) => void;
  onCancel: () => void;
  editingEvent?: FormattedEvent | null;
}

export const EventForm = ({ onSave, onCancel, editingEvent }: EventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    isOnline: false,
    meetingLink: '',
    location: '',
    notes: '',
  });

  const [isPublicEvent, setIsPublicEvent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Direct API calls for event operations
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('EventForm render state:', {
    isEditing: !!editingEvent,
    isPublicEvent,
    editingEvent: editingEvent ? {
      id: editingEvent.id,
      title: editingEvent.title,
      isPublic: editingEvent.isPublic
    } : null
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        date: editingEvent.date,
        startTime: editingEvent.startTime,
        endTime: editingEvent.endTime,
        isOnline: editingEvent.isOnline,
        meetingLink: editingEvent.meetingLink || '',
        location: editingEvent.location || '',
        notes: editingEvent.notes || '',
      });
      setIsPublicEvent(editingEvent.isPublic || false);
    } else {
      // Reset form for new events
      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        isOnline: false,
        meetingLink: '',
        location: '',
        notes: '',
      });
      setIsPublicEvent(false);
    }
  }, [editingEvent]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        if (editingEvent && !editingEvent.isPublic) {
          const eventId = editingEvent.id;
          const updateData = {
            title: formData.title,
            description: formData.description,
            date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime,
            is_online: formData.isOnline,
            meeting_link: formData.meetingLink,
            location: formData.location,
            notes: formData.notes,
          };
          
          await updateEvent(eventId, updateData);
          onCancel();
        } else {
          onSave(formData, isPublicEvent);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isEditing = !!editingEvent;
  const isPublicEventEdit = editingEvent?.isPublic;
  const canEditPublicEvent = isPublicEventEdit && user && editingEvent?.userId === user.id;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditing && (
              <div className="mb-6">
                <EventVisibilitySelector
                  isPublicEvent={isPublicEvent}
                  onVisibilityChange={setIsPublicEvent}
                />
              </div>
            )}

            {isPublicEventEdit && !canEditPublicEvent && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  This is a public event created by another user. You can only view it.
                </p>
              </div>
            )}

            <EventFormFields
              title={formData.title}
              description={formData.description}
              date={formData.date}
              startTime={formData.startTime}
              endTime={formData.endTime}
              notes={formData.notes}
              onTitleChange={(value) => handleInputChange('title', value)}
              onDescriptionChange={(value) => handleInputChange('description', value)}
              onDateChange={(value) => handleInputChange('date', value)}
              onStartTimeChange={(value) => handleInputChange('startTime', value)}
              onEndTimeChange={(value) => handleInputChange('endTime', value)}
              onNotesChange={(value) => handleInputChange('notes', value)}
              errors={errors}
              disabled={isPublicEventEdit && !canEditPublicEvent}
            />

            <EventLocationFields
              isOnline={formData.isOnline}
              meetingLink={formData.meetingLink}
              location={formData.location}
              onIsOnlineChange={(checked) => handleInputChange('isOnline', checked)}
              onMeetingLinkChange={(value) => handleInputChange('meetingLink', value)}
              onLocationChange={(value) => handleInputChange('location', value)}
              disabled={isPublicEventEdit && !canEditPublicEvent}
            />

            <div className="flex gap-3 pt-4">
              {(!isPublicEventEdit || canEditPublicEvent) && (
                <Button type="submit" className="flex-1">
                  {isEditing ? 'Update Event' : 'Save Event'}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onCancel}>
                {(isPublicEventEdit && !canEditPublicEvent) ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
