
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormattedEvent } from '@/types/eventTypes';
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { useToast } from '@/hooks/use-toast';

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
  const { updateEvent } = useSupabaseEvents();
  const { toast } = useToast();

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
          // Update existing private event
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
          onCancel(); // Go back to dashboard
        } else {
          // Create new event
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
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isEditing = !!editingEvent;
  const isPublicEventEdit = editingEvent?.isPublic;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditing && (
              <div>
                <Label className="text-base font-medium">Event Visibility</Label>
                <RadioGroup
                  value={isPublicEvent ? 'public' : 'private'}
                  onValueChange={(value) => setIsPublicEvent(value === 'public')}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="cursor-pointer">
                      Private Event - Only visible to you
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="cursor-pointer">
                      Public Event - Visible to all users
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {isPublicEventEdit && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  This is a public event. Public events cannot be edited - only deleted and recreated.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
                disabled={isPublicEventEdit}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                disabled={isPublicEventEdit}
              />
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
                disabled={isPublicEventEdit}
              />
              {errors.date && (
                <p className="text-sm text-red-500 mt-1">{errors.date}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={errors.startTime ? 'border-red-500' : ''}
                  disabled={isPublicEventEdit}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={errors.endTime ? 'border-red-500' : ''}
                  disabled={isPublicEventEdit}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isOnline"
                checked={formData.isOnline}
                onCheckedChange={(checked) => handleInputChange('isOnline', checked)}
                disabled={isPublicEventEdit}
              />
              <Label htmlFor="isOnline">Online Event</Label>
            </div>

            {formData.isOnline ? (
              <div>
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  disabled={isPublicEventEdit}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Room 101, Building A"
                  disabled={isPublicEventEdit}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                disabled={isPublicEventEdit}
              />
            </div>

            <div className="flex gap-3 pt-4">
              {!isPublicEventEdit && (
                <Button type="submit" className="flex-1">
                  {isEditing ? 'Update Event' : 'Save Event'}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onCancel}>
                {isPublicEventEdit ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
